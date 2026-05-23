import { NotificationPayload, ClientRegistration } from '@fun-notification/shared-types';

export const SocketEvents = {
  // Client -> Server
  REGISTER: 'client:register',
  HEARTBEAT: 'client:heartbeat',
  ACK_NOTIFICATION: 'client:ack_notification',
  
  // Server -> Client
  REGISTERED: 'server:registered',
  NOTIFICATION: 'server:notification',
  DISMISS_NOTIFICATION: 'server:dismiss_notification',
  MUTE_GLOBAL: 'server:mute_global',
  STOP_ALL_NOTIFICATIONS: 'server:stop_all_notifications',
  HEARTBEAT_ACK: 'server:heartbeat_ack'
} as const;

export type SocketEventType = typeof SocketEvents[keyof typeof SocketEvents];

export interface SocketEventPayloads {
  [SocketEvents.REGISTER]: ClientRegistration;
  [SocketEvents.HEARTBEAT]: { timestamp: number };
  [SocketEvents.ACK_NOTIFICATION]: { notificationId: string; receivedAt: string };
  
  [SocketEvents.REGISTERED]: { success: boolean; connectionId: string };
  [SocketEvents.NOTIFICATION]: NotificationPayload;
  [SocketEvents.DISMISS_NOTIFICATION]: { notificationId: string };
  [SocketEvents.MUTE_GLOBAL]: { muted: boolean };
  [SocketEvents.STOP_ALL_NOTIFICATIONS]: Record<string, never>;
  [SocketEvents.HEARTBEAT_ACK]: { timestamp: number; serverTime: number };
}
