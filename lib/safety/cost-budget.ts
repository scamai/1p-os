import type { SupabaseClient } from '@supabase/supabase-js';

interface BudgetCheckResult {
  allowed: boolean;
  reason?: string;
}

interface BudgetStatus {
  agents: Array<{
    id: string;
    name: string;
    spentToday: number;
    spentThisMonth: number;
    dailyBudget: number;
    monthlyBudget: number;
  }>;
  global: {
    spentToday: number;
    spentThisMonth: number;
    dailyBudget: number;
    monthlyBudget: number;
  };
}

export async function checkBudget(
  agentId: string,
  businessId: string,
  estimatedCost: number,
  supabase: SupabaseClient
): Promise<BudgetCheckResult> {
  // Fetch agent budget info
  const { data: agent } = await supabase
    .from('agents')
    .select('spent_today_usd, spent_this_month_usd, daily_budget_usd, monthly_budget_usd, name')
    .eq('id', agentId)
    .single();

  if (!agent) {
    return { allowed: false, reason: 'Agent not found' };
  }

  // Check agent daily budget
  if (agent.daily_budget_usd && (agent.spent_today_usd ?? 0) + estimatedCost > agent.daily_budget_usd) {
    return {
      allowed: false,
      reason: `Agent "${agent.name}" would exceed daily budget ($${agent.spent_today_usd?.toFixed(2)} + $${estimatedCost.toFixed(2)} > $${agent.daily_budget_usd.toFixed(2)})`,
    };
  }

  // Check agent monthly budget
  if (agent.monthly_budget_usd && (agent.spent_this_month_usd ?? 0) + estimatedCost > agent.monthly_budget_usd) {
    return {
      allowed: false,
      reason: `Agent "${agent.name}" would exceed monthly budget ($${agent.spent_this_month_usd?.toFixed(2)} + $${estimatedCost.toFixed(2)} > $${agent.monthly_budget_usd.toFixed(2)})`,
    };
  }

  // Fetch global budget from safety_config
  const { data: config } = await supabase
    .from('safety_config')
    .select('global_daily_budget_usd, global_monthly_budget_usd')
    .eq('business_id', businessId)
    .single();

  if (config) {
    // Get total global spend for today
    const { data: allAgents } = await supabase
      .from('agents')
      .select('spent_today_usd, spent_this_month_usd')
      .eq('business_id', businessId);

    const globalToday = (allAgents ?? []).reduce((sum, a) => sum + (a.spent_today_usd ?? 0), 0);
    const globalMonth = (allAgents ?? []).reduce((sum, a) => sum + (a.spent_this_month_usd ?? 0), 0);

    if (config.global_daily_budget_usd && globalToday + estimatedCost > config.global_daily_budget_usd) {
      return {
        allowed: false,
        reason: `Global daily budget would be exceeded ($${globalToday.toFixed(2)} + $${estimatedCost.toFixed(2)} > $${config.global_daily_budget_usd.toFixed(2)})`,
      };
    }

    if (config.global_monthly_budget_usd && globalMonth + estimatedCost > config.global_monthly_budget_usd) {
      return {
        allowed: false,
        reason: `Global monthly budget would be exceeded ($${globalMonth.toFixed(2)} + $${estimatedCost.toFixed(2)} > $${config.global_monthly_budget_usd.toFixed(2)})`,
      };
    }
  }

  return { allowed: true };
}

export async function recordCost(
  agentId: string,
  businessId: string,
  cost: number,
  model: string,
  tokens: number,
  supabase: SupabaseClient
): Promise<void> {
  // Update agent spend fields
  const { data: agent } = await supabase
    .from('agents')
    .select('spent_today_usd, spent_this_month_usd, cost_total_usd')
    .eq('id', agentId)
    .single();

  if (agent) {
    await supabase
      .from('agents')
      .update({
        spent_today_usd: (agent.spent_today_usd ?? 0) + cost,
        spent_this_month_usd: (agent.spent_this_month_usd ?? 0) + cost,
        cost_total_usd: (agent.cost_total_usd ?? 0) + cost,
      })
      .eq('id', agentId);
  }

  // Insert cost snapshot
  await supabase.from('cost_snapshots').insert({
    business_id: businessId,
    agent_id: agentId,
    cost_usd: cost,
    model,
    tokens_used: tokens,
    recorded_at: new Date().toISOString(),
  });
}

export async function getBudgetStatus(
  businessId: string,
  supabase: SupabaseClient
): Promise<BudgetStatus> {
  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, spent_today_usd, spent_this_month_usd, daily_budget_usd, monthly_budget_usd')
    .eq('business_id', businessId);

  const { data: config } = await supabase
    .from('safety_config')
    .select('global_daily_budget_usd, global_monthly_budget_usd')
    .eq('business_id', businessId)
    .single();

  const agentList = (agents ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    spentToday: a.spent_today_usd ?? 0,
    spentThisMonth: a.spent_this_month_usd ?? 0,
    dailyBudget: a.daily_budget_usd ?? 0,
    monthlyBudget: a.monthly_budget_usd ?? 0,
  }));

  return {
    agents: agentList,
    global: {
      spentToday: agentList.reduce((sum, a) => sum + a.spentToday, 0),
      spentThisMonth: agentList.reduce((sum, a) => sum + a.spentThisMonth, 0),
      dailyBudget: config?.global_daily_budget_usd ?? 0,
      monthlyBudget: config?.global_monthly_budget_usd ?? 0,
    },
  };
}
