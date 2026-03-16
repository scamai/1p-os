// =============================================================================
// Dev Bypass — when Supabase/Docker is not running, return mock data
// so the app is fully navigable in local dev.
// =============================================================================

export const DEV_BYPASS = process.env.DEV_BYPASS === "true";

export const MOCK_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "demo@1pos.dev",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { full_name: "Demo Founder" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

export const MOCK_BUSINESS = {
  id: "00000000-0000-0000-0000-000000000010",
  user_id: MOCK_USER.id,
  name: "Acme Studios",
  business_name: "Acme Studios",
  health_score: 87,
  cost_today: 1.24,
  budget_daily: 5,
};

export const MOCK_AGENTS = [
  { id: "00000000-0000-0000-0000-000000000100", name: "CEO", role: "Chief Executive — Strategy & Delegation", status: "active", is_ceo: true, department: "Executive", current_task: "Reviewing Q2 strategy", budget_daily_usd: "5.00", spent_today_usd: "0.31", circuit_open: false },
  { id: "00000000-0000-0000-0000-000000000101", name: "Admin Agent", role: "admin", status: "active", is_ceo: false, department: "Operations", current_task: null, budget_daily_usd: "2.00", spent_today_usd: "0.00", circuit_open: false },
  { id: "00000000-0000-0000-0000-000000000102", name: "Sales Agent", role: "sales", status: "active", is_ceo: false, department: "Sales", current_task: "Drafting proposal for Globex", budget_daily_usd: "2.00", spent_today_usd: "0.52", circuit_open: false },
  { id: "00000000-0000-0000-0000-000000000103", name: "Finance Agent", role: "finance", status: "active", is_ceo: false, department: "Finance", current_task: "Reconciling March payouts", budget_daily_usd: "2.00", spent_today_usd: "0.18", circuit_open: false },
  { id: "00000000-0000-0000-0000-000000000104", name: "Support Agent", role: "support", status: "idle", is_ceo: false, department: "Support", current_task: null, budget_daily_usd: "2.00", spent_today_usd: "0.22", circuit_open: false },
  { id: "00000000-0000-0000-0000-000000000105", name: "Content Agent", role: "content", status: "paused", is_ceo: false, department: "Marketing", current_task: null, budget_daily_usd: "2.00", spent_today_usd: "0.24", circuit_open: false },
];

const now = new Date();
const today = now.toISOString().split("T")[0];

export const MOCK_GOALS = [
  {
    id: "00000000-0000-0000-0000-000000000201",
    business_id: MOCK_BUSINESS.id,
    parent_goal_id: null,
    level: "mission",
    title: "Build a profitable SaaS reaching $10k MRR",
    description: "Primary company mission",
    status: "active",
    assigned_agent_id: null,
    priority: 10,
    due_date: null,
    completed_at: null,
    checked_out_by: null,
    checked_out_at: null,
    created_at: `${today}T00:00:00Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000202",
    business_id: MOCK_BUSINESS.id,
    parent_goal_id: "00000000-0000-0000-0000-000000000201",
    level: "strategic",
    title: "Acquire first 50 paying customers",
    description: "Outbound + inbound sales to hit 50 customers",
    status: "active",
    assigned_agent_id: null,
    priority: 9,
    due_date: null,
    completed_at: null,
    checked_out_by: null,
    checked_out_at: null,
    created_at: `${today}T00:00:00Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000203",
    business_id: MOCK_BUSINESS.id,
    parent_goal_id: "00000000-0000-0000-0000-000000000202",
    level: "tactical",
    title: "Set up inbound lead capture on landing page",
    description: "Form + CRM integration",
    status: "completed",
    assigned_agent_id: "00000000-0000-0000-0000-000000000102",
    priority: 8,
    due_date: null,
    completed_at: `${today}T06:30:00Z`,
    checked_out_by: null,
    checked_out_at: null,
    created_at: `${today}T00:00:00Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000204",
    business_id: MOCK_BUSINESS.id,
    parent_goal_id: "00000000-0000-0000-0000-000000000202",
    level: "tactical",
    title: "Run outbound email campaign to 200 prospects",
    description: "Cold outreach via 3-email drip",
    status: "active",
    assigned_agent_id: "00000000-0000-0000-0000-000000000102",
    priority: 7,
    due_date: null,
    completed_at: null,
    checked_out_by: null,
    checked_out_at: null,
    created_at: `${today}T00:00:00Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000205",
    business_id: MOCK_BUSINESS.id,
    parent_goal_id: "00000000-0000-0000-0000-000000000204",
    level: "task",
    title: "Build prospect list from LinkedIn",
    description: null,
    status: "completed",
    assigned_agent_id: "00000000-0000-0000-0000-000000000102",
    priority: 8,
    due_date: null,
    completed_at: `${today}T05:00:00Z`,
    checked_out_by: null,
    checked_out_at: null,
    created_at: `${today}T00:00:00Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000206",
    business_id: MOCK_BUSINESS.id,
    parent_goal_id: "00000000-0000-0000-0000-000000000204",
    level: "task",
    title: "Draft cold email sequence (3 emails)",
    description: null,
    status: "active",
    assigned_agent_id: "00000000-0000-0000-0000-000000000102",
    priority: 7,
    due_date: null,
    completed_at: null,
    checked_out_by: "00000000-0000-0000-0000-000000000102",
    checked_out_at: `${today}T08:00:00Z`,
    created_at: `${today}T00:00:00Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000207",
    business_id: MOCK_BUSINESS.id,
    parent_goal_id: "00000000-0000-0000-0000-000000000201",
    level: "strategic",
    title: "Reduce churn below 5%",
    description: "Improve retention through onboarding and support",
    status: "active",
    assigned_agent_id: null,
    priority: 8,
    due_date: null,
    completed_at: null,
    checked_out_by: null,
    checked_out_at: null,
    created_at: `${today}T00:00:00Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000208",
    business_id: MOCK_BUSINESS.id,
    parent_goal_id: "00000000-0000-0000-0000-000000000201",
    level: "strategic",
    title: "Keep burn rate under $500/mo",
    description: "Cost discipline across all operations",
    status: "active",
    assigned_agent_id: "00000000-0000-0000-0000-000000000103",
    priority: 7,
    due_date: null,
    completed_at: null,
    checked_out_by: null,
    checked_out_at: null,
    created_at: `${today}T00:00:00Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000209",
    business_id: MOCK_BUSINESS.id,
    parent_goal_id: "00000000-0000-0000-0000-000000000208",
    level: "tactical",
    title: "Audit current spending and create budget",
    description: null,
    status: "completed",
    assigned_agent_id: "00000000-0000-0000-0000-000000000103",
    priority: 8,
    due_date: null,
    completed_at: `${today}T04:00:00Z`,
    checked_out_by: null,
    checked_out_at: null,
    created_at: `${today}T00:00:00Z`,
  },
];

export const MOCK_HEARTBEAT_RUNS = [
  {
    id: "00000000-0000-0000-0000-000000000301",
    business_id: MOCK_BUSINESS.id,
    agent_id: "00000000-0000-0000-0000-000000000100",
    trigger_type: "scheduled",
    status: "completed",
    started_at: `${today}T07:00:00Z`,
    completed_at: `${today}T07:00:12Z`,
    tasks_processed: 2,
    cost_usd: 0.04,
    summary: "CEO processed 2 action(s): 1 goals decomposed, 1 alerts created.",
    error: null,
    agents: { name: "CEO", role: "Chief Executive — Strategy & Delegation" },
  },
  {
    id: "00000000-0000-0000-0000-000000000302",
    business_id: MOCK_BUSINESS.id,
    agent_id: "00000000-0000-0000-0000-000000000102",
    trigger_type: "scheduled",
    status: "completed",
    started_at: `${today}T07:00:15Z`,
    completed_at: `${today}T07:01:02Z`,
    tasks_processed: 3,
    cost_usd: 0.52,
    summary: "Completed: Build prospect list from LinkedIn; Completed: Qualify 2 inbound leads; Completed: Draft proposal for Globex",
    error: null,
    agents: { name: "Sales Agent", role: "sales" },
  },
  {
    id: "00000000-0000-0000-0000-000000000303",
    business_id: MOCK_BUSINESS.id,
    agent_id: "00000000-0000-0000-0000-000000000103",
    trigger_type: "scheduled",
    status: "completed",
    started_at: `${today}T07:00:15Z`,
    completed_at: `${today}T07:00:38Z`,
    tasks_processed: 1,
    cost_usd: 0.18,
    summary: "Completed: Audit current spending and create budget",
    error: null,
    agents: { name: "Finance Agent", role: "finance" },
  },
  {
    id: "00000000-0000-0000-0000-000000000304",
    business_id: MOCK_BUSINESS.id,
    agent_id: "00000000-0000-0000-0000-000000000104",
    trigger_type: "scheduled",
    status: "completed",
    started_at: `${today}T07:00:15Z`,
    completed_at: `${today}T07:00:45Z`,
    tasks_processed: 3,
    cost_usd: 0.22,
    summary: "Completed: Resolve 3 support tickets (avg response 4 min)",
    error: null,
    agents: { name: "Support Agent", role: "support" },
  },
];

export const MOCK_DECISIONS = [
  {
    id: "00000000-0000-0000-0000-000000000401",
    business_id: MOCK_BUSINESS.id,
    type: "approval",
    title: "Send proposal to Globex ($5,000)",
    description: "Sales Agent drafted a proposal based on the discovery call. Ready for review before sending.",
    urgency: "high",
    status: "pending",
    options: [
      { label: "Approve & Send", value: "approve" },
      { label: "Review First", value: "edit" },
      { label: "Decline", value: "reject" },
    ],
    created_at: `${today}T07:01:00Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000402",
    business_id: MOCK_BUSINESS.id,
    type: "alert",
    title: "Content Agent nearing budget limit",
    description: "At 85% of $50/mo budget with 18 days left. Currently generating social content.",
    urgency: "medium",
    status: "pending",
    options: [
      { label: "Increase to $75", value: "increase" },
      { label: "Pause Agent", value: "pause" },
      { label: "OK, Let It Run", value: "dismiss" },
    ],
    created_at: `${today}T07:00:30Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000403",
    business_id: MOCK_BUSINESS.id,
    type: "approval",
    title: "Refund request from Initech ($120)",
    description: "Support Agent flagged this — customer claims service issue. Refund is within policy.",
    urgency: "low",
    status: "pending",
    options: [
      { label: "Approve Refund", value: "approve" },
      { label: "Investigate", value: "review" },
      { label: "Deny", value: "hold" },
    ],
    created_at: `${today}T06:45:00Z`,
  },
];

export const MOCK_AUDIT_LOG = [
  { id: "al-1", actor: "Sales Agent", action: "Qualified 2 new leads from inbound form", details: null, cost: 0.08, created_at: `${today}T07:01:00Z` },
  { id: "al-2", actor: "Support Agent", action: "Resolved 3 tickets — avg response 4 min", details: null, cost: 0.06, created_at: `${today}T06:50:00Z` },
  { id: "al-3", actor: "Finance Agent", action: "Reconciled Stripe payouts for March 1–12", details: null, cost: 0.12, created_at: `${today}T06:30:00Z` },
  { id: "al-4", actor: "CEO", action: "Decomposed Q2 growth strategy into 4 tactical goals", details: null, cost: 0.04, created_at: `${today}T07:00:12Z` },
];

// MOCK_HANDOFFS defined in lib/agents/collaboration.ts — loaded lazily to avoid circular imports

/**
 * Creates a mock Supabase client that returns demo data instead of
 * hitting the real database. Used when DEV_BYPASS=true.
 */
export function createMockSupabaseClient() {
  const mockQuery = (table: string) => {
    let result: unknown = [];

    const tableData: Record<string, unknown[]> = {
      businesses: [MOCK_BUSINESS],
      agents: MOCK_AGENTS,
      goals: MOCK_GOALS,
      heartbeat_runs: MOCK_HEARTBEAT_RUNS,
      decisions: MOCK_DECISIONS,
      integrations: [],
      automation_jobs: [],
      automation_triggers: [],
      automation_runs: [],
      decision_cards: [],
      invoices: [],
      relationships: [],
      projects: [],
      documents: [],
      audit_log: MOCK_AUDIT_LOG,
      agent_messages: [],
      safety_config: [],
    };

    result = tableData[table] ?? [];

    const chain: Record<string, unknown> = {
      data: result,
      error: null,
      count: Array.isArray(result) ? result.length : 0,
    };

    const self = {
      select: () => self,
      insert: () => ({ select: () => ({ single: async () => ({ data: { id: crypto.randomUUID(), ...{} }, error: null }) }), data: null, error: null }),
      update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }), error: null }),
      upsert: () => ({ error: null }),
      delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
      eq: (_col: string, val: unknown) => {
        if (table === "businesses" && _col === "user_id") {
          chain.data = [MOCK_BUSINESS];
        }
        return self;
      },
      neq: () => self,
      gt: () => self,
      gte: () => self,
      lt: () => self,
      lte: () => self,
      like: () => self,
      ilike: () => self,
      is: () => self,
      in: () => self,
      not: () => self,
      or: () => self,
      filter: () => self,
      match: () => self,
      order: () => self,
      limit: () => self,
      range: () => self,
      maybeSingle: async () => ({ data: null, error: null }),
      csv: () => self,
      single: async () => {
        const data = Array.isArray(chain.data) ? chain.data[0] ?? null : chain.data;
        return { data, error: null };
      },
      then: (resolve: (val: typeof chain) => void) => resolve(chain),
    };

    // Make it awaitable
    (self as Record<string, unknown>).data = chain.data;
    (self as Record<string, unknown>).error = null;
    (self as Record<string, unknown>).count = chain.count;

    return self;
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: MOCK_USER }, error: null }),
      signInWithPassword: async () => ({ data: { user: MOCK_USER, session: { access_token: "mock" } }, error: null }),
      signUp: async () => ({ data: { user: MOCK_USER, session: { access_token: "mock" } }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: (table: string) => mockQuery(table),
  };
}
