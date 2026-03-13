/**
 * Model Router — intelligent model selection with failover and cooldowns.
 *
 * Maintains a ranked list of model profiles, automatically cools down failing
 * providers, and routes requests based on task complexity and cost strategy.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModelProvider =
  | "anthropic" | "openai" | "google" | "mistral" | "xai" | "deepseek"
  | "cohere" | "groq" | "perplexity" | "fireworks" | "together"
  | "replicate" | "minimax" | "moonshot" | "zhipu" | "dashscope"
  | "yi" | "baichuan" | "ollama" | "openrouter"
  | "1pos"; // 1P OS smart router — one key, all models

export interface ModelProfile {
  id: string;
  provider: ModelProvider;
  model: string;
  apiKey?: string; // encrypted reference — not the raw key
  priority: number; // lower = preferred
  status: "active" | "cooldown" | "disabled";
  cooldownUntil?: string;
  failureCount: number;
  lastUsedAt?: string;
  avgLatencyMs?: number;
  costPer1kTokens: { input: number; output: number };
}

export type InfraMode = "cloud" | "byok";

export interface ModelRouterConfig {
  infraMode: InfraMode;
  strategy: "quality" | "balanced" | "savings";
  profiles: ModelProfile[];
  maxRetries: number;
}

export interface ModelSelection {
  profile: ModelProfile;
  reason: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const COOLDOWN_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const FAILURE_THRESHOLD = 3;

/** Cloud mode: single 1P OS router profile handles everything */
function cloudProfiles(): ModelProfile[] {
  return [
    {
      id: "1pos-router",
      provider: "1pos",
      model: "auto", // server picks the best model per task
      priority: 1,
      status: "active",
      failureCount: 0,
      costPer1kTokens: { input: 1.5, output: 7.5 }, // blended avg
    },
  ];
}

/** BYOK mode: user provides their own keys */
function defaultProfiles(): ModelProfile[] {
  return [
    {
      id: "claude-sonnet",
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      priority: 1,
      status: "active",
      failureCount: 0,
      costPer1kTokens: { input: 3, output: 15 },
    },
    {
      id: "claude-haiku",
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
      priority: 2,
      status: "active",
      failureCount: 0,
      costPer1kTokens: { input: 0.25, output: 1.25 },
    },
    {
      id: "ollama-llama",
      provider: "ollama",
      model: "llama3.1:70b",
      priority: 3,
      status: "active",
      failureCount: 0,
      costPer1kTokens: { input: 0, output: 0 },
    },
  ];
}

// ---------------------------------------------------------------------------
// ModelRouter
// ---------------------------------------------------------------------------

export class ModelRouter {
  private config: ModelRouterConfig;

  constructor(config?: Partial<ModelRouterConfig>) {
    const infraMode = config?.infraMode ?? "cloud";
    this.config = {
      infraMode,
      strategy: config?.strategy ?? "balanced",
      profiles:
        config?.profiles ??
        (infraMode === "cloud" ? cloudProfiles() : defaultProfiles()),
      maxRetries: config?.maxRetries ?? 3,
    };
  }

  /** Switch between cloud (1P OS router) and BYOK mode */
  setInfraMode(mode: InfraMode, profiles?: ModelProfile[]): void {
    this.config.infraMode = mode;
    if (mode === "cloud") {
      this.config.profiles = cloudProfiles();
    } else if (profiles) {
      this.config.profiles = profiles;
    } else {
      this.config.profiles = defaultProfiles();
    }
  }

  getInfraMode(): InfraMode {
    return this.config.infraMode;
  }

  // ── Selection ────────────────────────────────────────────────────────────

  /**
   * Select the best model for a task.
   *
   * @param complexity   "routine" | "moderate" | "complex"
   * @param strategy     Override the default strategy for this call
   */
  selectModel(
    complexity: "routine" | "moderate" | "complex" = "moderate",
    strategy?: ModelRouterConfig["strategy"],
  ): ModelSelection {
    const effectiveStrategy = strategy ?? this.config.strategy;
    const available = this.getAvailable();

    if (available.length === 0) {
      // Last resort — reset cooldowns and try again
      this.resetCooldowns();
      const retryAvailable = this.getAvailable();
      if (retryAvailable.length === 0) {
        throw new Error(
          "No model profiles available — all disabled or in cooldown",
        );
      }
      return {
        profile: retryAvailable[0],
        reason: "all profiles were in cooldown; cooldowns reset",
      };
    }

    // Sort candidates based on strategy
    const sorted = [...available].sort((a, b) => {
      switch (effectiveStrategy) {
        case "quality":
          // Prefer lowest priority number (highest quality)
          return a.priority - b.priority;

        case "savings": {
          // Prefer cheapest
          const costA = a.costPer1kTokens.input + a.costPer1kTokens.output;
          const costB = b.costPer1kTokens.input + b.costPer1kTokens.output;
          return costA - costB;
        }

        case "balanced":
        default: {
          // Weight priority and cost together, influenced by complexity
          const complexityWeight =
            complexity === "complex"
              ? 0.8
              : complexity === "moderate"
                ? 0.5
                : 0.2;

          const qualityA = (1 - a.priority / 10) * complexityWeight;
          const qualityB = (1 - b.priority / 10) * complexityWeight;

          const costA =
            (a.costPer1kTokens.input + a.costPer1kTokens.output) *
            (1 - complexityWeight);
          const costB =
            (b.costPer1kTokens.input + b.costPer1kTokens.output) *
            (1 - complexityWeight);

          const scoreA = qualityA - costA;
          const scoreB = qualityB - costB;
          return scoreB - scoreA;
        }
      }
    });

    const selected = sorted[0];
    return {
      profile: selected,
      reason: `${effectiveStrategy} strategy, ${complexity} complexity → ${selected.model}`,
    };
  }

  // ── Tracking ─────────────────────────────────────────────────────────────

  recordSuccess(profileId: string, latencyMs: number, tokens: number): void {
    const profile = this.config.profiles.find((p) => p.id === profileId);
    if (!profile) return;

    profile.failureCount = 0;
    profile.lastUsedAt = new Date().toISOString();

    // Running average latency
    if (profile.avgLatencyMs === undefined) {
      profile.avgLatencyMs = latencyMs;
    } else {
      profile.avgLatencyMs = profile.avgLatencyMs * 0.7 + latencyMs * 0.3;
    }

    // If the profile was in cooldown, restore it
    if (profile.status === "cooldown") {
      profile.status = "active";
      profile.cooldownUntil = undefined;
    }

    void tokens; // tracked externally; here just for the interface
  }

  recordFailure(profileId: string, error: string): void {
    const profile = this.config.profiles.find((p) => p.id === profileId);
    if (!profile) return;

    profile.failureCount += 1;

    if (profile.failureCount >= FAILURE_THRESHOLD) {
      profile.status = "cooldown";
      profile.cooldownUntil = new Date(
        Date.now() + COOLDOWN_DURATION_MS,
      ).toISOString();
      console.warn(
        `[model-router] Profile "${profileId}" entering cooldown after ${profile.failureCount} failures. Last error: ${error}`,
      );
    }
  }

  // ── Queries ──────────────────────────────────────────────────────────────

  getAvailable(): ModelProfile[] {
    const now = Date.now();

    return this.config.profiles.filter((p) => {
      if (p.status === "disabled") return false;

      if (p.status === "cooldown") {
        // Check if cooldown has expired
        if (p.cooldownUntil && new Date(p.cooldownUntil).getTime() <= now) {
          p.status = "active";
          p.cooldownUntil = undefined;
          p.failureCount = 0;
          return true;
        }
        return false;
      }

      return true;
    });
  }

  listAll(): ModelProfile[] {
    return [...this.config.profiles];
  }

  getProfile(id: string): ModelProfile | undefined {
    return this.config.profiles.find((p) => p.id === id);
  }

  resetCooldowns(): void {
    for (const profile of this.config.profiles) {
      if (profile.status === "cooldown") {
        profile.status = "active";
        profile.cooldownUntil = undefined;
        profile.failureCount = 0;
      }
    }
  }

  setStrategy(strategy: ModelRouterConfig["strategy"]): void {
    this.config.strategy = strategy;
  }

  getStrategy(): ModelRouterConfig["strategy"] {
    return this.config.strategy;
  }

  getMaxRetries(): number {
    return this.config.maxRetries;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const modelRouter = new ModelRouter();
