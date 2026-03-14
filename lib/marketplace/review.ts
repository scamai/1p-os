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
    // Increment flag_count on the marketplace_agents table
    // (marketplace_flags table doesn't exist — track flags inline)
    const { data: agentData, error: fetchError } = await supabase
      .from('marketplace_agents')
      .select('flag_count')
      .eq('id', marketplaceAgentId)
      .single();

    if (fetchError) throw fetchError;

    const flagCount = ((agentData?.flag_count as number) ?? 0) + 1;

    const { error: updateError } = await supabase
      .from('marketplace_agents')
      .update({
        flag_count: flagCount,
        last_flag_reason: reason,
        last_flag_at: new Date().toISOString(),
      })
      .eq('id', marketplaceAgentId);

    if (updateError) throw updateError;

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
