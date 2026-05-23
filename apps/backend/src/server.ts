import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server as SocketIOServer } from 'socket.io';
import { SocketEvents } from '@fun-notification/socket-contracts';
import { ClientConnectionInfo, ClientRegistration, NotificationPayload } from '@fun-notification/shared-types';
import { initializeDatabase, query } from './db/connection.js';
import { notificationQueue, setNotificationProcessedCallback } from './queue/notification-queue.js';

const fastify = Fastify({
  logger: true
});

// Enable CORS for all REST endpoints (dashboard runs on a different port)
await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

let io: SocketIOServer;
let globalMute = false;

// Maps to track active connections in memory (integrated with Redis in Phase 2)
const activeConnections = new Map<string, ClientConnectionInfo>();
const userConnections = new Map<string, Set<string>>();

fastify.get('/', async () => {
  return {
    status: 'ok',
    name: 'Fun Notification System API',
    version: '1.0.0',
    globalMute
  };
});

// GET route to query recent notifications
fastify.get('/api/notifications', async (request, reply) => {
  try {
    const result = await query(
      `SELECT id, sender_id as "senderId", sender_name as "senderName", recipient_id as "recipientId", message, theme, delivered, expires_at as "expiresAt", created_at as "createdAt"
       FROM notifications 
       ORDER BY created_at DESC LIMIT 20`
    );
    return result.rows;
  } catch (err: any) {
    fastify.log.error('Failed to query notifications:', err.message);
    reply.status(500);
    return { error: 'Internal Server Error', message: err.message };
  }
});

// POST route to dispatch animated notifications
fastify.post('/api/notifications', async (request, reply) => {
  const body = request.body as any;

  if (globalMute) {
    reply.status(403);
    return { error: 'Notifications are disabled: global admin mute is active.' };
  }

  // Basic validation
  if (!body.senderId || !body.senderName || !body.recipientId || !body.message || !body.theme) {
    reply.status(400);
    return { error: 'Missing required fields: senderId, senderName, recipientId, message, theme' };
  }

  // Create notification payload
  const notification: NotificationPayload = {
    id: `notif_${Math.random().toString(36).substring(2, 9)}`,
    senderId: body.senderId,
    senderName: body.senderName,
    recipientId: body.recipientId,
    message: body.message,
    theme: body.theme,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + (body.expiresInMs || 300000)).toISOString() // default 5 minutes
  };

  try {
    // Add job to BullMQ queue
    await notificationQueue.add('dispatch-notification', notification);
    fastify.log.info(`Enqueued notification ${notification.id} for ${notification.recipientId} in BullMQ`);
    
    return { success: true, notification };
  } catch (err: any) {
    fastify.log.error('Failed to enqueue notification in BullMQ:', err.message);
    reply.status(500);
    return { error: 'Internal Server Error', message: err.message };
  }
});

// Admin endpoint to toggle global mute
fastify.post('/api/admin/mute', async (request, reply) => {
  const body = request.body as any;
  if (body.muted === undefined) {
    reply.status(400);
    return { error: 'Missing required field: muted' };
  }
  globalMute = !!body.muted;
  if (io) {
    io.emit(SocketEvents.MUTE_GLOBAL, { muted: globalMute });
  }
  fastify.log.info(`[Admin] Global mute state updated to: ${globalMute}`);
  return { success: true, muted: globalMute };
});

// Admin endpoint to stop all client overlays
fastify.post('/api/admin/stop', async (request, reply) => {
  if (io) {
    io.emit(SocketEvents.STOP_ALL_NOTIFICATIONS, {});
  }
  fastify.log.info(`[Admin] STOP_ALL_NOTIFICATIONS broadcasted to all clients`);
  return { success: true, message: 'Stop signal broadcasted' };
});

// Admin endpoint to dismiss a specific notification
fastify.post('/api/admin/dismiss/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  if (!id) {
    reply.status(400);
    return { error: 'Missing notification ID' };
  }
  if (io) {
    io.emit(SocketEvents.DISMISS_NOTIFICATION, { notificationId: id });
  }
  
  // Also update PostgreSQL to delivered/dismissed
  try {
    await query(
      `UPDATE notifications SET delivered = TRUE WHERE id = $1`,
      [id]
    );
    fastify.log.info(`[Admin] Notification ${id} marked as delivered/dismissed in PostgreSQL`);
  } catch (dbErr: any) {
    fastify.log.error(`[Admin] Failed to update PostgreSQL status for notification ${id}: ${dbErr.message}`);
  }
  
  return { success: true, dismissedId: id };
});

const start = async () => {
  try {
    // 1. Initialize PostgreSQL database and tables
    await initializeDatabase();

    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    await fastify.listen({ port, host });
    
    // Attach Socket.IO server to the Fastify HTTP server
    io = new SocketIOServer(fastify.server, {
      cors: {
        origin: '*', // Allow all origins for dev simplicity
        methods: ['GET', 'POST']
      }
    });

    fastify.log.info('Socket.IO server successfully attached');

    // 2. Wire up the BullMQ worker callback to broadcast via Socket.IO
    setNotificationProcessedCallback((notification: NotificationPayload) => {
      io.to(`user:${notification.recipientId}`).emit(SocketEvents.NOTIFICATION, notification);
      fastify.log.info(`Broadcasted notification ${notification.id} to user:${notification.recipientId}`);
    });

    io.on('connection', (socket) => {
      fastify.log.info(`New socket connection established: ${socket.id}`);

      // Handle Registration
      socket.on(SocketEvents.REGISTER, async (registrationData: ClientRegistration) => {
        fastify.log.info(`Register event received for user: ${registrationData.userId} (socket: ${socket.id})`);

        const connectionInfo: ClientConnectionInfo = {
          socketId: socket.id,
          userId: registrationData.userId,
          username: registrationData.username,
          machineId: registrationData.machineId,
          platform: registrationData.platform,
          connectedAt: new Date().toISOString(),
        };

        // Cache registration details
        activeConnections.set(socket.id, connectionInfo);
        
        if (!userConnections.has(registrationData.userId)) {
          userConnections.set(registrationData.userId, new Set());
        }
        userConnections.get(registrationData.userId)!.add(socket.id);

        // Join specific user and machine channels for targeted notification broadcasts
        socket.join(`user:${registrationData.userId}`);
        socket.join(`machine:${registrationData.machineId}`);

        fastify.log.info(`Socket ${socket.id} successfully registered user ${registrationData.userId}`);

        // Acknowledge connection
        socket.emit(SocketEvents.REGISTERED, {
          success: true,
          connectionId: socket.id
        });

        // Sync initial global mute status to client
        socket.emit(SocketEvents.MUTE_GLOBAL, { muted: globalMute });

        // 3. Connection Recovery: Query PostgreSQL for active, non-expired notifications for this user
        try {
          const nowStr = new Date().toISOString();
          const result = await query(
            `SELECT id, sender_id, sender_name, recipient_id, message, theme, created_at, expires_at 
             FROM notifications 
             WHERE recipient_id = $1 AND expires_at > $2`,
            [registrationData.userId, nowStr]
          );

          if (result.rowCount && result.rowCount > 0) {
            fastify.log.info(`Recovered ${result.rowCount} active notifications for user ${registrationData.userId}`);
            for (const row of result.rows) {
              const payload: NotificationPayload = {
                id: row.id,
                senderId: row.sender_id,
                senderName: row.sender_name,
                recipientId: row.recipient_id,
                message: row.message,
                theme: row.theme,
                createdAt: row.created_at.toISOString(),
                expiresAt: row.expires_at.toISOString()
              };
              socket.emit(SocketEvents.NOTIFICATION, payload);
            }
          }
        } catch (dbErr: any) {
          fastify.log.error(`Failed to retrieve active notifications for connection recovery: ${dbErr.message}`);
        }
      });

      // Handle Heartbeat Ping
      socket.on(SocketEvents.HEARTBEAT, (data: { timestamp: number }) => {
        socket.emit(SocketEvents.HEARTBEAT_ACK, {
          timestamp: data.timestamp,
          serverTime: Date.now()
        });
      });

      // Handle Acks
      socket.on(SocketEvents.ACK_NOTIFICATION, async (data: { notificationId: string; receivedAt: string }) => {
        fastify.log.info({ ack: data }, `Notification acknowledgement received from socket ${socket.id}`);
        // Optionally mark the notification as delivered in PostgreSQL
        try {
          await query(
            `UPDATE notifications SET delivered = TRUE WHERE id = $1`,
            [data.notificationId]
          );
        } catch (dbErr: any) {
          fastify.log.error(`Failed to update notification delivered state: ${dbErr.message}`);
        }
      });

      // Handle Disconnections
      socket.on('disconnect', (reason) => {
        const client = activeConnections.get(socket.id);
        if (client) {
          fastify.log.info(`Client disconnected: user ${client.userId} (socket: ${socket.id}), reason: ${reason}`);
          
          activeConnections.delete(socket.id);
          const userSockets = userConnections.get(client.userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              userConnections.delete(client.userId);
            }
          }
        } else {
          fastify.log.info(`Unregistered socket disconnected: ${socket.id}, reason: ${reason}`);
        }
      });
    });

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
