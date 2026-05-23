const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onStatusChange: (callback) => {
    ipcRenderer.on('status-change', (event, data) => callback(data));
  },
  onHeartbeatAck: (callback) => {
    ipcRenderer.on('heartbeat-ack', (event, data) => callback(data));
  },
  onNotificationReceived: (callback) => {
    ipcRenderer.on('notification-received', (event, data) => callback(data));
  },
  onGlobalMuteChange: (callback) => {
    ipcRenderer.on('global-mute-change', (event, data) => callback(data));
  },
  
  // Overlay IPC APIs
  getNotificationPayload: () => {
    return ipcRenderer.invoke('get-notification-payload');
  },
  sendAnimationComplete: () => {
    ipcRenderer.send('animation-complete');
  },
  dismissAllOverlays: () => {
    ipcRenderer.send('dismiss-all-overlays');
  },
  
  // Settings IPC APIs
  getSettings: () => {
    return ipcRenderer.invoke('get-settings');
  },
  updateSettings: (settings) => {
    return ipcRenderer.invoke('update-settings', settings);
  }
});
