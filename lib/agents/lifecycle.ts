import { SupabaseClient } from '@supabase/supabase-js';

interface CreateAgentConfig {
  name: string;
  role: string;
  system_prompt: string;
  permissions: Record<string, unknown>;
  allowed_actions: string[];
  triggers: Array<{
    type: string;
    schedule?: string;
    event_type?: string;
  }>;
  budget?: {
    daily_limit?: number;
    monthly_limit?: number;
    currency?: string;
  };
  model_preference?: string;
}

interface AgentRow {
  id: string;
  business_id: string;
  name: string;
  role: string;
  system_prompt: string;
  permissions: Record<string, unknown>;
  allowed_actions: string[];
  triggers: unknown[];
  status: string;
  level: number;
  xp: number;
  tasks_completed: number;
  created_at: string;
}

export async function createAgent(
  businessId: string,
  config: CreateAgentConfig,
  supabase: SupabaseClient
): Promise<AgentRow> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .insert({
        business_id: businessId,
        name: config.name,
        role: config.role,
        system_prompt: config.system_prompt,
        permissions: config.permissions,
        allowed_actions: config.allowed_actions,
        triggers: config.triggers,
        budget: config.budget ?? { daily_limit: 5, monthly_limit: 100, currency: 'USD' },
        model_preference: config.model_preference ?? 'claude-sonnet-4-20250514',
        status: 'idle',
        level: 1,
        xp: 0,
        tasks_completed: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AgentRow;
  } catch (error) {
    console.error('[agents/lifecycle] createAgent failed:', error);
    throw error;
  }
}

export async function pauseAgent(
  agentId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { error } = await supabase
      .from('agents')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', agentId);

    if (error) throw error;
  } catch (error) {
    console.error('[agents/lifecycle] pauseAgent failed:', error);
    throw error;
  }
}

export async function resumeAgent(
  agentId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { error } = await supabase
      .from('agents')
      .update({ status: 'idle', updated_at: new Date().toISOString() })
      .eq('id', agentId);

    if (error) throw error;
  } catch (error) {
    console.error('[agents/lifecycle] resumeAgent failed:', error);
    throw error;
  }
}

export async function deleteAgent(
  agentId: string,
  supabase: SupabaseClient,
  hard = false
): Promise<void> {
  try {
    if (hard) {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('agents')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', agentId);
      if (error) throw error;
    }
  } catch (error) {
    console.error('[agents/lifecycle] deleteAgent failed:', error);
    throw error;
  }
}

export async function updateAgent(
  agentId: string,
  updates: Partial<CreateAgentConfig> & Record<string, unknown>,
  supabase: SupabaseClient
): Promise<AgentRow> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;
    return data as AgentRow;
  } catch (error) {
    console.error('[agents/lifecycle] updateAgent failed:', error);
    throw error;
  }
}
