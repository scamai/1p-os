import { SupabaseClient } from '@supabase/supabase-js';
import { checkCircuitBreaker, recordFailure } from '@/lib/safety/circuit-breaker';
import { checkBudget, recordCost } from '@/lib/safety/cost-budget';
import { checkLoopDetection } from '@/lib/safety/loop-detector';
import { ContextEngine } from '@/lib/context/engine';
import { routeTask, classifyTask } from '@/lib/efficiency/task-router';
import { getAgentSystemPrompt } from '@/lib/ai/prompts';
import { generateText } from '@/lib/ai/client';
import { validateAction } from '@/lib/safety/action-validator';
import { requiresHumanApproval, createDecisionCard } from '@/lib/safety/human-gate';
import { logAudit } from '@/lib/safety/audit-logger';
import { sendMessage } from '@/lib/agents/message-bus';

// Token Efficiency Engine modules — imported dynamically to handle
// the case where they might not be available yet during rollout.
let contextCache: {
  get(businessId: string, scope?: string): unknown | null;
  set(businessId: string, scope: string, data: unknown): void;
  invalidate(businessId: string): void;
} | null = null;

let promptOptimizer: {
  optimize(
    systemPrompt: string,
    userPrompt: string,
    context: unknown,
    agentLevel?: string
  ): { systemPrompt: string; userPrompt: string; estimatedTokensSaved: number };
} | null = null;

let batchScheduler: {
  enqueue(task: unknown): Promise<{ queued: true; taskId: string }>;
  flush(priority: string): Promise<void>;
} | null = null;

let deduplicator: {
  checkDuplicate(key: string): { isDuplicate: boolean; cachedResult?: unknown; runningTaskId?: string } | null;
  registerRunning(hash: string, id: string): void;
  registerComplete(hash: string, result: unknown): void;
  registerFailed(hash: string): void;
} | null = null;

// Attempt to load efficiency modules — gracefully degrade if not available
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cacheModule = require('@/lib/efficiency/context-cache');
  contextCache = cacheModule.contextCache ?? null;
} catch {
  // context-cache module not available yet
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const optimizerModule = require('@/lib/efficiency/prompt-optimizer');
  promptOptimizer = optimizerModule.promptOptimizer ?? null;
} catch {
  // prompt-optimizer module not available yet
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const schedulerModule = require('@/lib/efficiency/batch-scheduler');
  batchScheduler = schedulerModule.batchScheduler ?? null;
} catch {
  // batch-scheduler module not available yet
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dedupModule = require('@/lib/efficiency/deduplicator');
  deduplicator = dedupModule.deduplicator ?? null;
} catch {
  // deduplicator module not available yet
}

export interface AgentTrigger {
  type: string;
  source?: string;
  event_type?: string;
  data?: Record<string, unknown>;
  chain_id?: string;
  chain_depth?: number;
  priority?: 'immediate' | 'standard' | 'background';
}

interface ExecutionResult {
  success: boolean;
  summary?: string;
  action?: string;
  params?: Record<string, unknown>;
  output?: unknown;
  error?: string;
  awaiting_approval?: boolean;
  decision_card_id?: string;
  efficiency?: {
    tokensSavedByCache: number;
    tokensSavedByOptimizer: number;
    cacheHit: boolean;
    deduplicated: boolean;
    model: string;
    totalTokens: number;
    cost: number;
  };
}

/**
 * Build a deduplication key from agent ID, trigger type, and trigger data.
 */
function buildDedupKey(agentId: string, trigger: AgentTrigger): string {
  const dataHash = JSON.stringify(trigger.data ?? {});
  return `${agentId}:${trigger.type}:${dataHash}`;
}

export async function executeAgent(
  agentId: string,
  trigger: AgentTrigger,
  supabase: SupabaseClient
): Promise<ExecutionResult> {
  // Efficiency metrics tracked across the execution
  let tokensSavedByCache = 0;
  let tokensSavedByOptimizer = 0;
  let cacheHit = false;
  let deduplicated = false;

  try {
    // Load agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // ── Step 1: Check circuit breaker ──
    const circuitStatus = await checkCircuitBreaker(agentId, supabase);
    if (circuitStatus.isOpen) {
      return { success: false, error: 'Circuit breaker is open — agent temporarily disabled' };
    }

    // ── Step 2: Check cost budget (estimate ~$0.01 per call) ──
    const budgetResult = await checkBudget(agentId, agent.business_id, 0.01, supabase);
    if (!budgetResult.allowed) {
      return { success: false, error: budgetResult.reason ?? 'Cost budget exceeded' };
    }

    // ── Step 3: Check loop detection if part of a chain ──
    if (trigger.chain_id) {
      const loopResult = await checkLoopDetection(
        trigger.chain_id,
        trigger.chain_depth ?? 0,
        agent.business_id,
        supabase
      );
      if (!loopResult.safe) {
        return { success: false, error: loopResult.reason ?? 'Loop detected in agent chain' };
      }
    }

    // ── Step 4: Deduplication check ──
    const dedupKey = buildDedupKey(agentId, trigger);
    if (deduplicator) {
      const dedupResult = deduplicator.checkDuplicate(dedupKey);
      if (dedupResult?.isDuplicate && dedupResult.cachedResult) {
        deduplicated = true;
        const cached = dedupResult.cachedResult as ExecutionResult;
        return {
          ...cached,
          efficiency: {
            tokensSavedByCache: 0,
            tokensSavedByOptimizer: 0,
            cacheHit: false,
            deduplicated: true,
            model: 'none (deduplicated)',
            totalTokens: 0,
            cost: 0,
          },
        };
      }
      // If same task is currently running, wait for it by returning a pending state
      if (dedupResult?.runningTaskId) {
        return {
          success: false,
          error: `Duplicate task already running: ${dedupResult.runningTaskId}`,
          efficiency: {
            tokensSavedByCache: 0,
            tokensSavedByOptimizer: 0,
            cacheHit: false,
            deduplicated: true,
            model: 'none (waiting)',
            totalTokens: 0,
            cost: 0,
          },
        };
      }
      // Register this task as running
      deduplicator.registerRunning(dedupKey, agentId);
    }

    // ── Batch scheduling: non-immediate tasks get enqueued ──
    if (
      batchScheduler &&
      trigger.priority &&
      trigger.priority !== 'immediate'
    ) {
      try {
        const enqueueResult = await batchScheduler.enqueue({
          agentId,
          trigger,
          enqueuedAt: new Date().toISOString(),
          priority: trigger.priority,
        });
        return {
          success: true,
          summary: `Task enqueued for batch processing (${trigger.priority})`,
          output: enqueueResult,
        };
      } catch (err) {
        // If batch scheduling fails, fall through to synchronous execution
        console.warn('[agents/runtime] Batch scheduling failed, executing synchronously:', err);
      }
    }

    // ── Step 5: Load business context (from cache first, fallback to DB) ──
    const contextScope = agent.context_permissions ?? 'full';
    let context: unknown;

    if (contextCache) {
      const cached = contextCache.get(agent.business_id, contextScope);
      if (cached) {
        context = cached;
        cacheHit = true;
        // Estimate ~40% token savings from cache hit — a typical context payload
        // is ~2000 tokens, so saving a DB round-trip saves regeneration tokens.
        tokensSavedByCache = 800;
      }
    }

    if (!context) {
      const contextEngine = new ContextEngine(supabase, agent.business_id);
      context = await contextEngine.getContext(contextScope);

      // Store in cache for future calls
      if (contextCache) {
        contextCache.set(agent.business_id, contextScope, context);
      }
    }

    // ── Step 6: Classify task and route to optimal model ──
    const taskDescription = trigger.type + ' ' + JSON.stringify(trigger.data ?? {});
    const complexity = classifyTask(taskDescription);
    const modelConfig = await routeTask(trigger.type, complexity, agent.business_id, supabase);

    // ── Step 7: Build prompt with context ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let systemPrompt = getAgentSystemPrompt(agent.role, context as any);
    let userPrompt = `Trigger: ${trigger.type}\nData: ${JSON.stringify(trigger.data ?? {})}\n\nRespond with a JSON object containing: { "action": string, "params": object, "messages": [{ "to_agent_id": string, "type": string, "content": string }] (optional) }`;

    // ── Step 8: Optimize prompt (compress, scope, reduce few-shots) ──
    if (promptOptimizer) {
      const optimized = promptOptimizer.optimize(
        systemPrompt,
        userPrompt,
        context,
        agent.level
      );
      systemPrompt = optimized.systemPrompt;
      userPrompt = optimized.userPrompt;
      tokensSavedByOptimizer = optimized.estimatedTokensSaved;
    }

    // ── Step 9: Call AI model ──
    const aiResponse = await generateText(userPrompt, {
      model: modelConfig.id,
      maxTokens: 1024,
      systemPrompt,
    });

    // Parse AI response
    let parsedResponse: {
      action: string;
      params: Record<string, unknown>;
      messages?: Array<{ to_agent_id: string; type: string; content: string }>;
    };
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsedResponse = JSON.parse(jsonMatch?.[0] ?? aiResponse);
    } catch {
      console.error('[agents/runtime] Failed to parse AI response:', aiResponse);
      if (deduplicator) {
        deduplicator.registerFailed(dedupKey);
      }
      return { success: false, error: 'Failed to parse AI response' };
    }

    const { action, params, messages } = parsedResponse;

    // ── Step 10: Validate response against allowed_actions ──
    const validationResult = validateAction(
      { allowed_actions: agent.allowed_actions, status: agent.status, circuit_open: agent.circuit_open },
      action,
      params
    );
    if (!validationResult.valid) {
      await logAudit({
        businessId: agent.business_id,
        actor: `agent:${agentId}`,
        action: 'action_rejected',
        success: false,
        errorMessage: validationResult.reason,
      }, supabase);
      if (deduplicator) {
        deduplicator.registerFailed(dedupKey);
      }
      return { success: false, error: `Action not allowed: ${validationResult.reason}` };
    }

    // ── Step 11: Check human gate ──
    if (requiresHumanApproval(action, agent)) {
      const card = await createDecisionCard(
        agent.business_id,
        agentId,
        'approval',
        `${agent.name} wants to: ${action}`,
        JSON.stringify(params),
        [{ label: 'Approve', value: 'approve' }, { label: 'Reject', value: 'reject' }],
        supabase
      );
      if (deduplicator) {
        deduplicator.registerComplete(dedupKey, {
          success: true,
          action,
          params,
          awaiting_approval: true,
          decision_card_id: card.id as string,
        });
      }
      return {
        success: true,
        action,
        params,
        awaiting_approval: true,
        decision_card_id: card.id as string,
      };
    }

    // ── Step 12: Execute the action (if safe) ──
    const actionResult = await executeAction(agent, action, params, supabase);

    // ── Step 13: Record cost + tokens saved ──
    // Estimate tokens: ~500 input + ~200 output minus savings from optimization
    const estimatedInputTokens = Math.max(100, 500 - tokensSavedByCache - tokensSavedByOptimizer);
    const estimatedOutputTokens = 200;
    const totalTokens = estimatedInputTokens + estimatedOutputTokens;
    const estimatedCost = (
      modelConfig.costPerInputToken * estimatedInputTokens +
      modelConfig.costPerOutputToken * estimatedOutputTokens
    );
    await recordCost(agentId, agent.business_id, estimatedCost, modelConfig.id, totalTokens, supabase);

    // ── Step 14: Log to audit trail (include efficiency metrics) ──
    await logAudit({
      businessId: agent.business_id,
      actor: `agent:${agentId}`,
      action: 'action_executed',
      resourceType: action,
      modelUsed: modelConfig.id,
      costUsd: estimatedCost,
      tokensUsed: totalTokens,
      success: true,
      metadata: {
        tokensSavedByCache,
        tokensSavedByOptimizer,
        cacheHit,
        deduplicated,
        triggerPriority: trigger.priority ?? 'immediate',
      },
    }, supabase);

    // ── Step 15: Update agent stats ──
    await supabase
      .from('agents')
      .update({
        tasks_completed: (agent.tasks_completed ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    // ── Step 16: Cache results for deduplication ──
    const executionResult: ExecutionResult = {
      success: true,
      summary: `Executed ${action}`,
      action,
      params,
      output: actionResult,
      efficiency: {
        tokensSavedByCache,
        tokensSavedByOptimizer,
        cacheHit,
        deduplicated,
        model: modelConfig.id,
        totalTokens,
        cost: estimatedCost,
      },
    };

    if (deduplicator) {
      deduplicator.registerComplete(dedupKey, executionResult);
    }

    // ── Step 17: Send messages to other agents if needed ──
    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        await sendMessage(
          agentId,
          msg.to_agent_id,
          agent.business_id,
          msg.type,
          msg.content,
          trigger.chain_id ?? null,
          supabase
        );
      }
    }

    return executionResult;
  } catch (error) {
    // Register failure in deduplicator
    if (deduplicator) {
      try {
        const dedupKey = buildDedupKey(agentId, trigger);
        deduplicator.registerFailed(dedupKey);
      } catch {
        // best effort
      }
    }

    // Record failure for circuit breaker
    try { await recordFailure(agentId, supabase); } catch { /* best effort */ }
    console.error('[agents/runtime] executeAgent failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown execution error',
    };
  }
}

export async function executeAction(
  agent: { id: string; business_id: string },
  action: string,
  params: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<unknown> {
  switch (action) {
    case 'create_invoice': {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          business_id: agent.business_id,
          client_name: params.client_name as string,
          client_email: params.client_email as string,
          amount: params.amount as number,
          currency: (params.currency as string) ?? 'usd',
          description: params.description as string,
          due_date: params.due_date as string,
          status: 'draft',
          created_by_agent: agent.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case 'update_relationship': {
      const { data, error } = await supabase
        .from('relationships')
        .update({
          ...(params.updates as Record<string, unknown>),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.relationship_id as string)
        .eq('business_id', agent.business_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case 'add_memory': {
      const { data, error } = await supabase
        .from('business_memory')
        .insert({
          business_id: agent.business_id,
          content: params.content as string,
          category: params.category as string,
          tags: params.tags as string[],
          source_agent_id: agent.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case 'create_decision': {
      const { data, error } = await supabase
        .from('decision_cards')
        .insert({
          business_id: agent.business_id,
          agent_id: agent.id,
          type: params.type as string,
          title: params.title as string,
          description: params.description as string,
          options: params.options,
          urgency: params.urgency as string ?? 'normal',
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case 'update_deadline': {
      const { data, error } = await supabase
        .from('deadlines')
        .update({
          status: params.status as string,
        })
        .eq('id', params.deadline_id as string)
        .eq('business_id', agent.business_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case 'store_data': {
      const { data, error } = await supabase
        .from('agent_data')
        .upsert({
          business_id: agent.business_id,
          agent_id: agent.id,
          key: params.key as string,
          value: params.value,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    default:
      return { message: `Action "${action}" acknowledged but no handler implemented` };
  }
}
