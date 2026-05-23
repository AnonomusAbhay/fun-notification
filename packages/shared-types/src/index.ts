export interface NotificationPayload {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  message: string;
  theme: string;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string
  durationMs?: number; // Custom display duration override
  soundEnabled?: boolean;
}

export interface ClientRegistration {
  userId: string;
  username: string;
  machineId: string;
  platform: string;
}

export interface ClientConnectionInfo {
  socketId: string;
  userId: string;
  username: string;
  machineId: string;
  platform: string;
  connectedAt: string;
}

export interface UserSettings {
  soundEnabled: boolean;
  themeVolume: number; // 0 to 1
  mutedThemes: string[]; // List of muted theme ids
  doNotDisturb: boolean;
}
