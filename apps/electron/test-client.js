import { io } from 'socket.io-client';

const SocketEvents = {
  REGISTER: 'client:register',
  HEARTBEAT: 'client:heartbeat',
  ACK_NOTIFICATION: 'client:ack_notification',
  REGISTERED: 'server:registered',
  HEARTBEAT_ACK: 'server:heartbeat_ack',
  NOTIFICATION: 'server:notification'
};

const clientConfig = {
  userId: 'user_dev_01',
  username: 'Developer Bob (Headless)',
  machineId: `mac_headless_${Math.random().toString(36).substring(2, 9)}`,
  platform: 'headless'
};

console.log('Starting headless client verification...');
console.log('Connecting to WebSocket server at http://localhost:3000 ...');

const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity
});

let heartbeatInterval = null;

socket.on('connect', () => {
  console.log(`[CONNECTED] Socket ID: ${socket.id}`);
  console.log('[HANDSHAKE] Sending registration request...', clientConfig);
  socket.emit(SocketEvents.REGISTER, clientConfig);
});

socket.on(SocketEvents.REGISTERED, (data) => {
  console.log('[REGISTERED] Registration approved by server:', data);
  startHeartbeat();
});

// Handle Incoming Notifications (realtime & recovered)
socket.on(SocketEvents.NOTIFICATION, (notification) => {
  const now = Date.now();
  const expiresAtTime = new Date(notification.expiresAt).getTime();
  
  // Verify Expiry
  if (now > expiresAtTime) {
    console.log(`[EXPIRED] Discarding expired notification ${notification.id} (message: "${notification.message}", expired ${Math.round((now - expiresAtTime)/1000)}s ago)`);
    return;
  }

  console.log(`[RECEIVED] Active notification received:
    ID: ${notification.id}
    From: ${notification.senderName} (${notification.senderId})
    Message: "${notification.message}"
    Theme: ${notification.theme}
    Expires: ${notification.expiresAt}`);

  // Send Delivery Acknowledgement
  console.log(`[ACK] Sending delivery ACK for notification ${notification.id}...`);
  socket.emit(SocketEvents.ACK_NOTIFICATION, {
    notificationId: notification.id,
    receivedAt: new Date().toISOString()
  });
});

socket.on(SocketEvents.HEARTBEAT_ACK, (data) => {
  const latency = Date.now() - data.timestamp;
  console.log(`[HEARTBEAT] ACK received. Latency: ${latency}ms, ServerTime: ${data.serverTime}`);
});

socket.on('disconnect', (reason) => {
  console.log(`[DISCONNECTED] Reason: ${reason}`);
  stopHeartbeat();
});

socket.on('connect_error', (error) => {
  console.error(`[ERROR] Connection error: ${error.message}`);
});

function startHeartbeat() {
  stopHeartbeat();
  console.log('[HEARTBEAT] Starting heartbeat monitor (every 10 seconds for test visibility)...');
  heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit(SocketEvents.HEARTBEAT, { timestamp: Date.now() });
    }
  }, 10000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
