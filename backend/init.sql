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

-- Central ERP data store (shared across all users/devices)
CREATE TABLE IF NOT EXISTS erp_data (
    id TEXT PRIMARY KEY DEFAULT 'main',
    data JSONB NOT NULL DEFAULT '{}',
    version TEXT DEFAULT 'v4_seeded',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO erp_data (id, data, version)
VALUES ('main', '{}', 'v4_seeded')
ON CONFLICT (id) DO NOTHING;

-- Automatic snapshots before every ERP save (keeps last N via app logic)
CREATE TABLE IF NOT EXISTS erp_data_backups (
    id BIGSERIAL PRIMARY KEY,
    erp_id TEXT NOT NULL DEFAULT 'main',
    data JSONB NOT NULL,
    version TEXT,
    critical_weight INTEGER NOT NULL DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_data_backups_created
ON erp_data_backups (erp_id, created_at DESC);
