import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const ParseCommandInputSchema = z.object({
  input: z.string().min(1).max(2000),
});

interface ParsedCommand {
  action: string;
  params: Record<string, unknown>;
  confidence: number;
  display_text?: string;
}

// Keyword rules — no AI needed
const ACTION_RULES: Array<{
  action: string;
  keywords: string[];
  extract?: (input: string) => Record<string, unknown>;
  display: (params: Record<string, unknown>) => string;
}> = [
  {
    action: 'new_invoice',
    keywords: ['invoice', 'bill', 'charge'],
    extract: (input) => {
      const amount = input.match(/\$?([\d,]+(?:\.\d{2})?)/)?.[1]?.replace(',', '');
      const words = input.split(/\s+/).filter(w => !w.match(/invoice|bill|new|create|for|\$[\d]/i));
      const clientHint = words.length > 0 ? words.join(' ').trim() : undefined;
      return { ...(amount ? { amount: parseFloat(amount) } : {}), ...(clientHint ? { client_hint: clientHint } : {}) };
    },
    display: (p) => `Create invoice${p.client_hint ? ` for ${p.client_hint}` : ''}${p.amount ? `: $${p.amount}` : ''}`,
  },
  {
    action: 'new_expense',
    keywords: ['expense', 'spent', 'cost', 'paid for', 'log expense'],
    extract: (input) => {
      const amount = input.match(/\$?([\d,]+(?:\.\d{2})?)/)?.[1]?.replace(',', '');
      const categoryWords = input.split(/\s+/).filter(w => !w.match(/expense|log|new|spent|\$[\d]/i));
      const category = categoryWords.length > 0 ? categoryWords.join(' ').trim() : undefined;
      return { ...(amount ? { amount: parseFloat(amount) } : {}), ...(category ? { category } : {}) };
    },
    display: (p) => `Log expense${p.amount ? `: $${p.amount}` : ''}${p.category ? ` (${p.category})` : ''}`,
  },
  {
    action: 'add_person',
    keywords: ['add person', 'new person', 'add client', 'new client', 'add contact', 'add lead', 'new lead', 'add contractor'],
    extract: (input) => {
      const typeMatch = input.match(/\b(client|lead|contractor|contact|person)\b/i);
      const type = typeMatch ? typeMatch[1].toLowerCase() : undefined;
      const nameWords = input.split(/\s+/).filter(w => !w.match(/add|new|person|client|lead|contractor|contact/i));
      const name = nameWords.length > 0 ? nameWords.join(' ').trim() : undefined;
      return { ...(type ? { type } : {}), ...(name ? { name } : {}) };
    },
    display: (p) => `Add person${p.name ? `: ${p.name}` : ''}${p.type ? ` (${p.type})` : ''}`,
  },
  {
    action: 'new_project',
    keywords: ['project', 'new project', 'create project'],
    extract: (input) => {
      const nameWords = input.split(/\s+/).filter(w => !w.match(/new|create|project/i));
      const name = nameWords.length > 0 ? nameWords.join(' ').trim() : undefined;
      return name ? { name } : {};
    },
    display: (p) => `New project${p.name ? `: ${p.name}` : ''}`,
  },
  {
    action: 'hire_agent',
    keywords: ['hire', 'new agent', 'create agent', 'add agent'],
    extract: (input) => {
      const roleWords = input.split(/\s+/).filter(w => !w.match(/hire|new|create|add|agent|a|an/i));
      const role = roleWords.length > 0 ? roleWords.join(' ').trim() : undefined;
      return role ? { role } : {};
    },
    display: (p) => `Hire agent${p.role ? `: ${p.role}` : ''}`,
  },
  {
    action: 'upload_document',
    keywords: ['upload', 'document', 'file'],
    extract: (input) => {
      const typeMatch = input.match(/\b(contract|invoice|receipt|report|document|file)\b/i);
      return typeMatch ? { type: typeMatch[1].toLowerCase() } : {};
    },
    display: (p) => `Upload document${p.type ? `: ${p.type}` : ''}`,
  },
  {
    action: 'safety_action',
    keywords: ['stop', 'kill', 'pause', 'halt', 'emergency', 'shut down', 'stop everything'],
    extract: (input) => {
      if (input.match(/everything|all/i)) return { type: 'kill_all' };
      return { type: 'pause' };
    },
    display: (p) => p.type === 'kill_all' ? 'Safety: kill all agent activity' : 'Safety: pause agents',
  },
  {
    action: 'install_skill',
    keywords: ['install skill', 'add skill', 'new skill'],
    extract: () => ({}),
    display: () => 'Install skill',
  },
  {
    action: 'configure_model',
    keywords: ['configure model', 'model settings', 'change model', 'ai model', 'switch model'],
    extract: () => ({}),
    display: () => 'Configure model',
  },
];

function parseCommand(input: string): ParsedCommand {
  const lower = input.toLowerCase().trim();

  // Check for @agent chat pattern
  if (lower.startsWith('@')) {
    const match = input.match(/^@(\S+)\s*(.*)/);
    if (match) {
      return {
        action: 'agent_chat',
        params: { agent_name: match[1], message: match[2] || '' },
        confidence: 0.95,
        display_text: `Chat with ${match[1]}${match[2] ? `: ${match[2]}` : ''}`,
      };
    }
  }

  // Check for question patterns → quick_info
  if (lower.match(/^(how much|what|when|where|who|how many|show me|tell me)/)) {
    const queryMap: Array<{ pattern: RegExp; query: string; display: string }> = [
      { pattern: /spend|cost|spent|budget/, query: 'spending_today', display: "Quick info: today's spending" },
      { pattern: /revenue|earned|income|finance/, query: 'revenue', display: 'Quick info: revenue' },
      { pattern: /agent|team/, query: 'agents', display: 'Quick info: agent status' },
      { pattern: /task|work|doing/, query: 'tasks', display: 'Quick info: active tasks' },
    ];

    for (const q of queryMap) {
      if (lower.match(q.pattern)) {
        return { action: 'quick_info', params: { query: q.query }, confidence: 0.85, display_text: q.display };
      }
    }

    return { action: 'search', params: { query: input }, confidence: 0.7, display_text: `Search: ${input}` };
  }

  // Match against keyword rules
  let bestMatch: { rule: typeof ACTION_RULES[0]; score: number } | null = null;

  for (const rule of ACTION_RULES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        const score = keyword.length / lower.length; // Longer keyword match = higher confidence
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { rule, score };
        }
      }
    }
  }

  if (bestMatch) {
    const params = bestMatch.rule.extract?.(input) ?? {};
    const confidence = Math.min(0.95, 0.6 + bestMatch.score);
    return {
      action: bestMatch.rule.action,
      params,
      confidence,
      display_text: bestMatch.rule.display(params),
    };
  }

  // Fallback: treat as search
  if (lower.length > 2) {
    return { action: 'search', params: { query: input }, confidence: 0.5, display_text: `Search: ${input}` };
  }

  return { action: 'unknown', params: {}, confidence: 0 };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ParseCommandInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = parseCommand(parsed.data.input);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[ai/parse-command] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
