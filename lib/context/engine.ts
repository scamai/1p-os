import type { SupabaseClient } from '@supabase/supabase-js';

export type ContextScope =
  | 'identity'
  | 'financials'
  | 'relationships'
  | 'deadlines'
  | 'preferences'
  | 'memory';

export interface BusinessContext {
  identity?: Record<string, unknown>;
  financials?: Record<string, unknown>;
  relationships?: Record<string, unknown>[];
  deadlines?: Record<string, unknown>[];
  preferences?: Record<string, unknown>;
  memory?: Record<string, unknown>[];
}

const SCOPE_TABLE_MAP: Record<ContextScope, string> = {
  identity: 'businesses',
  financials: 'businesses',
  relationships: 'relationships',
  deadlines: 'deadlines',
  preferences: 'businesses',
  memory: 'business_memory',
};

export class ContextEngine {
  constructor(
    private supabase: SupabaseClient,
    private businessId: string
  ) {}

  async getContext(scope?: ContextScope | ContextScope[]): Promise<BusinessContext> {
    const scopes: ContextScope[] = scope
      ? Array.isArray(scope)
        ? scope
        : [scope]
      : ['identity', 'financials', 'relationships', 'deadlines', 'preferences', 'memory'];

    const context: BusinessContext = {};

    const fetchers: Record<ContextScope, () => Promise<void>> = {
      identity: async () => {
        const { data } = await this.supabase
          .from('businesses')
          .select('id, name, legal_name, industry, stage, ein_encrypted, address, website')
          .eq('id', this.businessId)
          .single();
        context.identity = data ?? undefined;
      },
      financials: async () => {
        const { data } = await this.supabase
          .from('businesses')
          .select('revenue_ytd, expenses_ytd, runway_months, stripe_customer_id')
          .eq('id', this.businessId)
          .single();
        context.financials = data ?? undefined;
      },
      relationships: async () => {
        const { data } = await this.supabase
          .from('relationships')
          .select('*')
          .eq('business_id', this.businessId)
          .order('updated_at', { ascending: false })
          .limit(100);
        context.relationships = data ?? undefined;
      },
      deadlines: async () => {
        const { data } = await this.supabase
          .from('deadlines')
          .select('*')
          .eq('business_id', this.businessId)
          .gte('due_date', new Date().toISOString())
          .order('due_date', { ascending: true })
          .limit(50);
        context.deadlines = data ?? undefined;
      },
      preferences: async () => {
        const { data } = await this.supabase
          .from('businesses')
          .select('preferences, routing_strategy, timezone, notification_settings')
          .eq('id', this.businessId)
          .single();
        context.preferences = data ?? undefined;
      },
      memory: async () => {
        const { data } = await this.supabase
          .from('business_memory')
          .select('*')
          .eq('business_id', this.businessId)
          .order('created_at', { ascending: false })
          .limit(50);
        context.memory = data ?? undefined;
      },
    };

    await Promise.all(scopes.map((s) => fetchers[s]()));
    return context;
  }

  async updateContext(
    scope: ContextScope,
    data: Record<string, unknown>
  ): Promise<void> {
    const table = SCOPE_TABLE_MAP[scope];

    if (table === 'businesses') {
      const { error } = await this.supabase
        .from('businesses')
        .update(data)
        .eq('id', this.businessId);
      if (error) {
        console.error(`[context/engine] Failed to update ${scope}:`, error);
        throw error;
      }
    } else {
      console.error(`[context/engine] updateContext not supported for scope: ${scope}`);
      throw new Error(`Cannot bulk-update scope: ${scope}`);
    }
  }

  async addMemory(
    content: string,
    category: string,
    tags: string[],
    sourceAgentId?: string
  ): Promise<void> {
    const { error } = await this.supabase.from('business_memory').insert({
      business_id: this.businessId,
      content,
      category,
      tags,
      source_agent_id: sourceAgentId ?? null,
    });

    if (error) {
      console.error('[context/engine] Failed to add memory:', error);
      throw error;
    }
  }

  async searchMemory(query: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.supabase
      .from('business_memory')
      .select('*')
      .eq('business_id', this.businessId)
      .textSearch('content', query, { type: 'websearch' })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[context/engine] Memory search failed:', error);
      return [];
    }

    return data ?? [];
  }
}
