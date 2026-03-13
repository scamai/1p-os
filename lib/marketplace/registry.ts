import { SupabaseClient } from '@supabase/supabase-js';
import { createAgent } from '@/lib/agents/lifecycle';

interface MarketplaceAgent {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  author_id: string;
  author_name: string;
  manifest: {
    role: string;
    system_prompt: string;
    permissions: Record<string, unknown>;
    allowed_actions: string[];
    triggers: Array<{ type: string; schedule?: string; event_type?: string }>;
    budget: { daily_limit: number; monthly_limit: number; currency: string };
    model_preference?: string;
  };
  installs: number;
  rating: number;
  status: 'published' | 'pending_review' | 'rejected' | 'disabled';
  created_at: string;
}

export async function browseMarketplace(
  category?: string,
  search?: string,
  supabase?: SupabaseClient
): Promise<MarketplaceAgent[]> {
  if (!supabase) throw new Error('Supabase client is required');

  try {
    let query = supabase
      .from('marketplace_agents')
      .select('*')
      .eq('status', 'published')
      .order('installs', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data as MarketplaceAgent[]) ?? [];
  } catch (error) {
    console.error('[marketplace/registry] browseMarketplace failed:', error);
    return [];
  }
}

export async function getMarketplaceAgent(
  slug: string,
  supabase: SupabaseClient
): Promise<MarketplaceAgent | null> {
  try {
    const { data, error } = await supabase
      .from('marketplace_agents')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data as MarketplaceAgent;
  } catch (error) {
    console.error('[marketplace/registry] getMarketplaceAgent failed:', error);
    return null;
  }
}

export async function installMarketplaceAgent(
  businessId: string,
  marketplaceAgentId: string,
  supabase: SupabaseClient
): Promise<{ agentId: string } | null> {
  try {
    // Fetch the marketplace agent
    const { data: mpAgent, error: fetchError } = await supabase
      .from('marketplace_agents')
      .select('*')
      .eq('id', marketplaceAgentId)
      .eq('status', 'published')
      .single();

    if (fetchError || !mpAgent) {
      throw new Error(`Marketplace agent not found or not published: ${marketplaceAgentId}`);
    }

    const typed = mpAgent as MarketplaceAgent;

    // Create a local agent from the manifest
    const agent = await createAgent(
      businessId,
      {
        name: typed.name,
        role: typed.manifest.role,
        system_prompt: typed.manifest.system_prompt,
        permissions: typed.manifest.permissions,
        allowed_actions: typed.manifest.allowed_actions,
        triggers: typed.manifest.triggers,
        budget: typed.manifest.budget,
        model_preference: typed.manifest.model_preference,
      },
      supabase
    );

    // Link installed agent to marketplace source
    await supabase
      .from('installed_agents')
      .insert({
        business_id: businessId,
        agent_id: agent.id,
        marketplace_agent_id: marketplaceAgentId,
      });

    // Increment install count
    await supabase.rpc('increment_marketplace_installs', {
      agent_id: marketplaceAgentId,
    });

    return { agentId: agent.id };
  } catch (error) {
    console.error('[marketplace/registry] installMarketplaceAgent failed:', error);
    return null;
  }
}

export async function uninstallMarketplaceAgent(
  agentId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    // Remove the link
    const { error: linkError } = await supabase
      .from('installed_agents')
      .delete()
      .eq('agent_id', agentId);

    if (linkError) throw linkError;

    // Delete the agent (soft delete)
    const { error: agentError } = await supabase
      .from('agents')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', agentId);

    if (agentError) throw agentError;
  } catch (error) {
    console.error('[marketplace/registry] uninstallMarketplaceAgent failed:', error);
    throw error;
  }
}
