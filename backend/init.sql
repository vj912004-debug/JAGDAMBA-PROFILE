-- Database Initialization for Jagdamba Profile ERP
-- Create table for logging sent emails

CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    subject TEXT,
    message_id TEXT,
    file_name TEXT,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster searching
CREATE INDEX IF NOT EXISTS idx_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_sent_at ON email_logs(sent_at);
