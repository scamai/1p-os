/**
 * LLMRouter Integration
 * =====================
 * Intelligent model routing powered by LLMRouter (https://github.com/ulab-uiuc/LLMRouter).
 *
 * Two modes:
 *   1. **Sidecar mode** — Calls a running LLMRouter Python server (`llmrouter serve`)
 *      for ML-based routing decisions (KNN, MLP, threshold, etc.).
 *   2. **Embedded mode** — TypeScript difficulty estimator inspired by LLMRouter's
 *      ThresholdRouter. Uses heuristic signals (query length, keyword complexity,
 *      token estimates) to score difficulty and pick the cheapest model that can
 *      handle it. No Python dependency required.
 *
 * The sidecar is preferred when available; embedded mode is the automatic fallback.
 */

import { type ModelConfig, MODELS, getModelsByTier } from '@/lib/efficiency/model-registry';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const LLM_ROUTER_URL = process.env.LLM_ROUTER_URL ?? 'http://localhost:8000';
const LLM_ROUTER_ENABLED = process.env.LLM_ROUTER_ENABLED === 'true';
const LLM_ROUTER_TIMEOUT_MS = parseInt(process.env.LLM_ROUTER_TIMEOUT_MS ?? '3000', 10);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoutingDecision {
  modelId: string;
  modelConfig: ModelConfig;
  method: 'llmrouter-sidecar' | 'llmrouter-embedded' | 'fallback';
  difficultyScore: number;       // 0.0 (trivial) → 1.0 (very hard)
  confidence: number;            // 0.0 → 1.0
  latencyMs: number;             // time spent routing
  reason: string;
}

export interface RoutingContext {
  query: string;                 // The task description / prompt content
  taskType?: string;             // e.g. "classify_email", "legal_review"
  agentRole?: string;            // e.g. "ops", "finance", "sales"
  strategy?: 'cost-optimized' | 'balanced' | 'quality-first';
  maxBudgetPerCall?: number;     // USD budget ceiling for this call
}

interface SidecarRouteResponse {
  model: string;
  choices?: Array<{
    message?: { content?: string };
  }>;
}

interface SidecarHealthResponse {
  status: string;
  router: string;
  llms: string[];
}

// ---------------------------------------------------------------------------
// Performance history — track which models succeed for which difficulty levels
// ---------------------------------------------------------------------------

interface RoutingRecord {
  difficultyScore: number;
  modelId: string;
  success: boolean;
  timestamp: number;
}

const ROUTING_HISTORY: RoutingRecord[] = [];
const MAX_HISTORY = 500;

export function recordRoutingOutcome(
  difficultyScore: number,
  modelId: string,
  success: boolean
): void {
  ROUTING_HISTORY.push({ difficultyScore, modelId, success, timestamp: Date.now() });
  if (ROUTING_HISTORY.length > MAX_HISTORY) {
    ROUTING_HISTORY.splice(0, ROUTING_HISTORY.length - MAX_HISTORY);
  }
}

// ---------------------------------------------------------------------------
// Sidecar client — calls the LLMRouter Python server
// ---------------------------------------------------------------------------

let sidecarAvailable: boolean | null = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL_MS = 60_000; // re-check every 60s

async function checkSidecarHealth(): Promise<boolean> {
  const now = Date.now();
  if (sidecarAvailable !== null && now - lastHealthCheck < HEALTH_CHECK_INTERVAL_MS) {
    return sidecarAvailable;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LLM_ROUTER_TIMEOUT_MS);

    const res = await fetch(`${LLM_ROUTER_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as SidecarHealthResponse;
      sidecarAvailable = data.status === 'ok';
    } else {
      sidecarAvailable = false;
    }
  } catch {
    sidecarAvailable = false;
  }

  lastHealthCheck = now;
  return sidecarAvailable;
}

/**
 * Ask the LLMRouter sidecar to pick a model. We call the route-only endpoint
 * (model: "auto") and read back which model it selected without actually
 * generating a response.
 */
async function routeViaSidecar(ctx: RoutingContext): Promise<RoutingDecision | null> {
  if (!LLM_ROUTER_ENABLED) return null;
  if (!(await checkSidecarHealth())) return null;

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LLM_ROUTER_TIMEOUT_MS);

    const res = await fetch(`${LLM_ROUTER_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'auto',
        messages: [{ role: 'user', content: ctx.query.slice(0, 500) }],
        max_tokens: 1, // We only care about which model is selected
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = (await res.json()) as SidecarRouteResponse;
    const selectedModel = data.model;
    const latencyMs = Date.now() - start;

    // Map sidecar model name back to our ModelConfig
    const modelConfig = resolveModelConfig(selectedModel);
    if (!modelConfig) return null;

    return {
      modelId: modelConfig.id,
      modelConfig,
      method: 'llmrouter-sidecar',
      difficultyScore: -1, // sidecar doesn't expose this
      confidence: 0.85,
      latencyMs,
      reason: `LLMRouter sidecar selected ${modelConfig.displayName}`,
    };
  } catch {
    // Sidecar failed — mark unavailable so we don't hammer it
    sidecarAvailable = false;
    lastHealthCheck = Date.now();
    return null;
  }
}

// ---------------------------------------------------------------------------
// Embedded difficulty estimator (TypeScript, no Python needed)
// ---------------------------------------------------------------------------

// Complexity signals and their weights
const COMPLEX_PATTERNS = [
  { pattern: /\b(analyze|analysis|evaluate|assess|investigate|diagnose)\b/i, weight: 0.15 },
  { pattern: /\b(strategy|strategic|plan|roadmap|architecture)\b/i, weight: 0.18 },
  { pattern: /\b(negotiate|contract|legal|compliance|regulatory|tax)\b/i, weight: 0.20 },
  { pattern: /\b(code|implement|debug|refactor|algorithm|optimize)\b/i, weight: 0.16 },
  { pattern: /\b(financial|forecast|budget|projection|valuation)\b/i, weight: 0.15 },
  { pattern: /\b(creative|design|brand|campaign|marketing)\b/i, weight: 0.12 },
  { pattern: /\b(research|compare|benchmark|review|audit)\b/i, weight: 0.12 },
  { pattern: /\b(multi[- ]?step|chain|workflow|pipeline|orchestrat)\b/i, weight: 0.14 },
];

const SIMPLE_PATTERNS = [
  { pattern: /\b(send|notify|ping|remind|alert|log)\b/i, weight: -0.15 },
  { pattern: /\b(list|fetch|get|lookup|check|status)\b/i, weight: -0.12 },
  { pattern: /\b(update|set|toggle|mark|tag)\b/i, weight: -0.10 },
  { pattern: /\b(format|convert|parse|extract)\b/i, weight: -0.08 },
  { pattern: /\b(schedule|reschedule|cancel)\b/i, weight: -0.08 },
];

function estimateDifficulty(ctx: RoutingContext): number {
  let score = 0.5; // base difficulty

  const text = `${ctx.query} ${ctx.taskType ?? ''}`;

  // Pattern matching
  for (const { pattern, weight } of [...COMPLEX_PATTERNS, ...SIMPLE_PATTERNS]) {
    if (pattern.test(text)) {
      score += weight;
    }
  }

  // Query length signal: longer queries tend to be more complex
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 200) score += 0.10;
  else if (wordCount > 100) score += 0.05;
  else if (wordCount < 20) score -= 0.08;

  // Token estimate signal: high token tasks need better models
  const estimatedTokens = Math.ceil(text.length / 4);
  if (estimatedTokens > 2000) score += 0.08;

  // Agent role signal
  if (ctx.agentRole) {
    const highRoles = ['legal', 'finance', 'strategy', 'engineering'];
    const lowRoles = ['notifications', 'scheduling', 'data-entry'];
    if (highRoles.some((r) => ctx.agentRole!.toLowerCase().includes(r))) score += 0.10;
    if (lowRoles.some((r) => ctx.agentRole!.toLowerCase().includes(r))) score -= 0.10;
  }

  // Learning signal: if we have history showing a model failing at this difficulty,
  // bump the score up so we pick a stronger model
  if (ROUTING_HISTORY.length > 20) {
    const bracket = Math.round(score * 10) / 10;
    const relevant = ROUTING_HISTORY.filter(
      (r) => Math.abs(r.difficultyScore - bracket) < 0.15
    );
    if (relevant.length > 5) {
      const failRate = relevant.filter((r) => !r.success).length / relevant.length;
      if (failRate > 0.3) score += 0.10; // bump up if models are failing
    }
  }

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, score));
}

/**
 * Map difficulty score to model selection, respecting the routing strategy.
 *
 * Thresholds (inspired by LLMRouter's ThresholdRouter):
 *   - cost-optimized:  high model only when difficulty > 0.8
 *   - balanced:        high model when difficulty > 0.6
 *   - quality-first:   high model when difficulty > 0.35
 */
function selectModelByDifficulty(
  difficulty: number,
  strategy: RoutingContext['strategy'] = 'balanced',
  maxBudget?: number
): ModelConfig {
  const thresholds: Record<string, { high: number; medium: number }> = {
    'cost-optimized': { high: 0.80, medium: 0.45 },
    balanced:         { high: 0.60, medium: 0.30 },
    'quality-first':  { high: 0.35, medium: 0.15 },
  };

  const t = thresholds[strategy ?? 'balanced'];
  let targetTier: ModelConfig['qualityTier'];

  if (difficulty >= t.high) {
    targetTier = 'high';
  } else if (difficulty >= t.medium) {
    targetTier = 'medium';
  } else {
    targetTier = 'low';
  }

  let candidates = getModelsByTier(targetTier);

  // Fallback to medium if no models in target tier
  if (candidates.length === 0) candidates = getModelsByTier('medium');
  if (candidates.length === 0) candidates = Object.values(MODELS);

  // Respect budget ceiling
  if (maxBudget !== undefined) {
    const affordable = candidates.filter((m) => {
      // Rough cost estimate: 500 input + 200 output tokens
      const est = m.costPerInputToken * 500 + m.costPerOutputToken * 200;
      return est <= maxBudget;
    });
    if (affordable.length > 0) candidates = affordable;
  }

  // Pick cheapest within tier (best value)
  candidates.sort(
    (a, b) =>
      a.costPerInputToken + a.costPerOutputToken -
      (b.costPerInputToken + b.costPerOutputToken)
  );

  return candidates[0]!;
}

function routeEmbedded(ctx: RoutingContext): RoutingDecision {
  const start = Date.now();
  const difficulty = estimateDifficulty(ctx);
  const modelConfig = selectModelByDifficulty(difficulty, ctx.strategy, ctx.maxBudgetPerCall);

  return {
    modelId: modelConfig.id,
    modelConfig,
    method: 'llmrouter-embedded',
    difficultyScore: difficulty,
    confidence: 0.70, // heuristic = lower confidence than ML
    latencyMs: Date.now() - start,
    reason: `Difficulty ${difficulty.toFixed(2)} → ${modelConfig.displayName} (${ctx.strategy ?? 'balanced'})`,
  };
}

// ---------------------------------------------------------------------------
// Model name resolution — map LLMRouter sidecar names to our ModelConfig
// ---------------------------------------------------------------------------

function resolveModelConfig(name: string): ModelConfig | null {
  // Direct ID match
  const direct = MODELS[name];
  if (direct) return direct;

  // Fuzzy match by id or displayName
  const lower = name.toLowerCase();
  for (const model of Object.values(MODELS)) {
    if (
      model.id.toLowerCase().includes(lower) ||
      lower.includes(model.id.toLowerCase()) ||
      model.displayName.toLowerCase().includes(lower) ||
      lower.includes(model.displayName.toLowerCase())
    ) {
      return model;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Route a query to the optimal model using LLMRouter.
 *
 * Tries the sidecar first (ML-based, higher accuracy), falls back to
 * the embedded TypeScript difficulty estimator.
 */
export async function routeWithLLMRouter(ctx: RoutingContext): Promise<RoutingDecision> {
  // Try sidecar first
  if (LLM_ROUTER_ENABLED) {
    const sidecarResult = await routeViaSidecar(ctx);
    if (sidecarResult) return sidecarResult;
  }

  // Fallback to embedded estimator
  return routeEmbedded(ctx);
}

/**
 * Synchronous version for hot paths where we can't afford async.
 * Always uses the embedded estimator.
 */
export function routeWithLLMRouterSync(ctx: RoutingContext): RoutingDecision {
  return routeEmbedded(ctx);
}

/**
 * Get the current LLMRouter status (for health checks / UI).
 */
export async function getLLMRouterStatus(): Promise<{
  enabled: boolean;
  sidecarUrl: string;
  sidecarAvailable: boolean;
  embeddedAvailable: true;
  routingHistorySize: number;
}> {
  const available = LLM_ROUTER_ENABLED ? await checkSidecarHealth() : false;
  return {
    enabled: LLM_ROUTER_ENABLED,
    sidecarUrl: LLM_ROUTER_URL,
    sidecarAvailable: available,
    embeddedAvailable: true,
    routingHistorySize: ROUTING_HISTORY.length,
  };
}

/**
 * Export model registry in LLMRouter-compatible JSON format.
 * Useful for configuring the sidecar's `default_llm.json`.
 */
export function getModelsAsLLMRouterCandidates(): Record<string, {
  model: string;
  service: string;
  input_price: number;
  output_price: number;
  feature: string;
}> {
  const result: Record<string, {
    model: string;
    service: string;
    input_price: number;
    output_price: number;
    feature: string;
  }> = {};

  for (const [key, m] of Object.entries(MODELS)) {
    result[key] = {
      model: m.id,
      service: m.provider,
      input_price: m.costPerInputToken * 1000, // per 1k tokens
      output_price: m.costPerOutputToken * 1000,
      feature: `${m.displayName} — ${m.qualityTier} quality, ~${m.latencyMs}ms`,
    };
  }

  return result;
}
