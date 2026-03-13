import { SupabaseClient } from '@supabase/supabase-js';

const AUTO_DISABLE_FLAG_THRESHOLD = 3;

export async function submitForReview(
  marketplaceAgentId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { error } = await supabase
      .from('marketplace_agents')
      .update({
        status: 'pending_review',
        submitted_for_review_at: new Date().toISOString(),
      })
      .eq('id', marketplaceAgentId);

    if (error) throw error;
  } catch (error) {
    console.error('[marketplace/review] submitForReview failed:', error);
    throw error;
  }
}

export async function reviewAgent(
  marketplaceAgentId: string,
  decision: 'approved' | 'rejected',
  supabase: SupabaseClient
): Promise<void> {
  try {
    const status = decision === 'approved' ? 'published' : 'rejected';

    const { error } = await supabase
      .from('marketplace_agents')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', marketplaceAgentId);

    if (error) throw error;
  } catch (error) {
    console.error('[marketplace/review] reviewAgent failed:', error);
    throw error;
  }
}

export async function flagAgent(
  marketplaceAgentId: string,
  reason: string,
  supabase: SupabaseClient
): Promise<{ disabled: boolean }> {
  try {
    // Record the flag
    const { error: flagError } = await supabase
      .from('marketplace_flags')
      .insert({
        marketplace_agent_id: marketplaceAgentId,
        reason,
        created_at: new Date().toISOString(),
      });

    if (flagError) throw flagError;

    // Count total flags
    const { count, error: countError } = await supabase
      .from('marketplace_flags')
      .select('*', { count: 'exact', head: true })
      .eq('marketplace_agent_id', marketplaceAgentId);

    if (countError) throw countError;

    const flagCount = count ?? 0;

    // Auto-disable at threshold
    if (flagCount >= AUTO_DISABLE_FLAG_THRESHOLD) {
      const { error: disableError } = await supabase
        .from('marketplace_agents')
        .update({
          status: 'disabled',
          disabled_reason: `Auto-disabled after ${flagCount} community flags`,
          disabled_at: new Date().toISOString(),
        })
        .eq('id', marketplaceAgentId);

      if (disableError) throw disableError;

      return { disabled: true };
    }

    return { disabled: false };
  } catch (error) {
    console.error('[marketplace/review] flagAgent failed:', error);
    throw error;
  }
}
