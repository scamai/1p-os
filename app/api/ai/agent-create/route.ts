import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateStructured } from '@/lib/ai/client';

const AgentCreateInputSchema = z.object({
  description: z.string().min(1).max(2000),
});

const ProposedAgentConfigSchema = z.object({
  name: z.string(),
  role: z.string(),
  description: z.string(),
  system_prompt: z.string(),
  context_permissions: z.array(z.string()),
  allowed_actions: z.array(z.string()),
  triggers: z.array(
    z.object({
      type: z.string(),
      config: z.record(z.string(), z.unknown()),
    })
  ),
  budget: z.object({
    daily_limit: z.number().optional(),
    monthly_limit: z.number().optional(),
    model_preference: z.string().optional(),
  }),
  reasoning: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AgentCreateInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { description } = parsed.data;

    // Get business context for better agent generation
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const businessContext = business
      ? `Business: ${business.name}, Industry: ${business.industry ?? 'unknown'}, Stage: ${business.stage ?? 'unknown'}`
      : 'No business context available.';

    const prompt = `Based on the following natural language description, generate a complete AI agent configuration for the 1P OS platform.

## Business Context
${businessContext}

## User's Description
"${description}"

Generate a complete agent configuration including:
- name: A concise, professional name for the agent
- role: The agent's functional role (e.g., operations, finance, sales, marketing, legal, product, customer-success)
- description: A brief description of what the agent does
- system_prompt: A detailed system prompt that defines the agent's behavior and expertise
- context_permissions: Which data scopes the agent can access (e.g., ["finance", "customers", "operations"])
- allowed_actions: What actions the agent can perform (e.g., ["send_email", "create_invoice", "update_crm"])
- triggers: When the agent should activate automatically
- budget: Cost limits for the agent
- reasoning: Explain why you configured the agent this way

Be practical and security-conscious. Don't give agents more permissions than they need.`;

    const proposedConfig = await generateStructured(
      prompt,
      ProposedAgentConfigSchema,
      {
        maxTokens: 4096,
        temperature: 0.4,
        systemPrompt: 'You are an AI agent architect for 1P OS. Generate practical, secure agent configurations.',
      }
    );

    return NextResponse.json({ proposedConfig }, { status: 200 });
  } catch (error) {
    console.error('[ai/agent-create] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
