import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/client';
import { parseIntent } from '@/lib/core';
import { ContextEngine } from '@/lib/context/engine';

const ChatSchema = z.object({
  message: z.string().min(1).max(5000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

/**
 * POST /api/core/chat — The AI-native chat interface.
 *
 * Flow:
 * 1. Load full business context (algorithm — DB queries)
 * 2. Try intent parsing (algorithm — keyword matching)
 * 3. If action detected, execute it and describe what happened
 * 4. If question/conversation, call AI with full context
 *
 * AI is used for: reasoning, advice, synthesis, conversation.
 * Algorithms used for: context loading, action detection, execution.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ChatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { message, history = [] } = parsed.data;

    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, industry, stage, goals, preferences')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    // ── Step 1: Try algorithmic intent matching first ──
    const intent = parseIntent(message);

    // If high-confidence action intent, execute and respond
    if (intent && intent.confidence >= 0.5) {
      // Import and execute action
      const { ACTION_REGISTRY } = await import('@/lib/core/actions');
      const actionDef = ACTION_REGISTRY[intent.action];

      if (actionDef && intent.action !== 'navigate') {
        try {
          const result = await actionDef.execute(intent.params, supabase, business.id);
          return NextResponse.json({
            reply: result.success
              ? `Done. ${result.message}`
              : `Couldn't do that: ${result.message}`,
            action: {
              id: intent.action,
              params: intent.params,
              result,
            },
            source: 'algorithm',
          });
        } catch {
          // Fall through to AI if action execution fails
        }
      }

      if (intent.action === 'navigate') {
        return NextResponse.json({
          reply: intent.display,
          action: {
            id: 'navigate',
            params: intent.params,
          },
          source: 'algorithm',
        });
      }
    }

    // ── Step 2: Load business context for AI (algorithmic) ──
    const contextEngine = new ContextEngine(supabase, business.id);
    const context = await contextEngine.getContext();

    // Load recent data for context
    const today = new Date().toISOString().split('T')[0];
    const [
      { data: agents },
      { data: recentInvoices },
      { data: recentActivity },
      { count: pendingDecisions },
      { data: costRecords },
    ] = await Promise.all([
      supabase.from('agents').select('name, role, status, tasks_completed').eq('business_id', business.id),
      supabase.from('invoices').select('client_name, amount, status, due_date').eq('business_id', business.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('audit_log').select('action, actor, created_at').eq('business_id', business.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('decisions').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('status', 'pending'),
      supabase.from('audit_log').select('cost').eq('business_id', business.id).gte('created_at', `${today}T00:00:00`),
    ]);

    const costToday = costRecords?.reduce((s, r) => s + (r.cost ?? 0), 0) ?? 0;

    // ── Step 3: Build rich context for AI ──
    const businessSnapshot = `
## Business: ${business.name}
- Industry: ${business.industry ?? 'Not set'}
- Stage: ${business.stage ?? 'Not set'}
- Goals: ${business.goals?.join(', ') ?? 'None set'}

## Agents (${agents?.length ?? 0})
${agents?.map(a => `- ${a.name} (${a.role}) — ${a.status}, ${a.tasks_completed ?? 0} tasks completed`).join('\n') ?? 'No agents hired yet.'}

## Financials
- Invoices: ${recentInvoices?.length ?? 0} recent
${recentInvoices?.map(i => `  - ${i.client_name}: $${i.amount} (${i.status}${i.status === 'sent' && i.due_date < today ? ' — OVERDUE' : ''})`).join('\n') ?? '  No invoices.'}
- Cost today: $${costToday.toFixed(2)}

## Pending
- ${pendingDecisions ?? 0} decisions awaiting your approval

## Recent Activity
${recentActivity?.slice(0, 10).map(a => `- ${a.actor}: ${a.action} (${new Date(a.created_at).toLocaleString()})`).join('\n') ?? 'No recent activity.'}

## Relationships
${context.relationships?.slice(0, 10).map((r: Record<string, unknown>) => `- ${r.name} (${r.type})`).join('\n') ?? 'No contacts yet.'}

## Deadlines
${context.deadlines?.slice(0, 5).map((d: Record<string, unknown>) => `- ${d.title}: due ${d.due_date} (${d.status})`).join('\n') ?? 'No upcoming deadlines.'}
`.trim();

    // ── Step 4: Call AI for reasoning/conversation ──
    const systemPrompt = `You are the AI core of 1P OS — an operating system for one-person businesses. You are talking to the founder of "${business.name}".

You have full access to their business data (shown below). Use it to give specific, actionable answers. Never make up data — only reference what you can see.

${businessSnapshot}

## Your capabilities
You can help with:
- Answering questions about the business (finances, clients, agents, deadlines)
- Giving strategic advice based on the data
- Explaining what agents are doing and their performance
- Suggesting next steps and priorities
- Identifying risks and opportunities

## Style
- Be direct. No fluff. The founder is busy.
- Use specific numbers from the data.
- If you suggest an action, be concrete: "Create an invoice for X" not "You might want to invoice someone."
- If data is missing, say so — don't guess.
- Keep responses under 200 words unless asked for detail.

## Actions
If the user asks you to DO something (create, send, update, delete), tell them exactly what to do. You can suggest they use the command bar (Cmd+K) for quick actions.`;

    const client = getAnthropicClient();
    const messages = [
      ...history.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages,
    });

    const textBlock = response.content.find(block => block.type === 'text');
    const reply = textBlock?.text ?? 'No response generated.';

    return NextResponse.json({
      reply,
      source: 'ai',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('[api/core/chat] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
