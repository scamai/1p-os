import { MODELS, type ModelConfig } from '@/lib/efficiency/model-registry';
import type { RoutingStrategy } from '@/lib/efficiency/task-router';

// Average tokens per task type (input + output estimates)
const AVG_TOKENS_PER_TASK: Record<string, { input: number; output: number }> = {
  classify_email: { input: 500, output: 50 },
  summarize: { input: 2000, output: 300 },
  extract_data: { input: 1000, output: 200 },
  draft_email: { input: 800, output: 400 },
  generate_report: { input: 3000, output: 1500 },
  analyze_financials: { input: 4000, output: 1000 },
  create_contract: { input: 2000, output: 3000 },
  strategic_planning: { input: 5000, output: 2000 },
  send_notification: { input: 200, output: 100 },
  update_crm: { input: 500, output: 100 },
  chat_response: { input: 1500, output: 500 },
  default: { input: 1000, output: 500 },
};

// Estimated daily tasks per agent role
const DAILY_TASKS_PER_ROLE: Record<string, number> = {
  operations: 15,
  finance: 8,
  sales: 12,
  marketing: 10,
  legal: 5,
  product: 8,
  'customer-success': 10,
  default: 10,
};

function getDefaultModel(strategy: RoutingStrategy): ModelConfig {
  switch (strategy) {
    case 'cost-optimized':
      return MODELS['claude-haiku-3-5'] ?? Object.values(MODELS)[0]!;
    case 'quality-first':
      return MODELS['claude-sonnet-4-20250514'] ?? Object.values(MODELS)[0]!;
    case 'balanced':
    default:
      return MODELS['claude-haiku-3-5'] ?? Object.values(MODELS)[0]!;
  }
}

export function estimateTaskCost(
  taskType: string,
  model?: string | ModelConfig
): number {
  const tokens = AVG_TOKENS_PER_TASK[taskType] ?? AVG_TOKENS_PER_TASK['default']!;
  const modelConfig =
    typeof model === 'string'
      ? MODELS[model] ?? Object.values(MODELS)[0]!
      : model ?? Object.values(MODELS)[0]!;

  return (
    tokens.input * modelConfig.costPerInputToken +
    tokens.output * modelConfig.costPerOutputToken
  );
}

export function estimateAgentDailyCost(
  role: string,
  routingStrategy: RoutingStrategy = 'balanced'
): number {
  const dailyTasks = DAILY_TASKS_PER_ROLE[role] ?? DAILY_TASKS_PER_ROLE['default']!;
  const model = getDefaultModel(routingStrategy);

  // Assume a mix of task types — use 'default' average
  const costPerTask = estimateTaskCost('default', model);
  return dailyTasks * costPerTask;
}

export function estimateMonthlyTotal(
  agentCount: number,
  routingStrategy: RoutingStrategy = 'balanced'
): number {
  const model = getDefaultModel(routingStrategy);
  const costPerTask = estimateTaskCost('default', model);
  const avgDailyTasks = DAILY_TASKS_PER_ROLE['default']!;

  return agentCount * avgDailyTasks * costPerTask * 30;
}
