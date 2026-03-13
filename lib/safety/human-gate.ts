import type { SupabaseClient } from '@supabase/supabase-js';

export const ALWAYS_REQUIRE_HUMAN = [
  'send_invoice',
  'create_contract',
  'sign_document',
  'file_taxes',
  'access_bank_data',
  'create_payment_link',
  'delete_data',
  'change_permissions',
  'send_legal_notice',
] as const;

interface AgentWithOverrides {
  id: string;
  human_approval_overrides?: Record<string, boolean>;
  autonomy_level?: 'full' | 'supervised' | 'restricted';
}

export function requiresHumanApproval(
  action: string,
  agent: AgentWithOverrides
): boolean {
  // Always-require actions cannot be bypassed
  if ((ALWAYS_REQUIRE_HUMAN as readonly string[]).includes(action)) {
    return true;
  }

  // Restricted agents always need approval
  if (agent.autonomy_level === 'restricted') {
    return true;
  }

  // Check agent-specific overrides
  if (agent.human_approval_overrides?.[action] !== undefined) {
    return agent.human_approval_overrides[action];
  }

  // Supervised agents need approval for actions not explicitly allowed
  if (agent.autonomy_level === 'supervised') {
    return true;
  }

  // Full autonomy agents don't need approval for non-critical actions
  return false;
}

interface DecisionCardOptions {
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export async function createDecisionCard(
  businessId: string,
  agentId: string,
  type: 'approval' | 'choice' | 'info' | 'warning',
  title: string,
  description: string,
  options: Array<{ label: string; value: string; recommended?: boolean }>,
  supabase: SupabaseClient,
  cardOptions?: DecisionCardOptions
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('decision_cards')
    .insert({
      business_id: businessId,
      agent_id: agentId,
      type,
      title,
      description,
      options,
      status: 'pending',
      urgency: cardOptions?.urgency ?? 'medium',
      expires_at: cardOptions?.expiresAt ?? null,
      metadata: cardOptions?.metadata ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[safety/human-gate] Failed to create decision card:', error);
    throw error;
  }

  return data;
}
