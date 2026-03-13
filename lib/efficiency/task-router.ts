import type { SupabaseClient } from '@supabase/supabase-js';
import { MODELS, getModelsByTier, type ModelConfig } from '@/lib/efficiency/model-registry';
import {
  routeWithLLMRouter,
  recordRoutingOutcome,
  type RoutingContext,
  type RoutingDecision,
} from '@/lib/efficiency/llm-router';

export type TaskComplexity = 'routine' | 'moderate' | 'complex';
export type RoutingStrategy = 'cost-optimized' | 'balanced' | 'quality-first';

const TASK_COMPLEXITY_MAP: Record<string, TaskComplexity> = {
  classify_email: 'routine',
  summarize: 'routine',
  extract_data: 'routine',
  send_notification: 'routine',
  generate_report: 'moderate',
  draft_email: 'moderate',
  analyze_financials: 'moderate',
  update_crm: 'routine',
  create_contract: 'complex',
  strategic_planning: 'complex',
  legal_review: 'complex',
  negotiate: 'complex',
  creative_writing: 'moderate',
  code_generation: 'complex',
};

const COMPLEXITY_TO_TIER: Record<RoutingStrategy, Record<TaskComplexity, ModelConfig['qualityTier']>> = {
  'cost-optimized': {
    routine: 'low',
    moderate: 'medium',
    complex: 'medium',
  },
  balanced: {
    routine: 'medium',
    moderate: 'medium',
    complex: 'high',
  },
  'quality-first': {
    routine: 'medium',
    moderate: 'high',
    complex: 'high',
  },
};

export function classifyTask(taskDescription: string): TaskComplexity {
  const lower = taskDescription.toLowerCase();

  // Check against known task types
  for (const [taskType, complexity] of Object.entries(TASK_COMPLEXITY_MAP)) {
    if (lower.includes(taskType.replace(/_/g, ' ')) || lower.includes(taskType)) {
      return complexity;
    }
  }

  // Heuristic classification based on description length and keywords
  const complexKeywords = ['analyze', 'strategy', 'negotiate', 'legal', 'contract', 'complex', 'review', 'plan'];
  const routineKeywords = ['send', 'notify', 'update', 'log', 'track', 'list', 'fetch'];

  if (complexKeywords.some((k) => lower.includes(k))) return 'complex';
  if (routineKeywords.some((k) => lower.includes(k))) return 'routine';

  return 'moderate';
}

/**
 * Route a task to the optimal model using LLMRouter.
 *
 * This is the main entry point. It first tries LLMRouter (sidecar → embedded
 * difficulty estimator) for intelligent, ML-aware routing. Falls back to the
 * original tier-based logic if LLMRouter returns no result.
 */
export async function routeTask(
  taskType: string,
  complexity: TaskComplexity,
  businessId: string,
  supabase: SupabaseClient,
  options?: {
    query?: string;
    agentRole?: string;
    maxBudgetPerCall?: number;
  }
): Promise<ModelConfig & { routingDecision?: RoutingDecision }> {
  // Fetch routing strategy from safety_config
  const { data: config } = await supabase
    .from('safety_config')
    .select('routing_strategy')
    .eq('business_id', businessId)
    .single();

  const strategy: RoutingStrategy = config?.routing_strategy ?? 'balanced';

  // ── LLMRouter: intelligent routing ──
  const routingCtx: RoutingContext = {
    query: options?.query ?? `${taskType} ${complexity}`,
    taskType,
    agentRole: options?.agentRole,
    strategy,
    maxBudgetPerCall: options?.maxBudgetPerCall,
  };

  try {
    const decision = await routeWithLLMRouter(routingCtx);
    if (decision.modelConfig) {
      return { ...decision.modelConfig, routingDecision: decision };
    }
  } catch (err) {
    console.warn('[task-router] LLMRouter failed, falling back to tier-based routing:', err);
  }

  // ── Fallback: original tier-based routing ──
  return routeTaskByTier(complexity, strategy);
}

/**
 * Original tier-based routing logic, kept as fallback.
 */
function routeTaskByTier(
  complexity: TaskComplexity,
  strategy: RoutingStrategy
): ModelConfig {
  const targetTier = COMPLEXITY_TO_TIER[strategy][complexity];

  let candidates = getModelsByTier(targetTier);

  if (candidates.length === 0) {
    candidates = getModelsByTier('medium');
  }
  if (candidates.length === 0) {
    candidates = Object.values(MODELS);
  }

  if (strategy === 'cost-optimized') {
    candidates.sort(
      (a, b) =>
        a.costPerInputToken + a.costPerOutputToken -
        (b.costPerInputToken + b.costPerOutputToken)
    );
  } else if (strategy === 'quality-first') {
    candidates.sort((a, b) => a.latencyMs - b.latencyMs);
  } else {
    candidates.sort((a, b) => {
      const costA = a.costPerInputToken + a.costPerOutputToken;
      const costB = b.costPerInputToken + b.costPerOutputToken;
      const scoreA = costA * 0.5 + a.latencyMs * 0.0001;
      const scoreB = costB * 0.5 + b.latencyMs * 0.0001;
      return scoreA - scoreB;
    });
  }

  return candidates[0]!;
}

/**
 * Record whether a routing decision led to a successful outcome.
 * This feeds the LLMRouter's learning loop so future routing improves.
 */
export function reportRoutingOutcome(
  decision: RoutingDecision | undefined,
  success: boolean
): void {
  if (!decision) return;
  recordRoutingOutcome(decision.difficultyScore, decision.modelId, success);
}
