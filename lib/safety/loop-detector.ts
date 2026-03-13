import type { SupabaseClient } from '@supabase/supabase-js';

interface LoopCheckResult {
  safe: boolean;
  reason?: string;
}

const DEFAULT_MAX_CHAIN_DEPTH = 10;
const DEFAULT_MAX_REPEAT_COUNT = 3;

export async function checkLoopDetection(
  chainId: string,
  chainDepth: number,
  businessId: string,
  supabase: SupabaseClient
): Promise<LoopCheckResult> {
  // Fetch config
  const { data: config } = await supabase
    .from('safety_config')
    .select('max_chain_depth, max_repeat_count')
    .eq('business_id', businessId)
    .single();

  const maxDepth = config?.max_chain_depth ?? DEFAULT_MAX_CHAIN_DEPTH;
  const maxRepeat = config?.max_repeat_count ?? DEFAULT_MAX_REPEAT_COUNT;

  // Check chain depth
  if (chainDepth >= maxDepth) {
    return {
      safe: false,
      reason: `Chain depth ${chainDepth} exceeds maximum of ${maxDepth}`,
    };
  }

  // Check for repeated patterns in the chain
  const { data: messages } = await supabase
    .from('agent_messages')
    .select('from_agent_id, to_agent_id, action_type')
    .eq('chain_id', chainId)
    .order('created_at', { ascending: true });

  if (messages && messages.length >= maxRepeat) {
    // Look for repeating patterns (same from->to->action sequence)
    const patterns = messages.map(
      (m) => `${m.from_agent_id}:${m.to_agent_id}:${m.action_type}`
    );

    const lastPattern = patterns[patterns.length - 1];
    const repeatCount = patterns.filter((p) => p === lastPattern).length;

    if (repeatCount >= maxRepeat) {
      return {
        safe: false,
        reason: `Pattern "${lastPattern}" repeated ${repeatCount} times (max: ${maxRepeat})`,
      };
    }
  }

  return { safe: true };
}

export async function getChainDepth(
  chainId: string,
  supabase: SupabaseClient
): Promise<number> {
  const { count, error } = await supabase
    .from('agent_messages')
    .select('*', { count: 'exact', head: true })
    .eq('chain_id', chainId);

  if (error) {
    console.error('[safety/loop-detector] Failed to get chain depth:', error);
    return 0;
  }

  return count ?? 0;
}
