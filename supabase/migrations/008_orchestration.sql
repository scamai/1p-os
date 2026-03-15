-- Orchestration: Goal hierarchy, heartbeat runs, org chart
-- Ported from Paperclip's core concepts into 1P OS

-- Goal Hierarchy: mission → strategic → tactical → task
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  level TEXT NOT NULL CHECK (level IN ('mission', 'strategic', 'tactical', 'task')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'blocked')),
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  checked_out_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  checked_out_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_business ON goals(business_id, level);
CREATE INDEX idx_goals_parent ON goals(parent_goal_id);
CREATE INDEX idx_goals_agent ON goals(assigned_agent_id);

-- Heartbeat Runs: records each agent execution window
CREATE TABLE heartbeat_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('scheduled', 'event', 'manual', 'ceo_delegation')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  tasks_processed INTEGER DEFAULT 0,
  cost_usd DECIMAL(8,4) DEFAULT 0,
  summary TEXT,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_heartbeat_business ON heartbeat_runs(business_id, started_at DESC);
CREATE INDEX idx_heartbeat_agent ON heartbeat_runs(agent_id, started_at DESC);

-- Org chart columns on agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES agents(id) ON DELETE SET NULL;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_ceo BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS department TEXT;

-- RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeat_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_data" ON goals FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "own_data" ON heartbeat_runs FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
