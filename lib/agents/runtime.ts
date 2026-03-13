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

export interface AgentTrigger {
  type: string;
  source?: string;
  event_type?: string;
  data?: Record<string, unknown>;
  chain_id?: string;
  chain_depth?: number;
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
}

export async function executeAgent(
  agentId: string,
  trigger: AgentTrigger,
  supabase: SupabaseClient
): Promise<ExecutionResult> {
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

    // 1. Check circuit breaker
    const circuitStatus = await checkCircuitBreaker(agentId, supabase);
    if (circuitStatus.isOpen) {
      return { success: false, error: 'Circuit breaker is open — agent temporarily disabled' };
    }

    // 2. Check cost budget (estimate ~$0.01 per call)
    const budgetResult = await checkBudget(agentId, agent.business_id, 0.01, supabase);
    if (!budgetResult.allowed) {
      return { success: false, error: budgetResult.reason ?? 'Cost budget exceeded' };
    }

    // 3. Check loop detection if part of a chain
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

    // 4. Load business context
    const contextEngine = new ContextEngine(supabase, agent.business_id);
    const context = await contextEngine.getContext();

    // 5. Classify task and route to optimal model
    const taskDescription = trigger.type + ' ' + JSON.stringify(trigger.data ?? {});
    const complexity = classifyTask(taskDescription);
    const modelConfig = await routeTask(trigger.type, complexity, agent.business_id, supabase);

    // 6. Build prompt with context
    const systemPrompt = getAgentSystemPrompt(agent.role, context);
    const userPrompt = `Trigger: ${trigger.type}\nData: ${JSON.stringify(trigger.data ?? {})}\n\nRespond with a JSON object containing: { "action": string, "params": object, "messages": [{ "to_agent_id": string, "type": string, "content": string }] (optional) }`;

    // 7. Call AI model
    const aiResponse = await generateText(userPrompt, {
      model: modelConfig.id,
      maxTokens: 1024,
      systemPrompt,
    });

    // Parse AI response
    let parsedResponse: { action: string; params: Record<string, unknown>; messages?: Array<{ to_agent_id: string; type: string; content: string }> };
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsedResponse = JSON.parse(jsonMatch?.[0] ?? aiResponse);
    } catch {
      console.error('[agents/runtime] Failed to parse AI response:', aiResponse);
      return { success: false, error: 'Failed to parse AI response' };
    }

    const { action, params, messages } = parsedResponse;

    // 8. Validate response against allowed_actions
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
      return { success: false, error: `Action not allowed: ${validationResult.reason}` };
    }

    // 9. Check human gate
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
      return {
        success: true,
        action,
        params,
        awaiting_approval: true,
        decision_card_id: card.id as string,
      };
    }

    // 10. Execute the action
    const actionResult = await executeAction(agent, action, params, supabase);

    // 11. Record cost
    const estimatedCost = (modelConfig.costPerInputToken * 500 + modelConfig.costPerOutputToken * 200);
    await recordCost(agentId, agent.business_id, estimatedCost, modelConfig.id, 700, supabase);

    // 12. Log to audit trail
    await logAudit({
      businessId: agent.business_id,
      actor: `agent:${agentId}`,
      action: 'action_executed',
      resourceType: action,
      modelUsed: modelConfig.id,
      costUsd: estimatedCost,
      success: true,
    }, supabase);

    // 13. Update agent stats
    await supabase
      .from('agents')
      .update({
        tasks_completed: (agent.tasks_completed ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    // 14. Send messages to other agents if needed
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

    return { success: true, summary: `Executed ${action}`, action, params, output: actionResult };
  } catch (error) {
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
