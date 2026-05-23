import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// Backend API URL — configurable via environment variable for production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Notification {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  message: string;
  theme: string;
  delivered: boolean;
  createdAt: string;
  expiresAt: string;
}

export default function App() {
  const [senderId, setSenderId] = useState('user_dash');
  const [senderName, setSenderName] = useState('Dashboard Admin');
  const [recipientId, setRecipientId] = useState('user_dev_01');
  const [message, setMessage] = useState('Coffee break! ☕');
  const [theme, setTheme] = useState('airplane');
  const [expiresInMs] = useState(300000); // 5 minutes default
  
  const [globalMute, setGlobalMute] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });

  // Preset message templates
  const presets = [
    { text: 'Coffee break! ☕', theme: 'airplane' },
    { text: 'Downtime Alert! 🚨', theme: 'meme' },
    { text: 'Lunch time! 🍕', theme: 'cat' },
    { text: 'Quick sync in 5 mins ⏰', theme: 'airplane' },
    { text: 'Great job team! 🎉', theme: 'meme' }
  ];

  // Fetch status and notifications list
  const fetchData = async () => {
    try {
      const resStatus = await fetch(`${API_URL}/`);
      if (resStatus.ok) {
        const statusData = await resStatus.json();
        setGlobalMute(!!statusData.globalMute);
      }

      const resNotifs = await fetch(`${API_URL}/api/notifications`);
      if (resNotifs.ok) {
        const notifsData = await resNotifs.json();
        if (Array.isArray(notifsData)) {
          setNotifications(notifsData);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch data from backend server:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll data every 4 seconds as a fallback
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Socket connection to backend for instant updates
  useEffect(() => {
    console.log('Connecting socket client...');
    const socket: Socket = io(API_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      console.log('Socket.IO successfully connected to backend.');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      console.log('Socket.IO disconnected.');
    });

    // Handle real-time global mute toggle event
    socket.on('server:mute_global', (data: { muted: boolean }) => {
      setGlobalMute(data.muted);
      showStatus(`Global Admin Mute: ${data.muted ? 'ENABLED' : 'DISABLED'}`, 'info');
      fetchData();
    });

    // Refresh when any client registers or acknowledges notifications
    socket.on('server:notification', () => {
      fetchData();
    });

    socket.on('server:registered', () => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const showStatus = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage({ text: '', type: null });
    }, 4500);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showStatus('Please enter a notification message.', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId,
          senderName,
          recipientId,
          message,
          theme,
          expiresInMs
        })
      });
      const result = await response.json();
      if (response.ok) {
        showStatus(`Successfully dispatched notification: ${result.notification.id}`, 'success');
        setMessage('');
        fetchData();
      } else {
        showStatus(`Dispatch rejected: ${result.error || 'Unknown error'}`, 'error');
      }
    } catch (err: any) {
      showStatus(`Error communicating with backend: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMute = async () => {
    const nextMute = !globalMute;
    try {
      const response = await fetch(`${API_URL}/api/admin/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muted: nextMute })
      });
      if (response.ok) {
        setGlobalMute(nextMute);
        showStatus(`Global Admin Mute is now ${nextMute ? 'ON' : 'OFF'}.`, 'success');
        fetchData();
      } else {
        showStatus('Failed to toggle admin mute state.', 'error');
      }
    } catch (err: any) {
      showStatus(`Error toggling mute: ${err.message}`, 'error');
    }
  };

  const handleEmergencyStop = async () => {
    if (!window.confirm('WARNING: This will immediately dismiss all active overlay animations on all machines. Proceed?')) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/admin/stop`, {
        method: 'POST'
      });
      if (response.ok) {
        showStatus('Emergency stop command dispatched.', 'success');
      } else {
        showStatus('Failed to execute emergency stop.', 'error');
      }
    } catch (err: any) {
      showStatus(`Error: ${err.message}`, 'error');
    }
  };

  const handleForceDismiss = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/dismiss/${id}`, {
        method: 'POST'
      });
      if (response.ok) {
        showStatus(`Force-dismissed notification: ${id}`, 'success');
        fetchData();
      } else {
        showStatus('Failed to force-dismiss notification.', 'error');
      }
    } catch (err: any) {
      showStatus(`Error: ${err.message}`, 'error');
    }
  };

  const handleSelectPreset = (p: { text: string; theme: string }) => {
    setMessage(p.text);
    setTheme(p.theme);
  };

  return (
    <div>
      <header>
        <h1>FUN NOTIFICATION SYSTEM - SENDER CONSOLE</h1>
        <div className="connection-status">
          <div className={`status-dot ${socketConnected ? 'connected' : ''}`}></div>
          <span>SOCKET: {socketConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </div>
      </header>

      {statusMessage.text && (
        <div className={`status-banner ${statusMessage.type || ''}`}>
          <span>{statusMessage.type === 'success' ? '✅' : statusMessage.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="dashboard-grid">
        {/* 1. Notification Composer */}
        <div className="card">
          <div className="card-title">Dispatch Animated Notification</div>
          <form onSubmit={handleSendNotification}>
            <div className="form-row">
              <div className="form-group">
                <label>Sender Username</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Dashboard Admin"
                  required
                />
              </div>
              <div className="form-group">
                <label>Sender Account ID</label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  placeholder="e.g. user_dash"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Target Recipient Account ID</label>
              <input
                type="text"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder="e.g. user_dev_01"
                required
              />
            </div>

            <div className="form-group">
              <label>Quick Presets</label>
              <div className="presets-container">
                {presets.map((p, idx) => (
                  <div
                    key={idx}
                    className="preset-chip"
                    onClick={() => handleSelectPreset(p)}
                  >
                    {p.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Notification Alert Message</label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your custom real-time alert message here..."
                required
              />
            </div>

            <div className="form-group">
              <label>Visual Theme Style</label>
              <div className="theme-selector-grid">
                <div
                  className={`theme-card ${theme === 'airplane' ? 'active' : ''}`}
                  onClick={() => setTheme('airplane')}
                >
                  <div className="theme-icon">✈️</div>
                  <div className="theme-name">Airplane</div>
                </div>
                <div
                  className={`theme-card ${theme === 'cat' ? 'active' : ''}`}
                  onClick={() => setTheme('cat')}
                >
                  <div className="theme-icon">🐱</div>
                  <div className="theme-name">Cat</div>
                </div>
                <div
                  className={`theme-card ${theme === 'meme' ? 'active' : ''}`}
                  onClick={() => setTheme('meme')}
                >
                  <div className="theme-icon">💬</div>
                  <div className="theme-name">Meme</div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || globalMute}
            >
              {loading ? 'Dispatching...' : globalMute ? 'Blocked by Global Mute' : 'Send Animated Overlay 🚀'}
            </button>
          </form>
        </div>

        {/* 2. Admin Settings & Utilities */}
        <div className="card">
          <div className="card-title">Administrative Settings</div>
          <div className="admin-actions">
            <div className="switch-row">
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Global Admin Mute</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Block all new notification requests
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={globalMute}
                  onChange={handleToggleMute}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleEmergencyStop}
              >
                Emergency Dismiss All Overlays ⚠️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recent History Log */}
      <div className="card history-card">
        <div className="card-title">Dispatch History Log (Last 20)</div>
        <div className="table-wrapper">
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              No notifications dispatched yet.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>ID</th>
                  <th>Sender</th>
                  <th>Recipient</th>
                  <th>Theme</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>{n.id}</td>
                    <td style={{ fontWeight: 600 }}>{n.senderName}</td>
                    <td>{n.recipientId}</td>
                    <td style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{n.theme}</td>
                    <td style={{ fontStyle: 'italic' }}>{n.message}</td>
                    <td>
                      <span className={`badge ${n.delivered ? 'badge-success' : 'badge-pending'}`}>
                        {n.delivered ? 'Delivered' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {!n.delivered && (
                        <button
                          type="button"
                          className="btn-small-dismiss"
                          onClick={() => handleForceDismiss(n.id)}
                        >
                          Dismiss
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
