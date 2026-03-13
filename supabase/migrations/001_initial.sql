-- Core business
CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  state TEXT NOT NULL,
  entity_type TEXT DEFAULT 'pending',
  ein_encrypted TEXT,
  industry TEXT,
  industry_template TEXT,
  description TEXT,
  health_score INTEGER DEFAULT 100,
  preferences JSONB DEFAULT '{
    "risk_tolerance": "moderate",
    "default_payment_terms": 30,
    "auto_approve_threshold": 1000,
    "communication_style": "professional",
    "working_hours": "9-5",
    "model_routing_strategy": "balanced"
  }'::jsonb,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE business_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  importance INTEGER DEFAULT 5,
  source_agent_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_memory_search ON business_memory USING gin(to_tsvector('english', content));

CREATE TABLE relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  notes TEXT,
  last_interaction TIMESTAMPTZ,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming',
  handled_by_agent UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  description TEXT,
  status TEXT DEFAULT 'draft',
  stripe_payment_link TEXT,
  stripe_payment_id TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_by_agent UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  status TEXT DEFAULT 'idle',
  system_prompt TEXT NOT NULL,
  context_permissions TEXT[] NOT NULL,
  allowed_actions TEXT[] NOT NULL,
  triggers JSONB DEFAULT '[]'::jsonb,
  budget_daily_usd DECIMAL(8,2) DEFAULT 2.00,
  budget_monthly_usd DECIMAL(8,2) DEFAULT 50.00,
  spent_today_usd DECIMAL(8,2) DEFAULT 0.00,
  spent_this_month_usd DECIMAL(8,2) DEFAULT 0.00,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  decisions_escalated INTEGER DEFAULT 0,
  overrides_by_human INTEGER DEFAULT 0,
  cost_total_usd DECIMAL(10,2) DEFAULT 0.00,
  hours_saved_estimated DECIMAL(8,1) DEFAULT 0.0,
  source TEXT DEFAULT 'custom',
  marketplace_agent_id UUID,
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  circuit_open BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  from_agent_id UUID REFERENCES agents(id),
  to_agent_id UUID REFERENCES agents(id),
  chain_id UUID,
  chain_depth INTEGER DEFAULT 0,
  message_type TEXT NOT NULL,
  content JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_agent_messages_chain ON agent_messages(chain_id, chain_depth);

CREATE TABLE decision_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB,
  urgency TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  decided_at TIMESTAMPTZ,
  decision_payload JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, agent_id, key)
);

CREATE TABLE marketplace_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  category TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  author_verified BOOLEAN DEFAULT FALSE,
  manifest JSONB NOT NULL,
  install_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_status TEXT DEFAULT 'pending',
  pricing TEXT DEFAULT 'free',
  estimated_daily_cost DECIMAL(8,4) DEFAULT 0,
  flag_count INTEGER DEFAULT 0,
  disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, type)
);

CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  actor_agent_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  input_summary TEXT,
  output_summary TEXT,
  cost_usd DECIMAL(8,4),
  model_used TEXT,
  tokens_used INTEGER,
  context_accessed TEXT[],
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_log_business ON audit_log(business_id, created_at DESC);

CREATE TABLE safety_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
  global_daily_budget_usd DECIMAL(8,2) DEFAULT 20.00,
  global_monthly_budget_usd DECIMAL(8,2) DEFAULT 500.00,
  kill_switch_active BOOLEAN DEFAULT FALSE,
  lockdown_mode BOOLEAN DEFAULT FALSE,
  circuit_breaker_max_failures INTEGER DEFAULT 3,
  circuit_breaker_window_seconds INTEGER DEFAULT 300,
  loop_max_chain_depth INTEGER DEFAULT 10,
  loop_repeat_threshold INTEGER DEFAULT 3,
  model_routing_strategy TEXT DEFAULT 'balanced',
  human_gate_overrides JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cost_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_cost_usd DECIMAL(10,4) NOT NULL,
  by_agent JSONB DEFAULT '{}'::jsonb,
  by_model JSONB DEFAULT '{}'::jsonb,
  by_task_type JSONB DEFAULT '{}'::jsonb,
  api_calls_count INTEGER DEFAULT 0,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  agents_active INTEGER DEFAULT 0,
  UNIQUE(business_id, date)
);

CREATE TABLE industry_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  default_agents JSONB NOT NULL,
  default_deadlines JSONB DEFAULT '[]'::jsonb,
  default_preferences JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0
);

-- RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_data" ON businesses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON business_memory FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "own_data" ON relationships FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "own_data" ON deadlines FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "own_data" ON invoices FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "own_data" ON agents FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "own_data" ON agent_messages FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "own_data" ON decision_cards FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "own_data" ON agent_data FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "own_data" ON achievements FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "own_data" ON safety_config FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "own_data" ON cost_snapshots FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "read_own" ON audit_log FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "public_read" ON marketplace_agents FOR SELECT USING (true);
CREATE POLICY "author_write" ON marketplace_agents FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "author_update" ON marketplace_agents FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "public_read" ON industry_templates FOR SELECT USING (true);
