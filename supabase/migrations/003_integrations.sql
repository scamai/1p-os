-- Integrations: connected accounts (Gmail, Slack, etc.) and credentials
CREATE TABLE integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,            -- 'gmail', 'outlook', 'slack', 'whatsapp', etc.
  label TEXT,                        -- User-facing label, e.g. "dennis@gmail.com"
  status TEXT DEFAULT 'pending',     -- 'pending', 'active', 'error', 'revoked'
  credentials_encrypted TEXT,        -- AES-256-GCM encrypted JSON blob
  scopes TEXT[],                     -- OAuth scopes granted
  metadata JSONB DEFAULT '{}'::jsonb,-- Provider-specific metadata
  error_message TEXT,
  last_synced_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,            -- Token expiry
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_integrations_business ON integrations(business_id, provider);

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_data" ON integrations FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Add infra_mode to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS infra_mode TEXT DEFAULT 'cloud';

-- Add infra_mode to safety_config
ALTER TABLE safety_config ADD COLUMN IF NOT EXISTS infra_mode TEXT DEFAULT 'cloud';
ALTER TABLE safety_config ADD COLUMN IF NOT EXISTS api_keys_encrypted TEXT;
