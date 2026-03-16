export interface ModelConfig {
  id: string;
  provider: 'anthropic' | 'meta' | 'mistral' | 'minimax' | 'self-hosted';
  costPerInputToken: number;
  costPerOutputToken: number;
  maxContextWindow: number;
  qualityTier: 'high' | 'medium' | 'low';
  latencyMs: number; // average response latency
  displayName: string;
}

export const MODELS: Record<string, ModelConfig> = {
  'claude-sonnet-4-20250514': {
    id: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    costPerInputToken: 0.000003,
    costPerOutputToken: 0.000015,
    maxContextWindow: 200_000,
    qualityTier: 'high',
    latencyMs: 3000,
    displayName: 'Claude Sonnet 4',
  },
  'claude-haiku-3-5': {
    id: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
    costPerInputToken: 0.0000008,
    costPerOutputToken: 0.000004,
    maxContextWindow: 200_000,
    qualityTier: 'medium',
    latencyMs: 1000,
    displayName: 'Claude 3.5 Haiku',
  },
  'llama-3.1-70b': {
    id: 'llama-3.1-70b',
    provider: 'meta',
    costPerInputToken: 0.00000059,
    costPerOutputToken: 0.00000079,
    maxContextWindow: 128_000,
    qualityTier: 'medium',
    latencyMs: 2000,
    displayName: 'Llama 3.1 70B',
  },
  'mistral-large': {
    id: 'mistral-large-latest',
    provider: 'mistral',
    costPerInputToken: 0.000002,
    costPerOutputToken: 0.000006,
    maxContextWindow: 128_000,
    qualityTier: 'medium',
    latencyMs: 2500,
    displayName: 'Mistral Large',
  },
};

// Load MiniMax model if API key is available
if (process.env.MINIMAX_API_KEY) {
  MODELS['minimax-01'] = {
    id: 'MiniMax-Text-01',
    provider: 'minimax',
    costPerInputToken: 0.0000004,
    costPerOutputToken: 0.0000016,
    maxContextWindow: 1_000_000,
    qualityTier: 'medium',
    latencyMs: 2000,
    displayName: 'MiniMax-Text-01',
  };
}

// Load self-hosted model from env if available
if (process.env.DEPLOYMENT_MODE === 'self-hosted' && process.env.SELF_HOSTED_MODEL_ID) {
  MODELS['self-hosted'] = {
    id: process.env.SELF_HOSTED_MODEL_ID,
    provider: 'self-hosted',
    costPerInputToken: parseFloat(process.env.SELF_HOSTED_COST_PER_INPUT_TOKEN ?? '0'),
    costPerOutputToken: parseFloat(process.env.SELF_HOSTED_COST_PER_OUTPUT_TOKEN ?? '0'),
    maxContextWindow: parseInt(process.env.SELF_HOSTED_MAX_CONTEXT ?? '32000', 10),
    qualityTier: (process.env.SELF_HOSTED_QUALITY_TIER as ModelConfig['qualityTier']) ?? 'medium',
    latencyMs: parseInt(process.env.SELF_HOSTED_LATENCY_MS ?? '2000', 10),
    displayName: process.env.SELF_HOSTED_MODEL_NAME ?? 'Self-Hosted Model',
  };
}

export function getModel(id: string): ModelConfig | undefined {
  return MODELS[id] ?? Object.values(MODELS).find((m) => m.id === id);
}

export function getModelsByTier(tier: ModelConfig['qualityTier']): ModelConfig[] {
  return Object.values(MODELS).filter((m) => m.qualityTier === tier);
}
