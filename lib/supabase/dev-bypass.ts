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
  owner_id: MOCK_USER.id,
  name: "Acme Studios",
  business_name: "Acme Studios",
  health_score: 87,
  cost_today: 1.24,
  budget_daily: 5,
};

export const MOCK_AGENTS = [
  { id: "00000000-0000-0000-0000-000000000101", name: "Admin Agent", role: "admin", status: "active" },
  { id: "00000000-0000-0000-0000-000000000102", name: "Sales Agent", role: "sales", status: "active" },
  { id: "00000000-0000-0000-0000-000000000103", name: "Finance Agent", role: "finance", status: "active" },
  { id: "00000000-0000-0000-0000-000000000104", name: "Support Agent", role: "support", status: "paused" },
];

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
      integrations: [],
      automation_jobs: [],
      automation_triggers: [],
      automation_runs: [],
      decision_cards: [],
      invoices: [],
      relationships: [],
      projects: [],
      documents: [],
      audit_log: [],
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
        if (table === "businesses" && _col === "owner_id") {
          chain.data = [MOCK_BUSINESS];
        }
        return self;
      },
      neq: () => self,
      gte: () => self,
      lte: () => self,
      in: () => self,
      order: () => self,
      limit: () => self,
      range: () => self,
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
