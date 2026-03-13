import type { SupabaseClient } from '@supabase/supabase-js';

interface CircuitBreakerStatus {
  isOpen: boolean;
  failureCount: number;
  lastFailureAt: string | null;
}

const DEFAULT_THRESHOLD = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

async function getThresholds(
  businessId: string,
  supabase: SupabaseClient
): Promise<{ threshold: number; windowMs: number }> {
  const { data } = await supabase
    .from('safety_config')
    .select('circuit_breaker_threshold, circuit_breaker_window_ms')
    .eq('business_id', businessId)
    .single();

  return {
    threshold: data?.circuit_breaker_threshold ?? DEFAULT_THRESHOLD,
    windowMs: data?.circuit_breaker_window_ms ?? DEFAULT_WINDOW_MS,
  };
}

export async function checkCircuitBreaker(
  agentId: string,
  supabase: SupabaseClient
): Promise<CircuitBreakerStatus> {
  const { data: agent } = await supabase
    .from('agents')
    .select('failure_count, last_failure_at, circuit_open, business_id')
    .eq('id', agentId)
    .single();

  if (!agent) {
    return { isOpen: false, failureCount: 0, lastFailureAt: null };
  }

  if (agent.circuit_open) {
    return {
      isOpen: true,
      failureCount: agent.failure_count ?? 0,
      lastFailureAt: agent.last_failure_at,
    };
  }

  const { threshold, windowMs } = await getThresholds(agent.business_id, supabase);

  // Check if failures within window exceed threshold
  if (agent.failure_count >= threshold && agent.last_failure_at) {
    const lastFailure = new Date(agent.last_failure_at).getTime();
    const windowStart = Date.now() - windowMs;

    if (lastFailure > windowStart) {
      // Open the circuit
      await supabase
        .from('agents')
        .update({ circuit_open: true })
        .eq('id', agentId);

      return {
        isOpen: true,
        failureCount: agent.failure_count,
        lastFailureAt: agent.last_failure_at,
      };
    }

    // Failures outside window — reset
    await resetCircuitBreaker(agentId, supabase);
    return { isOpen: false, failureCount: 0, lastFailureAt: null };
  }

  return {
    isOpen: false,
    failureCount: agent.failure_count ?? 0,
    lastFailureAt: agent.last_failure_at,
  };
}

export async function recordFailure(
  agentId: string,
  supabase: SupabaseClient
): Promise<void> {
  const { data: agent } = await supabase
    .from('agents')
    .select('failure_count, business_id')
    .eq('id', agentId)
    .single();

  if (!agent) return;

  const newCount = (agent.failure_count ?? 0) + 1;
  const { threshold } = await getThresholds(agent.business_id, supabase);

  await supabase
    .from('agents')
    .update({
      failure_count: newCount,
      last_failure_at: new Date().toISOString(),
      ...(newCount >= threshold ? { circuit_open: true } : {}),
    })
    .eq('id', agentId);
}

export async function resetCircuitBreaker(
  agentId: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from('agents')
    .update({
      failure_count: 0,
      last_failure_at: null,
      circuit_open: false,
    })
    .eq('id', agentId);
}
