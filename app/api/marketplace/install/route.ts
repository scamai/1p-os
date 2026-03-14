import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const InstallSchema = z.object({
  marketplaceAgentId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = InstallSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { marketplaceAgentId } = parsed.data;

    // Get user's business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: 'No business found. Complete setup first.' },
        { status: 404 }
      );
    }

    // Fetch marketplace agent template
    const { data: marketplaceAgent, error: fetchError } = await supabase
      .from('marketplace_agents')
      .select('*')
      .eq('id', marketplaceAgentId)
      .eq('status', 'published')
      .single();

    if (fetchError || !marketplaceAgent) {
      return NextResponse.json(
        { error: 'Marketplace agent not found' },
        { status: 404 }
      );
    }

    // Check if already installed
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('business_id', business.id)
      .eq('marketplace_agent_id', marketplaceAgentId)
      .single();

    if (existingAgent) {
      return NextResponse.json(
        { error: 'Agent already installed' },
        { status: 409 }
      );
    }

    // Create agent from marketplace template
    const { data: agent, error: createError } = await supabase
      .from('agents')
      .insert({
        business_id: business.id,
        marketplace_agent_id: marketplaceAgentId,
        name: marketplaceAgent.name,
        role: marketplaceAgent.role,
        description: marketplaceAgent.description,
        system_prompt: marketplaceAgent.system_prompt,
        context_permissions: marketplaceAgent.context_permissions ?? [],
        allowed_actions: marketplaceAgent.allowed_actions ?? [],
        triggers: marketplaceAgent.triggers ?? [],
        budget: marketplaceAgent.default_budget ?? {},
        status: 'active',
      })
      .select()
      .single();

    if (createError) {
      console.error('[marketplace/install] Failed to install agent:', createError);
      return NextResponse.json(
        { error: 'Failed to install agent' },
        { status: 500 }
      );
    }

    // Increment install count
    await supabase.rpc('increment_install_count', {
      agent_id: marketplaceAgentId,
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('[marketplace/install] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
