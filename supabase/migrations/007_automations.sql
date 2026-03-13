-- =============================================================================
-- 004: Automation Jobs, Triggers, and Execution Log
-- =============================================================================

-- ─── Automation Jobs (schedules) ─────────────────────────────────────────────

CREATE TABLE automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Schedule: cron, interval, or one-time
  schedule_kind TEXT NOT NULL CHECK (schedule_kind IN ('cron', 'interval', 'once')),
  schedule_expr TEXT,                -- cron expression (for kind=cron)
  schedule_interval_ms BIGINT,       -- milliseconds (for kind=interval)
  schedule_once_at TIMESTAMPTZ,      -- target time (for kind=once)
  schedule_tz TEXT DEFAULT 'UTC',
  -- What to run
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  payload_message TEXT NOT NULL,
  payload_model TEXT,
  -- Delivery
  delivery_mode TEXT DEFAULT 'none' CHECK (delivery_mode IN ('none', 'announce', 'webhook')),
  delivery_channel TEXT,
  delivery_to TEXT,
  -- State
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  last_run_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('ok', 'error', 'skipped')),
  next_run_at TIMESTAMPTZ,
  consecutive_errors INTEGER DEFAULT 0,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_jobs_business ON automation_jobs(business_id, status);
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_jobs" ON automation_jobs FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ─── Event Triggers ──────────────────────────────────────────────────────────

CREATE TABLE automation_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event TEXT NOT NULL,                -- e.g. "invoice.overdue", "lead.new"
  condition TEXT,                     -- optional filter expression
  -- Action
  action_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  action_message TEXT NOT NULL,
  -- State
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  last_fired_at TIMESTAMPTZ,
  fire_count INTEGER DEFAULT 0,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_triggers_business ON automation_triggers(business_id, status);
ALTER TABLE automation_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_triggers" ON automation_triggers FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ─── Execution Log ───────────────────────────────────────────────────────────

CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES automation_jobs(id) ON DELETE SET NULL,
  trigger_id UUID REFERENCES automation_triggers(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  run_type TEXT NOT NULL CHECK (run_type IN ('schedule', 'trigger', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('ok', 'error', 'skipped')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_runs_business ON automation_runs(business_id, created_at DESC);
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_runs" ON automation_runs FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
