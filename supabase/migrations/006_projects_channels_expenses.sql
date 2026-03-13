-- Projects: work tracking
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',         -- 'active', 'completed', 'paused', 'archived'
  priority TEXT DEFAULT 'medium',       -- 'low', 'medium', 'high', 'critical'
  client_id UUID REFERENCES relationships(id) ON DELETE SET NULL,
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  budget_usd DECIMAL(12,2),
  spent_usd DECIMAL(12,2) DEFAULT 0,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_business ON projects(business_id, status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_data" ON projects FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Channels: communication threads
CREATE TABLE channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'internal',         -- 'internal', 'email', 'slack', 'sms'
  participants TEXT[] DEFAULT '{}',
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  pinned BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_data" ON channels FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Expenses: cost tracking
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  category TEXT,                         -- 'ai', 'saas', 'contractor', 'hosting', 'marketing', 'other'
  vendor TEXT,
  date DATE DEFAULT CURRENT_DATE,
  receipt_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  recorded_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_data" ON expenses FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
