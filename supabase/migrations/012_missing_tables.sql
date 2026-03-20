-- ============================================================
-- 012: Missing tables referenced in code
-- milestones (ai/summary) + efficiency_events (efficiency/cost)
-- ============================================================

-- ── Milestones ──

CREATE TABLE milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_milestones_biz ON milestones(business_id);
CREATE INDEX idx_milestones_due ON milestones(due_date);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_owner" ON milestones
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ── Efficiency Events ──

CREATE TABLE efficiency_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('cache_hit', 'prompt_optimization', 'deduplication', 'routing')),
  tokens_saved INTEGER,
  cost_saved_usd DECIMAL(10,6),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_efficiency_events_biz ON efficiency_events(business_id);
CREATE INDEX idx_efficiency_events_created ON efficiency_events(created_at);

ALTER TABLE efficiency_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "efficiency_events_owner" ON efficiency_events
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
