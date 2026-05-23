CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(50) PRIMARY KEY,
  sender_id VARCHAR(50) NOT NULL,
  sender_name VARCHAR(100) NOT NULL,
  recipient_id VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  theme VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  delivered BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_expiry ON notifications (recipient_id, expires_at);
