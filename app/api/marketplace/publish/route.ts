import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PublishSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  system_prompt: z.string().min(1),
  context_permissions: z.array(z.string()),
  allowed_actions: z.array(z.string()),
  triggers: z.array(
    z.object({
      type: z.string(),
      config: z.record(z.string(), z.unknown()),
    })
  ),
  default_budget: z.object({
    daily_limit: z.number().nonnegative().optional(),
    monthly_limit: z.number().nonnegative().optional(),
    model_preference: z.string().optional(),
  }).optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  icon: z.string().optional(),
  readme: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = PublishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check for duplicate names by this publisher
    const { data: existing } = await supabase
      .from('marketplace_agents')
      .select('id')
      .eq('publisher_id', user.id)
      .eq('name', data.name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a published agent with this name' },
        { status: 409 }
      );
    }

    const { data: published, error: publishError } = await supabase
      .from('marketplace_agents')
      .insert({
        publisher_id: user.id,
        name: data.name,
        role: data.role,
        description: data.description,
        system_prompt: data.system_prompt,
        context_permissions: data.context_permissions,
        allowed_actions: data.allowed_actions,
        triggers: data.triggers,
        default_budget: data.default_budget ?? {},
        category: data.category,
        tags: data.tags,
        icon: data.icon ?? null,
        readme: data.readme ?? null,
        status: 'published',
        install_count: 0,
      })
      .select()
      .single();

    if (publishError) {
      console.error('[marketplace/publish] Failed to publish agent:', publishError);
      return NextResponse.json(
        { error: 'Failed to publish agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ agent: published }, { status: 201 });
  } catch (error) {
    console.error('[marketplace/publish] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
