import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateStructured } from '@/lib/ai/client';
import { getSetupPrompt } from '@/lib/ai/prompts';
import { SetupResultSchema } from '@/lib/ai/structured';

const SetupInputSchema = z.object({
  template: z.string().min(1),
  businessName: z.string().min(1),
  state: z.string().min(1),
  description: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = SetupInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { template, businessName, state, description } = parsed.data;

    const userInput = `Business Name: ${businessName}\nState: ${state}\nDescription: ${description}`;
    const prompt = getSetupPrompt(template, userInput);

    const setupResult = await generateStructured(prompt, SetupResultSchema, {
      maxTokens: 4096,
      temperature: 0.5,
      systemPrompt: 'You are a business setup assistant for 1P OS.',
    });

    // Create business row
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .insert({
        user_id: user.id,
        name: setupResult.businessName,
        industry: setupResult.industry ?? null,
        stage: setupResult.stage ?? null,
        template,
        state,
        goals: setupResult.goals ?? [],
        preferences: setupResult.preferences ?? {},
      })
      .select()
      .single();

    if (bizError) {
      console.error('[ai/setup] Failed to create business:', bizError);
      return NextResponse.json(
        { error: 'Failed to create business', details: bizError.message },
        { status: 500 }
      );
    }

    // Create agents
    const agentInserts = setupResult.agentsToCreate.map((agent) => ({
      business_id: business.id,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      priority: agent.priority,
      status: 'active',
      system_prompt: '',
      context_permissions: [],
      allowed_actions: [],
      triggers: [],
      budget: {},
    }));

    if (agentInserts.length > 0) {
      const { error: agentsError } = await supabase
        .from('agents')
        .insert(agentInserts);

      if (agentsError) {
        console.error('[ai/setup] Failed to create agents:', agentsError);
      }
    }

    // Create deadlines
    const deadlineInserts = setupResult.deadlines.map((deadline) => ({
      business_id: business.id,
      title: deadline.title,
      due_date: deadline.dueDate,
      category: deadline.category,
      description: deadline.description ?? null,
      status: 'pending',
    }));

    if (deadlineInserts.length > 0) {
      const { error: deadlinesError } = await supabase
        .from('deadlines')
        .insert(deadlineInserts);

      if (deadlinesError) {
        console.error('[ai/setup] Failed to create deadlines:', deadlinesError);
      }
    }

    // Create safety config
    const { error: safetyError } = await supabase
      .from('safety_config')
      .insert({
        business_id: business.id,
        kill_switch_active: false,
        kill_switch_level: 0,
        global_daily_budget: 50.0,
        global_monthly_budget: 500.0,
        routing_strategy: 'balanced',
      });

    if (safetyError) {
      console.error('[ai/setup] Failed to create safety config:', safetyError);
    }

    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    console.error('[ai/setup] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
