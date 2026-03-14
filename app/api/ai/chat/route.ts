import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateStructured } from '@/lib/ai/client';
import { getChatPrompt } from '@/lib/ai/prompts';
import { ChatResponseSchema } from '@/lib/ai/structured';
import { agentMemory } from '@/lib/agents/memory';

export const dynamic = 'force-dynamic';

const ChatInputSchema = z.object({
  agentId: z.string().uuid(),
  message: z.string().min(1).max(10000),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ChatInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { agentId, message } = parsed.data;

    // Verify agent belongs to user's business and load agent details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*, businesses!inner(user_id, name, industry, stage, goals)')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (agent.businesses.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Load recent chat history for context
    const { data: recentMessages } = await supabase
      .from('agent_messages')
      .select('role, content')
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const historyContext = recentMessages && recentMessages.length > 0
      ? '\n\n## Recent Conversation History\n' +
        recentMessages
          .reverse()
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n')
      : '';

    const systemPrompt = getChatPrompt(agent.name, agent.role) + historyContext;

    const chatResponse = await generateStructured(message, ChatResponseSchema, {
      maxTokens: 2048,
      temperature: 0.7,
      systemPrompt,
    });

    // Store the user message and agent response
    await supabase.from('agent_messages').insert([
      {
        agent_id: agentId,
        user_id: user.id,
        business_id: agent.business_id,
        role: 'user',
        content: message,
      },
      {
        agent_id: agentId,
        user_id: user.id,
        business_id: agent.business_id,
        role: 'assistant',
        content: chatResponse.responseText,
      },
    ]);

    // Auto-extract memories from the conversation (non-blocking)
    agentMemory
      .addFromConversation(agentId, agent.business_id, [
        { role: 'user', content: message },
        { role: 'assistant', content: chatResponse.responseText },
      ])
      .catch((err) => {
        console.error('[ai/chat] Memory extraction failed:', err);
      });

    return NextResponse.json({ response: chatResponse }, { status: 200 });
  } catch (error) {
    console.error('[ai/chat] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
