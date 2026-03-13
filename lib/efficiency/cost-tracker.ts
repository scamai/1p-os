import type { SupabaseClient } from '@supabase/supabase-js';

export interface CostSnapshot {
  period: 'today' | 'week' | 'month';
  totalCost: number;
  tokenCount: number;
  requestCount: number;
  breakdown: Array<{
    model: string;
    cost: number;
    tokens: number;
    count: number;
  }>;
}

export interface AgentCostBreakdown {
  agentId: string;
  agentName: string;
  role: string;
  spentToday: number;
  spentThisMonth: number;
  totalSpent: number;
  dailyBudget: number;
  monthlyBudget: number;
}

export async function getCostSnapshot(
  businessId: string,
  period: 'today' | 'week' | 'month',
  supabase: SupabaseClient
): Promise<CostSnapshot> {
  const now = new Date();
  let startDate: string;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      break;
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString();
      break;
    }
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      break;
  }

  const { data: snapshots } = await supabase
    .from('cost_snapshots')
    .select('cost_usd, tokens_used, model')
    .eq('business_id', businessId)
    .gte('recorded_at', startDate);

  const records = snapshots ?? [];

  // Build breakdown by model
  const modelMap = new Map<string, { cost: number; tokens: number; count: number }>();
  for (const record of records) {
    const existing = modelMap.get(record.model) ?? { cost: 0, tokens: 0, count: 0 };
    existing.cost += record.cost_usd ?? 0;
    existing.tokens += record.tokens_used ?? 0;
    existing.count += 1;
    modelMap.set(record.model, existing);
  }

  return {
    period,
    totalCost: records.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0),
    tokenCount: records.reduce((sum, r) => sum + (r.tokens_used ?? 0), 0),
    requestCount: records.length,
    breakdown: Array.from(modelMap.entries()).map(([model, data]) => ({
      model,
      ...data,
    })),
  };
}

export async function getAgentCosts(
  businessId: string,
  supabase: SupabaseClient
): Promise<AgentCostBreakdown[]> {
  const { data: agents } = await supabase
    .from('agents')
    .select(
      'id, name, role, spent_today_usd, spent_this_month_usd, cost_total_usd, daily_budget_usd, monthly_budget_usd'
    )
    .eq('business_id', businessId);

  return (agents ?? []).map((a) => ({
    agentId: a.id,
    agentName: a.name,
    role: a.role,
    spentToday: a.spent_today_usd ?? 0,
    spentThisMonth: a.spent_this_month_usd ?? 0,
    totalSpent: a.cost_total_usd ?? 0,
    dailyBudget: a.daily_budget_usd ?? 0,
    monthlyBudget: a.monthly_budget_usd ?? 0,
  }));
}

export async function getProjectedMonthlyCost(
  businessId: string,
  supabase: SupabaseClient
): Promise<number> {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const { data: agents } = await supabase
    .from('agents')
    .select('spent_this_month_usd')
    .eq('business_id', businessId);

  const totalSpent = (agents ?? []).reduce(
    (sum, a) => sum + (a.spent_this_month_usd ?? 0),
    0
  );

  // Extrapolate: (spend so far / days elapsed) * days in month
  if (dayOfMonth === 0) return 0;
  return (totalSpent / dayOfMonth) * daysInMonth;
}
