import { app, BrowserWindow, ipcMain, screen, powerMonitor } from 'electron';
import { io } from 'socket.io-client';
import path from 'path';
import { fileURLToPath } from 'url';
import { readSettings, writeSettings } from './settings-store.js';

// Constants for Socket Events from socket-contracts
const SocketEvents = {
  REGISTER: 'client:register',
  HEARTBEAT: 'client:heartbeat',
  ACK_NOTIFICATION: 'client:ack_notification',
  REGISTERED: 'server:registered',
  HEARTBEAT_ACK: 'server:heartbeat_ack',
  NOTIFICATION: 'server:notification',
  DISMISS_NOTIFICATION: 'server:dismiss_notification',
  MUTE_GLOBAL: 'server:mute_global',
  STOP_ALL_NOTIFICATIONS: 'server:stop_all_notifications'
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let socket = null;
let heartbeatInterval = null;

// Track active overlay windows: windowId -> notification object
const activeOverlays = new Map();

// Local settings store and admin states
let clientSettings = readSettings();
let isGlobalMuted = false;

// Overlay Queue State
const overlayQueue = [];
let isOverlayActive = false;

// Mock configuration (In production, this would be loaded from secure storage)
const clientConfig = {
  userId: 'user_dev_01',
  username: 'Developer Bob',
  machineId: `mac_${process.platform}_${Math.random().toString(36).substring(2, 9)}`,
  platform: process.platform
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 450,
    title: 'Fun Notification Client - Dev Console',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function updateUI(status, details = {}) {
  if (mainWindow && mainWindow.webContents) {
    const defaultUrl = app.isPackaged ? 'https://fun-notification-api.onrender.com' : 'http://localhost:3000';
    const activeUrl = clientSettings.serverUrl || process.env.SOCKET_URL || defaultUrl;
    mainWindow.webContents.send('status-change', { 
      status, 
      details: { ...details, activeUrl } 
    });
  }
}

// Spawns a full-screen transparent overlay window for GSAP animations
function createOverlayWindow(notification) {
  // Discard if muted by client settings or global admin mute
  if (clientSettings.doNotDisturb) {
    console.log(`[Overlay] Notification ${notification.id} blocked: Do Not Disturb is active.`);
    return;
  }
  if (isGlobalMuted) {
    console.log(`[Overlay] Notification ${notification.id} blocked: Global Admin Mute is active.`);
    return;
  }
  if (clientSettings.mutedThemes && clientSettings.mutedThemes.includes(notification.theme)) {
    console.log(`[Overlay] Notification ${notification.id} blocked: Theme "${notification.theme}" is muted locally.`);
    return;
  }

  // Queue system: if an overlay is already active, enqueue this notification and return
  if (isOverlayActive) {
    console.log(`[Overlay Queue] Enqueuing notification ${notification.id} (Another overlay is currently active). Queue length: ${overlayQueue.length + 1}`);
    overlayQueue.push(notification);
    return;
  }

  isOverlayActive = true;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const overlayWin = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Ignore mouse clicks on transparent regions so user can click through
  overlayWin.setIgnoreMouseEvents(true, { forward: true });

  // Map window id to payload so overlay renderer can retrieve it via IPC
  activeOverlays.set(overlayWin.id, notification);

  overlayWin.loadFile('overlay.html');

  overlayWin.on('closed', () => {
    activeOverlays.delete(overlayWin.id);
    isOverlayActive = false;

    // Process next item in queue
    if (overlayQueue.length > 0) {
      const nextNotif = overlayQueue.shift();
      console.log(`[Overlay Queue] Spawning next notification from queue: ${nextNotif.id}. Remaining: ${overlayQueue.length}`);
      setTimeout(() => {
        createOverlayWindow(nextNotif);
      }, 600); // 600ms breath transition delay
    }
  });
}

function connectSocket() {
  const defaultUrl = app.isPackaged ? 'https://fun-notification-api.onrender.com' : 'http://localhost:3000';
  const socketUrl = clientSettings.serverUrl || process.env.SOCKET_URL || defaultUrl;
  console.log(`Connecting to WebSocket server: ${socketUrl}`);
  updateUI('connecting');

  socket = io(socketUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity
  });

  socket.on('connect', () => {
    console.log(`Connected to WebSocket server. Socket ID: ${socket.id}`);
    updateUI('connected', { socketId: socket.id, ...clientConfig });

    // Send Registration handshake
    console.log('Sending registration request...', clientConfig);
    socket.emit(SocketEvents.REGISTER, clientConfig);
  });

  socket.on(SocketEvents.REGISTERED, (data) => {
    console.log('Registration approved by server:', data);
    updateUI('registered', { socketId: socket.id, connectionId: data.connectionId, ...clientConfig });

    // Start Heartbeat pings
    startHeartbeat();
  });

  socket.on(SocketEvents.HEARTBEAT_ACK, (data) => {
    const latency = Date.now() - data.timestamp;
    console.log(`Heartbeat ACK from server. Latency: ${latency}ms`);
    if (mainWindow) {
      mainWindow.webContents.send('heartbeat-ack', { latency, serverTime: data.serverTime });
    }
  });

  // Handle incoming notifications (realtime and recovery backlog)
  socket.on(SocketEvents.NOTIFICATION, (notification) => {
    console.log('Notification received from server:', notification);
    
    const now = Date.now();
    const expiresAtTime = new Date(notification.expiresAt).getTime();
    
    if (now > expiresAtTime) {
      console.log(`[EXPIRED] Discarding expired notification: ${notification.id}`);
      return;
    }
    
    console.log(`[ACTIVE] Spawning animation overlay for message: ${notification.message}`);
    
    // Spawn transparent window overlay
    createOverlayWindow(notification);

    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('notification-received', notification);
    }
    
    // Send acknowledgement
    socket.emit(SocketEvents.ACK_NOTIFICATION, {
      notificationId: notification.id,
      receivedAt: new Date().toISOString()
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`Disconnected from WebSocket server: ${reason}`);
    updateUI('disconnected', { reason });
    stopHeartbeat();
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    updateUI('error', { error: error.message });
  });

  // Admin and global sync events
  socket.on(SocketEvents.MUTE_GLOBAL, (data) => {
    console.log(`[Socket] Global Admin Mute updated:`, data);
    isGlobalMuted = !!data.muted;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-mute-change', { muted: isGlobalMuted });
    }
  });

  socket.on(SocketEvents.STOP_ALL_NOTIFICATIONS, () => {
    console.log(`[Socket] Global Admin Stop requested. Dismissing all overlays...`);
    dismissAllOverlays();
  });

  socket.on(SocketEvents.DISMISS_NOTIFICATION, (data) => {
    const { notificationId } = data;
    console.log(`[Socket] Global Admin Dismiss requested for notification:`, notificationId);
    for (const [winId, notif] of activeOverlays.entries()) {
      if (notif.id === notificationId) {
        const win = BrowserWindow.fromId(winId);
        if (win && !win.isDestroyed()) {
          win.close();
        }
      }
    }
  });
}

function startHeartbeat() {
  stopHeartbeat();
  console.log('Starting heartbeat monitor (20s intervals)...');
  heartbeatInterval = setInterval(() => {
    if (socket && socket.connected) {
      socket.emit(SocketEvents.HEARTBEAT, { timestamp: Date.now() });
    }
  }, 20000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Helper to dismiss all active overlay windows
function dismissAllOverlays() {
  console.log('Dismissing all active overlay windows and clearing queue...');
  overlayQueue.length = 0; // Clear the backlog queue
  for (const winId of activeOverlays.keys()) {
    const win = BrowserWindow.fromId(winId);
    if (win && !win.isDestroyed()) {
      win.close();
    }
  }
}

// IPC Handlers for Overlay Communications
ipcMain.handle('get-notification-payload', (event) => {
  const winId = event.sender.id;
  return activeOverlays.get(winId) || null;
});

ipcMain.on('animation-complete', (event) => {
  const winId = event.sender.id;
  const win = BrowserWindow.fromId(winId);
  if (win && !win.isDestroyed()) {
    win.close();
  }
});

// Close all active overlay windows on manual dismiss (ESC trigger)
ipcMain.on('dismiss-all-overlays', () => {
  dismissAllOverlays();
});

// Settings store handlers
ipcMain.handle('get-settings', () => {
  return readSettings();
});

ipcMain.handle('update-settings', (event, settings) => {
  const oldUrl = clientSettings.serverUrl;
  const oldRunAtStartup = clientSettings.runAtStartup;
  clientSettings = writeSettings(settings);
  
  if (settings.serverUrl !== undefined && settings.serverUrl !== oldUrl) {
    console.log(`[Settings] Server URL changed from "${oldUrl}" to "${settings.serverUrl}". Reconnecting...`);
    if (socket) {
      socket.disconnect();
    }
    connectSocket();
  }

  if (settings.runAtStartup !== undefined && settings.runAtStartup !== oldRunAtStartup && app.isPackaged) {
    try {
      app.setLoginItemSettings({
        openAtLogin: !!settings.runAtStartup,
        path: app.getPath('exe')
      });
      console.log(`[AutoStart] login settings updated: openAtLogin = ${settings.runAtStartup}`);
    } catch (err) {
      console.error('[AutoStart] Failed to update login item settings:', err.message);
    }
  }
  
  return clientSettings;
});

app.whenReady().then(() => {
  createWindow();

  // Apply login item settings for auto-start in production
  if (app.isPackaged) {
    try {
      app.setLoginItemSettings({
        openAtLogin: !!clientSettings.runAtStartup,
        path: app.getPath('exe')
      });
      console.log(`[AutoStart] login settings initialized: openAtLogin = ${clientSettings.runAtStartup}`);
    } catch (err) {
      console.error('[AutoStart] Failed to initialize login item settings:', err.message);
    }
  }

  // Wait for window to load before starting connection
  setTimeout(() => {
    connectSocket();
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // OS sleep/wake power monitor lifecycle handlers
  powerMonitor.on('suspend', () => {
    console.log('[powerMonitor] System suspend event detected. Tearing down connection...');
    dismissAllOverlays();
    stopHeartbeat();
    if (socket) {
      socket.disconnect();
      console.log('[powerMonitor] Socket disconnected cleanly.');
    }
  });

  powerMonitor.on('resume', () => {
    console.log('[powerMonitor] System resume event detected. Re-establishing connection...');
    if (socket) {
      socket.connect();
    } else {
      connectSocket();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
