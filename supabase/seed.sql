-- ============================================================
-- 1P OS — Demo Seed Data
-- ============================================================
-- This seed populates the database with a realistic demo company
-- so every feature in the app has data to display.
--
-- Run: supabase db reset   (applies migrations + this seed)
-- Or:  psql < supabase/seed.sql
-- ============================================================

-- Fixed UUIDs for referential integrity
-- Demo user: 00000000-0000-0000-0000-000000000001
-- Demo business: 00000000-0000-0000-0000-000000000010

-- ── Create demo auth user ───────────────────────────────────
-- Supabase local dev: insert directly into auth.users
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone, phone_change, phone_change_token,
  reauthentication_token, is_sso_user, is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'demo@1pos.dev',
  -- password: "demo1234"
  crypt('demo1234', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Demo Founder"}'::jsonb,
  NOW(), NOW(),
  '', '',
  '', '', '',
  '', '', '',
  '', false, false
) ON CONFLICT (id) DO NOTHING;

-- Also insert identity so login works
INSERT INTO auth.identities (
  id, user_id, provider_id, provider,
  identity_data, last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'demo@1pos.dev', 'email',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"demo@1pos.dev"}'::jsonb,
  NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;


-- ── Business ────────────────────────────────────────────────

INSERT INTO businesses (
  id, user_id, business_name, state, entity_type,
  industry, industry_template, description,
  health_score, onboarding_completed, infra_mode,
  preferences
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'My Company',
  'CA',
  'llc',
  'saas',
  'saas-founder',
  'B2B SaaS platform for project management. 500+ customers, $45K MRR.',
  87,
  TRUE,
  'cloud',
  '{
    "risk_tolerance": "moderate",
    "default_payment_terms": 30,
    "auto_approve_threshold": 500,
    "communication_style": "professional",
    "working_hours": "9-6",
    "model_routing_strategy": "balanced",
    "timezone": "America/Los_Angeles",
    "currency": "usd"
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;


-- ── Agents ──────────────────────────────────────────────────

-- Sales: Lead Qualifier
INSERT INTO agents (id, business_id, name, role, avatar, status,
  system_prompt, context_permissions, allowed_actions, triggers,
  budget_daily_usd, budget_monthly_usd, spent_today_usd, spent_this_month_usd,
  level, xp, tasks_completed, decisions_escalated, overrides_by_human,
  cost_total_usd, hours_saved_estimated, source
) VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000010',
  'Lead Qualifier', 'Sales — Inbound Qualification', NULL, 'working',
  'You are a sales qualification agent for My Company, a B2B SaaS company. Score inbound leads using BANT criteria. Qualify leads that match ICP (mid-market, 50-500 employees, project management need). Escalate high-value leads ($5K+ ARR potential) for founder review.',
  ARRAY['identity', 'relationships', 'memory'],
  ARRAY['read_relationships', 'update_relationships', 'create_decision', 'send_message', 'search_memory'],
  '[{"type":"event","event_type":"new_lead","source":"form"},{"type":"schedule","cron":"0 9 * * 1-5"}]'::jsonb,
  2.00, 50.00, 0.87, 12.40,
  4, 1240, 156, 8, 2,
  38.60, 62.0, 'custom'
);

-- Sales: Proposal Writer
INSERT INTO agents (id, business_id, name, role, avatar, status,
  system_prompt, context_permissions, allowed_actions, triggers,
  budget_daily_usd, budget_monthly_usd, spent_today_usd, spent_this_month_usd,
  level, xp, tasks_completed, decisions_escalated, overrides_by_human,
  cost_total_usd, hours_saved_estimated, source
) VALUES (
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000010',
  'Proposal Writer', 'Sales — Proposals & Contracts', NULL, 'idle',
  'You write sales proposals for My Company. Use context about the lead, their company, and our pricing tiers to draft professional proposals. Always escalate for approval before sending proposals over $2,000.',
  ARRAY['identity', 'relationships', 'financials', 'memory'],
  ARRAY['read_relationships', 'create_document', 'create_decision', 'send_message'],
  '[{"type":"event","event_type":"qualified_lead","source":"agent"}]'::jsonb,
  3.00, 75.00, 0.42, 18.90,
  3, 890, 67, 14, 5,
  52.30, 48.0, 'custom'
);

-- Support: Ticket Resolver
INSERT INTO agents (id, business_id, name, role, avatar, status,
  system_prompt, context_permissions, allowed_actions, triggers,
  budget_daily_usd, budget_monthly_usd, spent_today_usd, spent_this_month_usd,
  level, xp, tasks_completed, decisions_escalated, overrides_by_human,
  cost_total_usd, hours_saved_estimated, source
) VALUES (
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000010',
  'Ticket Resolver', 'Support — Customer Success', NULL, 'working',
  'You handle customer support tickets for My Company. Resolve common issues using the knowledge base. Escalate billing disputes and refund requests over $50. Maintain a friendly, professional tone. Track resolution time.',
  ARRAY['identity', 'relationships', 'memory'],
  ARRAY['read_relationships', 'update_relationships', 'send_email', 'create_decision', 'search_memory', 'add_memory'],
  '[{"type":"event","event_type":"new_ticket","source":"email"},{"type":"event","event_type":"new_ticket","source":"chat"}]'::jsonb,
  2.00, 50.00, 0.64, 14.20,
  5, 2100, 312, 18, 3,
  44.80, 124.0, 'custom'
);

-- Content: Content Writer
INSERT INTO agents (id, business_id, name, role, avatar, status,
  system_prompt, context_permissions, allowed_actions, triggers,
  budget_daily_usd, budget_monthly_usd, spent_today_usd, spent_this_month_usd,
  level, xp, tasks_completed, decisions_escalated, overrides_by_human,
  cost_total_usd, hours_saved_estimated, source
) VALUES (
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000010',
  'Content Writer', 'Content — Blog & Social', NULL, 'working',
  'You create content for My Company. Write blog posts, social media updates, and newsletters. Focus on project management tips, productivity, and SaaS industry trends. Maintain our brand voice: helpful, clear, slightly informal.',
  ARRAY['identity', 'memory'],
  ARRAY['create_document', 'search_memory', 'add_memory', 'send_message'],
  '[{"type":"schedule","cron":"0 8 * * 1"},{"type":"schedule","cron":"0 10 * * 3,5"}]'::jsonb,
  2.50, 60.00, 0.95, 22.80,
  3, 780, 89, 4, 1,
  68.40, 78.0, 'custom'
);

-- Finance: Bookkeeper
INSERT INTO agents (id, business_id, name, role, avatar, status,
  system_prompt, context_permissions, allowed_actions, triggers,
  budget_daily_usd, budget_monthly_usd, spent_today_usd, spent_this_month_usd,
  level, xp, tasks_completed, decisions_escalated, overrides_by_human,
  cost_total_usd, hours_saved_estimated, source
) VALUES (
  '00000000-0000-0000-0000-000000000105',
  '00000000-0000-0000-0000-000000000010',
  'Bookkeeper', 'Finance — Reconciliation', NULL, 'idle',
  'You handle bookkeeping for My Company. Reconcile Stripe payouts daily. Categorize expenses. Flag unusual transactions over $500. Prepare monthly summaries. Never approve or initiate payments — escalate all payment actions.',
  ARRAY['identity', 'financials', 'memory'],
  ARRAY['read_invoices', 'update_invoices', 'create_decision', 'search_memory', 'add_memory'],
  '[{"type":"schedule","cron":"0 6 * * 1-5"}]'::jsonb,
  1.50, 40.00, 0.28, 8.60,
  3, 650, 204, 6, 1,
  26.40, 86.0, 'custom'
);

-- Finance: Invoice Agent
INSERT INTO agents (id, business_id, name, role, avatar, status,
  system_prompt, context_permissions, allowed_actions, triggers,
  budget_daily_usd, budget_monthly_usd, spent_today_usd, spent_this_month_usd,
  level, xp, tasks_completed, decisions_escalated, overrides_by_human,
  cost_total_usd, hours_saved_estimated, source
) VALUES (
  '00000000-0000-0000-0000-000000000106',
  '00000000-0000-0000-0000-000000000010',
  'Invoice Agent', 'Finance — Billing & Collections', NULL, 'working',
  'You manage invoicing for My Company. Generate invoices from project completions. Send payment reminders for overdue invoices. Escalate invoices overdue by 30+ days. Track payment status.',
  ARRAY['identity', 'financials', 'relationships'],
  ARRAY['create_invoice', 'read_invoices', 'update_invoices', 'send_email', 'create_decision'],
  '[{"type":"schedule","cron":"0 9 * * 1-5"},{"type":"event","event_type":"project_completed","source":"agent"}]'::jsonb,
  1.50, 40.00, 0.18, 6.90,
  2, 420, 94, 12, 4,
  22.10, 42.0, 'custom'
);

-- Ops: Coordinator
INSERT INTO agents (id, business_id, name, role, avatar, status,
  system_prompt, context_permissions, allowed_actions, triggers,
  budget_daily_usd, budget_monthly_usd, spent_today_usd, spent_this_month_usd,
  level, xp, tasks_completed, decisions_escalated, overrides_by_human,
  cost_total_usd, hours_saved_estimated, source
) VALUES (
  '00000000-0000-0000-0000-000000000107',
  '00000000-0000-0000-0000-000000000010',
  'Ops Coordinator', 'Operations — Orchestration', NULL, 'working',
  'You are the operations coordinator for My Company. Route tasks between agents. Monitor agent health and performance. Compile daily briefings. Coordinate cross-department workflows. Flag bottlenecks and suggest process improvements.',
  ARRAY['identity', 'financials', 'relationships', 'deadlines', 'memory'],
  ARRAY['send_message', 'create_decision', 'search_memory', 'add_memory', 'read_agents'],
  '[{"type":"schedule","cron":"0 7 * * 1-5"},{"type":"event","event_type":"agent_error","source":"system"}]'::jsonb,
  2.00, 50.00, 0.52, 11.30,
  5, 2400, 428, 22, 6,
  35.80, 156.0, 'custom'
);


-- ── Agent Messages (cross-agent communication) ─────────────

INSERT INTO agent_messages (business_id, from_agent_id, to_agent_id, chain_id, chain_depth, message_type, content, processed, created_at) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000001', 0, 'task', '{"action":"draft_proposal","lead":"Globex Corp","value":5000,"notes":"Qualified via BANT. 200 employees, needs PM tool. Budget confirmed."}', TRUE, NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000107', 'a0000000-0000-0000-0000-000000000001', 1, 'handoff', '{"action":"review_proposal","client":"Globex Corp","amount":5000,"document_id":"draft-globex-proposal"}', FALSE, NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-000000000002', 0, 'data', '{"action":"create_faq","top_issues":["SSO setup","billing portal","API rate limits"],"ticket_count":47}', TRUE, NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000106', 'a0000000-0000-0000-0000-000000000003', 0, 'task', '{"action":"match_invoices","stripe_payouts":[{"id":"po_123","amount":4200},{"id":"po_124","amount":1800}]}', TRUE, NOW() - INTERVAL '6 hours'),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000107', 'a0000000-0000-0000-0000-000000000003', 1, 'alert', '{"action":"flag_discrepancy","invoice":"INV-2024-089","expected":4200,"received":3990,"diff":210}', FALSE, NOW() - INTERVAL '5 hours'),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000004', 0, 'task', '{"action":"follow_up","leads":["Initech","Contoso","Aperture Labs"],"reason":"no_response_7_days"}', TRUE, NOW() - INTERVAL '3 hours'),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000107', 'a0000000-0000-0000-0000-000000000005', 0, 'status', '{"action":"content_ready","type":"blog_post","title":"5 PM Mistakes That Kill Velocity","word_count":1400}', FALSE, NOW() - INTERVAL '30 minutes');


-- ── Decision Cards ──────────────────────────────────────────

INSERT INTO decision_cards (business_id, agent_id, type, title, description, options, urgency, status, created_at) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000102', 'approval', 'Send proposal to Globex ($5,000)', 'Sales Agent drafted a proposal based on the discovery call with Globex Corp. 200-person company looking for PM tooling. Proposal includes annual plan at $5,000/yr. Ready for your review before sending.', '[{"label":"Approve & Send","value":"approve"},{"label":"Review First","value":"edit"},{"label":"Decline","value":"reject"}]'::jsonb, 'high', 'pending', NOW() - INTERVAL '45 minutes'),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000104', 'alert', 'Content Agent nearing budget limit', 'At 85% of $60/mo budget with 18 days left. Currently generating a 3-part blog series on project management best practices.', '[{"label":"Increase to $90","value":"increase"},{"label":"Pause Agent","value":"pause"},{"label":"OK, Let It Run","value":"dismiss"}]'::jsonb, 'medium', 'pending', NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000103', 'approval', 'Refund request from Initech ($120)', 'Support Agent flagged this — customer claims SSO integration didn''t work for 2 weeks. Refund is within policy. Customer has been with us 8 months, $1,200 LTV.', '[{"label":"Approve Refund","value":"approve"},{"label":"Investigate","value":"review"},{"label":"Deny","value":"hold"}]'::jsonb, 'low', 'pending', NOW() - INTERVAL '4 hours'),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000106', 'alert', 'Invoice INV-2024-089 payment discrepancy', 'Stripe payout of $3,990 doesn''t match invoice amount of $4,200. Difference: $210 (likely Stripe fees + tax adjustment). Needs manual verification.', '[{"label":"Mark as Reconciled","value":"reconcile"},{"label":"Contact Client","value":"contact"},{"label":"Flag for Accountant","value":"escalate"}]'::jsonb, 'medium', 'pending', NOW() - INTERVAL '5 hours'),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000101', 'approval', 'New enterprise lead: Aperture Labs', 'Inbound lead scored 92/100. 500+ employees, $50K+ potential ARR. CTO filled out enterprise inquiry form. Recommend priority outreach within 24h.', '[{"label":"Approve Outreach","value":"approve"},{"label":"I''ll Handle This","value":"self"},{"label":"Not Now","value":"defer"}]'::jsonb, 'high', 'pending', NOW() - INTERVAL '1 hour');


-- ── Relationships (CRM) ────────────────────────────────────

INSERT INTO relationships (business_id, name, email, type, status, notes, last_interaction, total_revenue, metadata) VALUES
('00000000-0000-0000-0000-000000000010', 'Globex Corp', 'sarah@globex.com', 'lead', 'active', 'PM tool evaluation. 200 employees. CTO referral. Budget approved.', NOW() - INTERVAL '2 hours', 0, '{"company_size":200,"source":"referral","score":88}'::jsonb),
('00000000-0000-0000-0000-000000000010', 'Initech', 'mike@initech.com', 'customer', 'active', 'Active customer since July 2025. 50-seat plan. Had SSO issues recently.', NOW() - INTERVAL '4 hours', 1200.00, '{"plan":"team","seats":50,"mrr":150}'::jsonb),
('00000000-0000-0000-0000-000000000010', 'Contoso Ltd', 'j.chen@contoso.com', 'customer', 'active', 'Enterprise customer. 120 seats. Renewed in Jan 2026.', NOW() - INTERVAL '3 days', 14400.00, '{"plan":"enterprise","seats":120,"mrr":1200}'::jsonb),
('00000000-0000-0000-0000-000000000010', 'Aperture Labs', 'cave@aperturelabs.com', 'lead', 'active', 'Enterprise inquiry. 500+ employees. CTO interested. High priority.', NOW() - INTERVAL '1 hour', 0, '{"company_size":500,"source":"inbound","score":92}'::jsonb),
('00000000-0000-0000-0000-000000000010', 'Wayne Enterprises', 'lucius@wayne.com', 'customer', 'active', 'Long-term customer. Using for R&D project tracking. Very engaged.', NOW() - INTERVAL '1 week', 9600.00, '{"plan":"enterprise","seats":80,"mrr":800}'::jsonb),
('00000000-0000-0000-0000-000000000010', 'Stark Industries', 'pepper@stark.com', 'lead', 'active', 'Evaluating alternatives to Monday.com. 300 seats needed.', NOW() - INTERVAL '5 days', 0, '{"company_size":300,"source":"outbound","score":75}'::jsonb),
('00000000-0000-0000-0000-000000000010', 'Umbrella Corp', 'wesker@umbrella.co', 'customer', 'churned', 'Churned Feb 2026. Moved to Asana. Exit survey: wanted Gantt charts.', NOW() - INTERVAL '1 month', 3600.00, '{"plan":"team","seats":30,"churn_reason":"missing_features"}'::jsonb),
('00000000-0000-0000-0000-000000000010', 'Cyberdyne Systems', 'miles@cyberdyne.io', 'customer', 'active', 'New customer. Signed up last month. 20-seat starter plan.', NOW() - INTERVAL '2 days', 480.00, '{"plan":"starter","seats":20,"mrr":80}'::jsonb),
('00000000-0000-0000-0000-000000000010', 'Oscorp', 'norman@oscorp.com', 'vendor', 'active', 'Cloud infrastructure provider. Annual contract.', NOW() - INTERVAL '2 weeks', 0, '{"service":"hosting","contract_value":12000}'::jsonb),
('00000000-0000-0000-0000-000000000010', 'Parker & Associates', 'ben@parkerassoc.com', 'vendor', 'active', 'Legal counsel. Handles contracts and compliance.', NOW() - INTERVAL '1 month', 0, '{"service":"legal","hourly_rate":350}'::jsonb);


-- ── Invoices ────────────────────────────────────────────────

INSERT INTO invoices (business_id, client_name, client_email, amount, description, status, due_date, paid_at, created_by_agent, created_at) VALUES
('00000000-0000-0000-0000-000000000010', 'Contoso Ltd', 'billing@contoso.com', 1200.00, 'Enterprise plan — March 2026', 'paid', '2026-03-01', NOW() - INTERVAL '10 days', '00000000-0000-0000-0000-000000000106', NOW() - INTERVAL '15 days'),
('00000000-0000-0000-0000-000000000010', 'Wayne Enterprises', 'billing@wayne.com', 800.00, 'Enterprise plan — March 2026', 'paid', '2026-03-01', NOW() - INTERVAL '8 days', '00000000-0000-0000-0000-000000000106', NOW() - INTERVAL '15 days'),
('00000000-0000-0000-0000-000000000010', 'Initech', 'billing@initech.com', 150.00, 'Team plan — March 2026', 'paid', '2026-03-05', NOW() - INTERVAL '7 days', '00000000-0000-0000-0000-000000000106', NOW() - INTERVAL '12 days'),
('00000000-0000-0000-0000-000000000010', 'Cyberdyne Systems', 'billing@cyberdyne.io', 80.00, 'Starter plan — March 2026', 'sent', '2026-03-15', NULL, '00000000-0000-0000-0000-000000000106', NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000010', 'Contoso Ltd', 'billing@contoso.com', 1200.00, 'Enterprise plan — April 2026', 'draft', '2026-04-01', NULL, '00000000-0000-0000-0000-000000000106', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000010', 'Initech', 'billing@initech.com', 120.00, 'SSO issue credit — refund pending', 'overdue', '2026-03-08', NULL, '00000000-0000-0000-0000-000000000103', NOW() - INTERVAL '10 days'),
('00000000-0000-0000-0000-000000000010', 'Wayne Enterprises', 'billing@wayne.com', 800.00, 'Enterprise plan — April 2026', 'draft', '2026-04-01', NULL, '00000000-0000-0000-0000-000000000106', NOW());


-- ── Deadlines ───────────────────────────────────────────────

INSERT INTO deadlines (business_id, title, description, due_date, type, status, handled_by_agent) VALUES
('00000000-0000-0000-0000-000000000010', 'Q1 estimated tax payment', 'Federal estimated tax — Q1 2026', '2026-04-15', 'tax', 'upcoming', '00000000-0000-0000-0000-000000000105'),
('00000000-0000-0000-0000-000000000010', 'CA LLC annual fee', 'California $800 annual LLC fee', '2026-04-15', 'compliance', 'upcoming', '00000000-0000-0000-0000-000000000105'),
('00000000-0000-0000-0000-000000000010', 'Contoso contract renewal', 'Enterprise annual renewal — auto-renew unless cancelled', '2026-06-15', 'contract', 'upcoming', '00000000-0000-0000-0000-000000000102'),
('00000000-0000-0000-0000-000000000010', 'Quarterly business review', 'Compile Q1 2026 metrics and growth report', '2026-04-01', 'review', 'upcoming', '00000000-0000-0000-0000-000000000107'),
('00000000-0000-0000-0000-000000000010', 'SOC 2 audit prep', 'Prepare documentation for SOC 2 Type II audit', '2026-05-01', 'compliance', 'upcoming', '00000000-0000-0000-0000-000000000107'),
('00000000-0000-0000-0000-000000000010', 'Blog series: PM Best Practices', '3-part series on project management', '2026-03-21', 'content', 'upcoming', '00000000-0000-0000-0000-000000000104'),
('00000000-0000-0000-0000-000000000010', 'Weekly newsletter', 'Send weekly product updates newsletter', '2026-03-14', 'content', 'upcoming', '00000000-0000-0000-0000-000000000104');


-- ── Projects ────────────────────────────────────────────────

INSERT INTO projects (business_id, name, description, status, priority, budget_usd, spent_usd, due_date) VALUES
('00000000-0000-0000-0000-000000000010', 'Globex Corp Onboarding', 'Onboard Globex Corp — 200 seats, custom SSO integration', 'active', 'high', 5000.00, 0, '2026-04-01'),
('00000000-0000-0000-0000-000000000010', 'Q1 Content Campaign', '12 blog posts + 48 social posts for Q1 2026', 'active', 'medium', 2000.00, 1420.00, '2026-03-31'),
('00000000-0000-0000-0000-000000000010', 'SOC 2 Compliance', 'Prepare for SOC 2 Type II audit — documentation + controls', 'active', 'high', 8000.00, 2100.00, '2026-05-01'),
('00000000-0000-0000-0000-000000000010', 'Pricing Page Revamp', 'Redesign pricing page with new enterprise tier', 'active', 'medium', 1500.00, 600.00, '2026-03-28'),
('00000000-0000-0000-0000-000000000010', 'Customer Health Dashboard', 'Build internal dashboard to track customer health scores', 'active', 'low', 3000.00, 450.00, '2026-04-15'),
('00000000-0000-0000-0000-000000000010', 'January Security Audit', 'Annual security audit and penetration testing', 'completed', 'high', 5000.00, 4800.00, '2026-01-31'),
('00000000-0000-0000-0000-000000000010', 'Website Redesign', 'Full marketing site redesign', 'completed', 'medium', 4000.00, 3200.00, '2026-02-15');


-- ── Documents (Vault) ───────────────────────────────────────

INSERT INTO documents (business_id, name, file_type, file_size_bytes, category, tags, description, access_level, created_by_agent_id, source, created_at) VALUES
('00000000-0000-0000-0000-000000000010', 'Globex Corp Proposal v2.pdf', 'application/pdf', 245000, 'proposal', ARRAY['sales','globex','proposal'], 'Sales proposal for Globex Corp — 200 seats annual plan', 'internal', '00000000-0000-0000-0000-000000000102', 'agent', NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000010', 'Q1 2026 Revenue Report.pdf', 'application/pdf', 180000, 'report', ARRAY['finance','q1','revenue'], 'Quarterly revenue summary — $135K total, $45K MRR', 'internal', '00000000-0000-0000-0000-000000000105', 'agent', NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000010', 'SOC 2 Controls Matrix.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 520000, 'legal', ARRAY['compliance','soc2','audit'], 'SOC 2 Type II controls documentation', 'restricted', NULL, 'upload', NOW() - INTERVAL '2 weeks'),
('00000000-0000-0000-0000-000000000010', '5 PM Mistakes That Kill Velocity.md', 'text/markdown', 8400, 'report', ARRAY['content','blog','draft'], 'Blog post draft — PM best practices series part 1', 'internal', '00000000-0000-0000-0000-000000000104', 'agent', NOW() - INTERVAL '30 minutes'),
('00000000-0000-0000-0000-000000000010', 'Contoso Renewal Agreement.pdf', 'application/pdf', 340000, 'contract', ARRAY['contract','contoso','renewal'], 'Enterprise renewal agreement — Jun 2026', 'restricted', NULL, 'upload', NOW() - INTERVAL '1 month'),
('00000000-0000-0000-0000-000000000010', 'March Expense Report.csv', 'text/csv', 12000, 'receipt', ARRAY['finance','expenses','march'], 'Monthly expense categorization', 'internal', '00000000-0000-0000-0000-000000000105', 'agent', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000010', 'Brand Voice Guide.pdf', 'application/pdf', 95000, 'other', ARRAY['brand','content','guide'], 'My Company brand voice and style guide', 'team', NULL, 'upload', NOW() - INTERVAL '3 months'),
('00000000-0000-0000-0000-000000000010', 'Support FAQ — SSO Setup.md', 'text/markdown', 4200, 'report', ARRAY['support','faq','sso'], 'Auto-generated FAQ from top support tickets', 'team', '00000000-0000-0000-0000-000000000104', 'agent', NOW() - INTERVAL '1 week');


-- ── Business Memory ─────────────────────────────────────────

INSERT INTO business_memory (business_id, content, category, tags, importance, source_agent_id, created_at) VALUES
('00000000-0000-0000-0000-000000000010', 'My Company pricing: Starter $80/mo (20 seats), Team $150/mo (50 seats), Enterprise $800+/mo (custom). Annual discount 15%.', 'fact', ARRAY['pricing','plans'], 10, NULL, NOW() - INTERVAL '2 months'),
('00000000-0000-0000-0000-000000000010', 'Top 3 support issues this month: 1) SSO configuration (34%), 2) Billing portal access (28%), 3) API rate limit questions (18%)', 'insight', ARRAY['support','issues'], 8, '00000000-0000-0000-0000-000000000103', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000010', 'Competitor Monday.com raised prices 20% in Feb 2026. Several of their customers reaching out to us. Opportunity for targeted campaign.', 'insight', ARRAY['competitor','opportunity'], 9, '00000000-0000-0000-0000-000000000101', NOW() - INTERVAL '3 weeks'),
('00000000-0000-0000-0000-000000000010', 'Contoso Ltd CTO (James Chen) prefers email over calls. Best response times: Tuesday-Thursday mornings. Decision maker for renewal.', 'relationship', ARRAY['contoso','preferences'], 7, '00000000-0000-0000-0000-000000000102', NOW() - INTERVAL '2 weeks'),
('00000000-0000-0000-0000-000000000010', 'California LLC annual fee of $800 due by April 15 every year. File Form 568 with FTB. Agent auto-prepares but needs founder approval for payment.', 'fact', ARRAY['tax','compliance','california'], 9, '00000000-0000-0000-0000-000000000105', NOW() - INTERVAL '1 month'),
('00000000-0000-0000-0000-000000000010', 'Blog posts published on Tuesdays get 2.3x more engagement than other days. Best social posting times: 10am and 2pm PT.', 'insight', ARRAY['content','analytics'], 7, '00000000-0000-0000-0000-000000000104', NOW() - INTERVAL '2 weeks'),
('00000000-0000-0000-0000-000000000010', 'Stripe processing fees average 2.9% + $0.30. For large invoices ($1K+), consider ACH transfer to save ~2%.', 'fact', ARRAY['finance','stripe','fees'], 6, '00000000-0000-0000-0000-000000000105', NOW() - INTERVAL '1 month'),
('00000000-0000-0000-0000-000000000010', 'Umbrella Corp churned because we lack Gantt chart views. 3 other customers have also requested this feature. Consider adding to roadmap.', 'insight', ARRAY['churn','feature-request','gantt'], 8, '00000000-0000-0000-0000-000000000103', NOW() - INTERVAL '3 weeks');


-- ── Cost Snapshots (last 14 days) ───────────────────────────

INSERT INTO cost_snapshots (business_id, date, total_cost_usd, by_agent, by_model, by_task_type, api_calls_count, tokens_input, tokens_output, agents_active) VALUES
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 13, 3.2400, '{"Lead Qualifier":0.72,"Proposal Writer":0.41,"Ticket Resolver":0.58,"Content Writer":0.84,"Bookkeeper":0.22,"Invoice Agent":0.15,"Ops Coordinator":0.28}', '{"claude-3-5-haiku":1.82,"claude-3-5-sonnet":1.42}', '{"qualification":0.72,"drafting":1.25,"support":0.58,"scheduling":0.28,"reconciliation":0.41}', 84, 142000, 38000, 6),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 12, 4.1200, '{"Lead Qualifier":0.91,"Proposal Writer":0.68,"Ticket Resolver":0.72,"Content Writer":0.95,"Bookkeeper":0.31,"Invoice Agent":0.18,"Ops Coordinator":0.37}', '{"claude-3-5-haiku":2.24,"claude-3-5-sonnet":1.88}', '{"qualification":0.91,"drafting":1.63,"support":0.72,"scheduling":0.37,"reconciliation":0.49}', 102, 178000, 46000, 7),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 11, 3.5600, '{"Lead Qualifier":0.68,"Proposal Writer":0.52,"Ticket Resolver":0.64,"Content Writer":0.88,"Bookkeeper":0.28,"Invoice Agent":0.22,"Ops Coordinator":0.34}', '{"claude-3-5-haiku":1.94,"claude-3-5-sonnet":1.62}', '{"qualification":0.68,"drafting":1.40,"support":0.64,"scheduling":0.34,"reconciliation":0.50}', 92, 156000, 41000, 7),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 10, 2.8800, '{"Lead Qualifier":0.54,"Proposal Writer":0.38,"Ticket Resolver":0.52,"Content Writer":0.72,"Bookkeeper":0.25,"Invoice Agent":0.14,"Ops Coordinator":0.33}', '{"claude-3-5-haiku":1.58,"claude-3-5-sonnet":1.30}', '{"qualification":0.54,"drafting":1.10,"support":0.52,"scheduling":0.33,"reconciliation":0.39}', 78, 128000, 34000, 6),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 9, 3.9400, '{"Lead Qualifier":0.82,"Proposal Writer":0.61,"Ticket Resolver":0.68,"Content Writer":0.91,"Bookkeeper":0.30,"Invoice Agent":0.20,"Ops Coordinator":0.32}', '{"claude-3-5-haiku":2.14,"claude-3-5-sonnet":1.80}', '{"qualification":0.82,"drafting":1.52,"support":0.68,"scheduling":0.32,"reconciliation":0.50}', 96, 168000, 44000, 7),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 8, 3.6200, '{"Lead Qualifier":0.74,"Proposal Writer":0.55,"Ticket Resolver":0.62,"Content Writer":0.86,"Bookkeeper":0.27,"Invoice Agent":0.19,"Ops Coordinator":0.39}', '{"claude-3-5-haiku":1.98,"claude-3-5-sonnet":1.64}', '{"qualification":0.74,"drafting":1.41,"support":0.62,"scheduling":0.39,"reconciliation":0.46}', 89, 160000, 42000, 7),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 7, 1.2400, '{"Lead Qualifier":0.12,"Proposal Writer":0.00,"Ticket Resolver":0.38,"Content Writer":0.45,"Bookkeeper":0.08,"Invoice Agent":0.00,"Ops Coordinator":0.21}', '{"claude-3-5-haiku":0.82,"claude-3-5-sonnet":0.42}', '{"qualification":0.12,"drafting":0.45,"support":0.38,"scheduling":0.21,"reconciliation":0.08}', 32, 52000, 14000, 4),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 6, 1.1800, '{"Lead Qualifier":0.08,"Proposal Writer":0.00,"Ticket Resolver":0.42,"Content Writer":0.38,"Bookkeeper":0.00,"Invoice Agent":0.00,"Ops Coordinator":0.30}', '{"claude-3-5-haiku":0.78,"claude-3-5-sonnet":0.40}', '{"qualification":0.08,"drafting":0.38,"support":0.42,"scheduling":0.30,"reconciliation":0.00}', 28, 48000, 12000, 3),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 5, 3.8800, '{"Lead Qualifier":0.86,"Proposal Writer":0.58,"Ticket Resolver":0.66,"Content Writer":0.82,"Bookkeeper":0.32,"Invoice Agent":0.21,"Ops Coordinator":0.43}', '{"claude-3-5-haiku":2.12,"claude-3-5-sonnet":1.76}', '{"qualification":0.86,"drafting":1.40,"support":0.66,"scheduling":0.43,"reconciliation":0.53}', 98, 172000, 45000, 7),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 4, 4.3200, '{"Lead Qualifier":0.94,"Proposal Writer":0.72,"Ticket Resolver":0.78,"Content Writer":0.98,"Bookkeeper":0.28,"Invoice Agent":0.24,"Ops Coordinator":0.38}', '{"claude-3-5-haiku":2.38,"claude-3-5-sonnet":1.94}', '{"qualification":0.94,"drafting":1.70,"support":0.78,"scheduling":0.38,"reconciliation":0.52}', 112, 188000, 50000, 7),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 3, 3.7400, '{"Lead Qualifier":0.78,"Proposal Writer":0.48,"Ticket Resolver":0.70,"Content Writer":0.90,"Bookkeeper":0.26,"Invoice Agent":0.18,"Ops Coordinator":0.34}', '{"claude-3-5-haiku":2.04,"claude-3-5-sonnet":1.70}', '{"qualification":0.78,"drafting":1.38,"support":0.70,"scheduling":0.34,"reconciliation":0.44}', 94, 164000, 43000, 7),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 2, 4.0600, '{"Lead Qualifier":0.88,"Proposal Writer":0.64,"Ticket Resolver":0.74,"Content Writer":0.92,"Bookkeeper":0.30,"Invoice Agent":0.22,"Ops Coordinator":0.36}', '{"claude-3-5-haiku":2.22,"claude-3-5-sonnet":1.84}', '{"qualification":0.88,"drafting":1.56,"support":0.74,"scheduling":0.36,"reconciliation":0.52}', 106, 180000, 47000, 7),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE - 1, 3.5200, '{"Lead Qualifier":0.72,"Proposal Writer":0.44,"Ticket Resolver":0.62,"Content Writer":0.88,"Bookkeeper":0.28,"Invoice Agent":0.16,"Ops Coordinator":0.42}', '{"claude-3-5-haiku":1.92,"claude-3-5-sonnet":1.60}', '{"qualification":0.72,"drafting":1.32,"support":0.62,"scheduling":0.42,"reconciliation":0.44}', 88, 154000, 40000, 7),
('00000000-0000-0000-0000-000000000010', CURRENT_DATE, 3.8600, '{"Lead Qualifier":0.87,"Proposal Writer":0.42,"Ticket Resolver":0.64,"Content Writer":0.95,"Bookkeeper":0.28,"Invoice Agent":0.18,"Ops Coordinator":0.52}', '{"claude-3-5-haiku":2.10,"claude-3-5-sonnet":1.76}', '{"qualification":0.87,"drafting":1.37,"support":0.64,"scheduling":0.52,"reconciliation":0.46}', 95, 166000, 43000, 7);


-- ── Safety Config ───────────────────────────────────────────

INSERT INTO safety_config (
  business_id, global_daily_budget_usd, global_monthly_budget_usd,
  kill_switch_active, lockdown_mode,
  circuit_breaker_max_failures, circuit_breaker_window_seconds,
  loop_max_chain_depth, loop_repeat_threshold,
  model_routing_strategy, infra_mode,
  human_gate_overrides
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  20.00, 500.00,
  FALSE, FALSE,
  3, 300,
  10, 3,
  'balanced', 'cloud',
  '["payments","contracts","tax_filing","data_deletion","refunds_over_100"]'::jsonb
) ON CONFLICT (business_id) DO NOTHING;


-- ── Audit Log (recent activity) ─────────────────────────────

INSERT INTO audit_log (business_id, actor, actor_agent_id, action, resource_type, input_summary, output_summary, cost_usd, model_used, tokens_used, context_accessed, success, created_at) VALUES
('00000000-0000-0000-0000-000000000010', 'agent', '00000000-0000-0000-0000-000000000101', 'qualify_lead', 'relationship', 'Evaluate Globex Corp inbound form submission', 'Scored 88/100 — qualified. BANT: Budget confirmed, Authority: CTO, Need: PM tool, Timeline: Q2 2026', 0.0340, 'claude-3-5-haiku-20241022', 4200, ARRAY['identity','relationships','memory'], TRUE, NOW() - INTERVAL '3 hours'),
('00000000-0000-0000-0000-000000000010', 'agent', '00000000-0000-0000-0000-000000000102', 'draft_proposal', 'document', 'Draft proposal for Globex Corp — 200 seats annual', 'Generated 4-page proposal with pricing, timeline, and case studies', 0.1240, 'claude-3-5-sonnet-20241022', 12400, ARRAY['identity','relationships','financials'], TRUE, NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000010', 'agent', '00000000-0000-0000-0000-000000000103', 'resolve_ticket', 'relationship', 'Initech SSO configuration issue', 'Provided step-by-step SSO setup guide. Customer confirmed working.', 0.0180, 'claude-3-5-haiku-20241022', 2800, ARRAY['identity','memory'], TRUE, NOW() - INTERVAL '4 hours'),
('00000000-0000-0000-0000-000000000010', 'agent', '00000000-0000-0000-0000-000000000103', 'resolve_ticket', 'relationship', 'Initech billing portal access request', 'Reset billing portal credentials and sent new login link.', 0.0120, 'claude-3-5-haiku-20241022', 1800, ARRAY['identity','relationships'], TRUE, NOW() - INTERVAL '4 hours'),
('00000000-0000-0000-0000-000000000010', 'agent', '00000000-0000-0000-0000-000000000103', 'escalate_decision', 'decision_card', 'Initech refund request — $120 for SSO downtime', 'Created decision card for founder approval. Within refund policy.', 0.0080, 'claude-3-5-haiku-20241022', 1200, ARRAY['identity','relationships','financials'], TRUE, NOW() - INTERVAL '4 hours'),
('00000000-0000-0000-0000-000000000010', 'agent', '00000000-0000-0000-0000-000000000104', 'create_content', 'document', 'Write blog post: 5 PM Mistakes That Kill Velocity', 'Published 1,400 word blog post. Scheduled for Tuesday 10am PT.', 0.1680, 'claude-3-5-sonnet-20241022', 16800, ARRAY['identity','memory'], TRUE, NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000010', 'agent', '00000000-0000-0000-0000-000000000105', 'reconcile', 'invoice', 'Daily Stripe payout reconciliation', 'Matched 12 of 13 payouts. Flagged 1 discrepancy (INV-2024-089: $210 difference).', 0.0220, 'claude-3-5-haiku-20241022', 3200, ARRAY['financials'], TRUE, NOW() - INTERVAL '6 hours'),
('00000000-0000-0000-0000-000000000010', 'agent', '00000000-0000-0000-0000-000000000106', 'send_invoice', 'invoice', 'Send March invoice to Cyberdyne Systems', 'Invoice for $80 (Starter plan) sent to billing@cyberdyne.io', 0.0060, 'claude-3-5-haiku-20241022', 900, ARRAY['financials','relationships'], TRUE, NOW() - INTERVAL '5 hours'),
('00000000-0000-0000-0000-000000000010', 'agent', '00000000-0000-0000-0000-000000000107', 'morning_brief', 'business', 'Compile daily operations brief', '5 pending decisions, 7 agents active, $3.86 spent today. No critical issues.', 0.0420, 'claude-3-5-haiku-20241022', 5600, ARRAY['identity','financials','relationships','deadlines'], TRUE, NOW() - INTERVAL '7 hours'),
('00000000-0000-0000-0000-000000000010', 'agent', '00000000-0000-0000-0000-000000000107', 'route_task', 'agent_message', 'Route follow-up task to Lead Qualifier', 'Assigned follow-up for 3 leads with no response in 7 days', 0.0080, 'claude-3-5-haiku-20241022', 1100, ARRAY['relationships'], TRUE, NOW() - INTERVAL '3 hours'),
('00000000-0000-0000-0000-000000000010', 'agent', '00000000-0000-0000-0000-000000000101', 'qualify_lead', 'relationship', 'Evaluate Aperture Labs enterprise inquiry', 'Scored 92/100 — high priority enterprise lead. 500+ employees, CTO inquiry.', 0.0380, 'claude-3-5-haiku-20241022', 4800, ARRAY['identity','relationships','memory'], TRUE, NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000010', 'user', NULL, 'login', 'auth', NULL, 'Successful login from 192.168.1.1', NULL, NULL, NULL, NULL, TRUE, NOW() - INTERVAL '8 hours');


-- ── Achievements ────────────────────────────────────────────

INSERT INTO achievements (business_id, type, title, description, unlocked_at) VALUES
('00000000-0000-0000-0000-000000000010', 'first_agent', 'First Hire', 'Hired your first AI agent', NOW() - INTERVAL '3 months'),
('00000000-0000-0000-0000-000000000010', 'team_of_five', 'Dream Team', 'Built a team of 5+ agents', NOW() - INTERVAL '2 months'),
('00000000-0000-0000-0000-000000000010', 'hundred_tasks', 'Century Club', 'Agents completed 100+ tasks', NOW() - INTERVAL '6 weeks'),
('00000000-0000-0000-0000-000000000010', 'thousand_tasks', 'Productivity Machine', 'Agents completed 1,000+ tasks', NOW() - INTERVAL '2 weeks'),
('00000000-0000-0000-0000-000000000010', 'first_revenue', 'Money Maker', 'First agent-generated revenue', NOW() - INTERVAL '10 weeks'),
('00000000-0000-0000-0000-000000000010', 'zero_downtime_week', 'Always On', '7 consecutive days with no agent errors', NOW() - INTERVAL '1 week'),
('00000000-0000-0000-0000-000000000010', 'cost_efficient', 'Penny Pincher', 'Kept daily costs under $5 for 30 days', NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000010', 'first_escalation', 'Safety First', 'First decision escalated by an agent', NOW() - INTERVAL '11 weeks');


-- ── Channels ────────────────────────────────────────────────

INSERT INTO channels (business_id, name, type, participants, last_message_at, unread_count, pinned) VALUES
('00000000-0000-0000-0000-000000000010', 'General', 'internal', ARRAY['Lead Qualifier','Proposal Writer','Ticket Resolver','Content Writer','Bookkeeper','Invoice Agent','Ops Coordinator'], NOW() - INTERVAL '30 minutes', 3, TRUE),
('00000000-0000-0000-0000-000000000010', 'Sales Pipeline', 'internal', ARRAY['Lead Qualifier','Proposal Writer','Ops Coordinator'], NOW() - INTERVAL '2 hours', 1, TRUE),
('00000000-0000-0000-0000-000000000010', 'Support Queue', 'internal', ARRAY['Ticket Resolver','Ops Coordinator'], NOW() - INTERVAL '1 hour', 0, FALSE),
('00000000-0000-0000-0000-000000000010', 'Finance & Billing', 'internal', ARRAY['Bookkeeper','Invoice Agent','Ops Coordinator'], NOW() - INTERVAL '5 hours', 2, FALSE),
('00000000-0000-0000-0000-000000000010', 'Content Calendar', 'internal', ARRAY['Content Writer','Ops Coordinator'], NOW() - INTERVAL '30 minutes', 0, FALSE),
('00000000-0000-0000-0000-000000000010', 'Alerts & Escalations', 'internal', ARRAY['Ops Coordinator'], NOW() - INTERVAL '1 hour', 5, TRUE);


-- ── Expenses ────────────────────────────────────────────────

INSERT INTO expenses (business_id, description, amount, category, vendor, date, recorded_by_agent_id) VALUES
('00000000-0000-0000-0000-000000000010', 'Claude API — March usage', 42.80, 'ai', 'Anthropic', CURRENT_DATE - 1, '00000000-0000-0000-0000-000000000105'),
('00000000-0000-0000-0000-000000000010', 'Supabase Pro plan', 25.00, 'saas', 'Supabase', CURRENT_DATE - 5, '00000000-0000-0000-0000-000000000105'),
('00000000-0000-0000-0000-000000000010', 'Vercel Pro hosting', 20.00, 'hosting', 'Vercel', CURRENT_DATE - 5, '00000000-0000-0000-0000-000000000105'),
('00000000-0000-0000-0000-000000000010', 'Google Workspace', 12.00, 'saas', 'Google', CURRENT_DATE - 10, '00000000-0000-0000-0000-000000000105'),
('00000000-0000-0000-0000-000000000010', 'Stripe processing fees', 128.40, 'other', 'Stripe', CURRENT_DATE - 3, '00000000-0000-0000-0000-000000000105'),
('00000000-0000-0000-0000-000000000010', 'Figma Pro', 15.00, 'saas', 'Figma', CURRENT_DATE - 8, '00000000-0000-0000-0000-000000000105'),
('00000000-0000-0000-0000-000000000010', 'Legal review — SOC 2 docs', 1050.00, 'contractor', 'Parker & Associates', CURRENT_DATE - 14, NULL),
('00000000-0000-0000-0000-000000000010', 'SEO tools (Ahrefs)', 99.00, 'marketing', 'Ahrefs', CURRENT_DATE - 7, '00000000-0000-0000-0000-000000000105');


-- ── Integrations (connected accounts) ───────────────────────

INSERT INTO integrations (business_id, provider, label, status, scopes, metadata, last_synced_at) VALUES
('00000000-0000-0000-0000-000000000010', 'gmail', 'founder@acmestudios.com', 'active', ARRAY['gmail.readonly','gmail.send'], '{"email":"founder@acmestudios.com"}'::jsonb, NOW() - INTERVAL '15 minutes'),
('00000000-0000-0000-0000-000000000010', 'slack', 'My Company Workspace', 'active', ARRAY['chat:write','channels:read'], '{"workspace":"acme-studios"}'::jsonb, NOW() - INTERVAL '5 minutes'),
('00000000-0000-0000-0000-000000000010', 'stripe', 'My Company', 'active', ARRAY['read_write'], '{"account_id":"acct_demo123"}'::jsonb, NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000010', 'google_drive', 'My Company Drive', 'active', ARRAY['drive.readonly'], '{"email":"founder@acmestudios.com"}'::jsonb, NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000010', 'notion', 'My Company', 'error', ARRAY['read_content'], '{"workspace":"My Company"}'::jsonb, NOW() - INTERVAL '3 days');


-- ── Agent Data (KV state) ───────────────────────────────────

INSERT INTO agent_data (business_id, agent_id, key, value) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000101', 'pipeline_summary', '{"total_leads":24,"qualified":18,"disqualified":6,"avg_score":72,"hot_leads":3}'::jsonb),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000101', 'last_run', '{"timestamp":"2026-03-13T09:15:00Z","leads_processed":4,"qualified":3}'::jsonb),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000102', 'proposals_this_month', '{"drafted":5,"sent":3,"accepted":2,"pending":1,"total_value":18500}'::jsonb),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000103', 'ticket_metrics', '{"open":4,"resolved_today":12,"avg_resolution_min":8,"csat_score":4.6,"first_response_min":2}'::jsonb),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000104', 'content_calendar', '{"posts_scheduled":8,"posts_published":34,"newsletter_subscribers":2400,"avg_engagement_rate":3.2}'::jsonb),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000105', 'reconciliation_status', '{"last_date":"2026-03-13","matched":12,"unmatched":1,"total_processed":4200.00}'::jsonb),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000106', 'invoice_summary', '{"sent":4,"paid":3,"overdue":1,"draft":2,"total_outstanding":1280.00}'::jsonb),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000107', 'daily_brief', '{"agents_active":5,"tasks_completed":54,"decisions_pending":5,"cost_today":3.86,"health_score":87}'::jsonb);


-- ── Marketplace Agents (available to hire) ──────────────────

INSERT INTO marketplace_agents (slug, name, description, role, category, author_name, author_verified, manifest, install_count, rating, review_status, pricing, estimated_daily_cost) VALUES
('seo-optimizer', 'SEO Optimizer', 'Analyzes your content for SEO, suggests improvements, tracks rankings, and generates meta descriptions.', 'Marketing — SEO', 'marketing', '1P OS', TRUE, '{"system_prompt":"You optimize content for search engines...","context_permissions":["identity","memory"],"allowed_actions":["search_memory","create_document","send_message"],"triggers":[{"type":"event","event_type":"content_published"}]}'::jsonb, 342, 4.70, 'approved', 'free', 0.80),
('social-scheduler', 'Social Scheduler', 'Creates and schedules social media posts across platforms. Optimizes posting times based on engagement data.', 'Content — Social Media', 'content', '1P OS', TRUE, '{"system_prompt":"You manage social media scheduling...","context_permissions":["identity","memory"],"allowed_actions":["create_document","send_message","search_memory"],"triggers":[{"type":"schedule","cron":"0 9 * * 1-5"}]}'::jsonb, 518, 4.50, 'approved', 'free', 1.20),
('legal-reviewer', 'Legal Reviewer', 'Reviews contracts and legal documents. Flags risky clauses, suggests amendments, and tracks compliance deadlines.', 'Legal — Contract Review', 'legal', '1P OS', TRUE, '{"system_prompt":"You review legal documents...","context_permissions":["identity","financials","memory"],"allowed_actions":["create_document","create_decision","search_memory"],"triggers":[{"type":"event","event_type":"document_uploaded","source":"vault"}]}'::jsonb, 156, 4.80, 'approved', 'free', 1.50),
('data-analyst', 'Data Analyst', 'Analyzes business metrics, creates reports, identifies trends, and provides actionable insights.', 'Analytics — Business Intelligence', 'analytics', '1P OS', TRUE, '{"system_prompt":"You analyze business data...","context_permissions":["identity","financials","relationships","memory"],"allowed_actions":["create_document","search_memory","add_memory"],"triggers":[{"type":"schedule","cron":"0 8 * * 1"}]}'::jsonb, 289, 4.60, 'approved', 'free', 1.00),
('onboarding-specialist', 'Onboarding Specialist', 'Manages customer onboarding flows. Creates personalized onboarding plans and tracks activation milestones.', 'Customer Success — Onboarding', 'support', 'Community', FALSE, '{"system_prompt":"You manage customer onboarding...","context_permissions":["identity","relationships","memory"],"allowed_actions":["send_email","create_document","update_relationships","search_memory"],"triggers":[{"type":"event","event_type":"new_customer"}]}'::jsonb, 87, 4.30, 'approved', 'free', 0.90),
('tax-preparer', 'Tax Preparer', 'Tracks deductible expenses, estimates quarterly taxes, prepares filing summaries, and monitors compliance deadlines.', 'Finance — Tax Compliance', 'finance', 'Community', FALSE, '{"system_prompt":"You handle tax preparation...","context_permissions":["identity","financials","memory"],"allowed_actions":["create_document","create_decision","search_memory","add_memory"],"triggers":[{"type":"schedule","cron":"0 6 1 * *"}]}'::jsonb, 203, 4.40, 'approved', 'free', 0.60);


-- ============================================================
-- Done! Demo data covers:
-- ✓ 1 business (My Company — B2B SaaS, $45K MRR)
-- ✓ 7 agents across 5 departments (all active with realistic metrics)
-- ✓ 7 cross-agent messages showing workflow chains
-- ✓ 5 pending decision cards (approvals + alerts)
-- ✓ 10 relationships (customers, leads, vendors)
-- ✓ 7 invoices (paid, sent, draft, overdue)
-- ✓ 7 deadlines (tax, compliance, content, contracts)
-- ✓ 7 projects (5 active, 2 completed)
-- ✓ 8 documents in vault (proposals, reports, contracts)
-- ✓ 8 business memories (facts, insights, relationships)
-- ✓ 14 days of cost snapshots
-- ✓ Safety config with budget limits
-- ✓ 12 audit log entries
-- ✓ 8 achievements unlocked
-- ✓ 6 communication channels
-- ✓ 8 expenses tracked
-- ✓ 5 integrations connected
-- ✓ Agent KV state for all 7 agents
-- ✓ 6 marketplace agents available to hire
--
-- Login: demo@1pos.dev / demo1234
-- ============================================================
