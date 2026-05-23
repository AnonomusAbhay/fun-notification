import { Queue, Worker } from 'bullmq';
import { createRedisConnection } from '../redis/client.js';
import { query } from '../db/connection.js';
import { NotificationPayload } from '@fun-notification/shared-types';

const redisUrl = process.env.REDIS_URL;

// Callback to trigger Socket.IO server broadcasts
let onNotificationProcessedCallback: (notification: NotificationPayload) => void = () => {};

export const setNotificationProcessedCallback = (cb: (notification: NotificationPayload) => void) => {
  onNotificationProcessedCallback = cb;
};

// Core processing logic shared between Queue Worker and InMemory Queue
export const processNotification = async (notification: NotificationPayload) => {
  // 1. Save notification to PostgreSQL database
  try {
    await query(
      `INSERT INTO notifications (id, sender_id, sender_name, recipient_id, message, theme, created_at, expires_at, delivered)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        notification.id,
        notification.senderId,
        notification.senderName,
        notification.recipientId,
        notification.message,
        notification.theme,
        notification.createdAt,
        notification.expiresAt,
        false // initially undelivered
      ]
    );
    console.log(`[Queue Worker] Notification ${notification.id} saved to PostgreSQL.`);
  } catch (err: any) {
    console.error('[Queue Worker] PostgreSQL save error:', err.message);
  }

  // 2. Broadcast via socket callback
  onNotificationProcessedCallback(notification);
};

let notificationQueue: any;
let notificationWorker: any;

if (redisUrl) {
  console.log('[Queue] Initializing BullMQ with real Redis...');
  const queueConnection = createRedisConnection();
  const workerConnection = createRedisConnection();

  notificationQueue = new Queue('notification-queue', {
    connection: queueConnection
  });

  notificationWorker = new Worker(
    'notification-queue',
    async (job) => {
      console.log(`[Queue Worker] Processing BullMQ job ${job.id} (notification: ${job.data.id})`);
      await processNotification(job.data);
    },
    {
      connection: workerConnection
    }
  );

  notificationWorker.on('failed', (job: any, err: any) => {
    console.error(`[Queue Worker] BullMQ job failed: ${job?.id}, Error: ${err.message}`);
  });
} else {
  console.log('[Queue] Initializing conditional InMemoryQueue (Local Dev Mode)...');
  
  notificationQueue = {
    add: async (name: string, data: any) => {
      console.log(`[InMemoryQueue] Enqueued job: ${name}`);
      // Process asynchronously in next tick to simulate queue concurrency
      setImmediate(async () => {
        console.log(`[InMemoryQueue] Executing notification ${data.id} in memory...`);
        await processNotification(data);
      });
      return { id: `inmem_${Math.random().toString(36).substring(2, 9)}` };
    }
  };
}

export { notificationQueue };
