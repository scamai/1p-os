import type { SupabaseClient } from '@supabase/supabase-js';
import { ACTION_REGISTRY, type ActionResult } from './actions';
import { analyzeForSection, type Insight } from './analyzer';

/**
 * AI Core Engine — the brain that controls 1P OS.
 *
 * Design principle: ALGORITHM FIRST, AI LAST.
 *
 * 1. Natural language → intent matching (keyword/regex, no AI)
 * 2. Intent → action execution (deterministic CRUD)
 * 3. Business state → insights (algorithmic analysis)
 * 4. AI only used when genuinely creative output is needed
 */

// ── Intent matching (pure algorithm) ──

export interface ParsedIntent {
  action: string;
  params: Record<string, unknown>;
  confidence: number;
  display: string; // human-readable description of what will happen
}

interface IntentRule {
  keywords: string[];
  patterns?: RegExp[];
  action: string;
  extract: (input: string) => Record<string, unknown>;
  display: (params: Record<string, unknown>) => string;
}

const INTENT_RULES: IntentRule[] = [
  // Navigation
  {
    keywords: ['go to', 'show me', 'open', 'navigate'],
    patterns: [/(?:go to|show me|open|navigate to?)\s+(\w+)/i],
    action: 'navigate',
    extract: (input) => {
      const pageMap: Record<string, string> = {
        home: '/', hq: '/', dashboard: '/',
        money: '/finance', finance: '/finance', invoices: '/finance', billing: '/finance',
        sales: '/sales', pipeline: '/sales', leads: '/sales', proposals: '/sales',
        people: '/people', contacts: '/people', clients: '/people',
        work: '/work', tasks: '/work', projects: '/work',
        team: '/team', agents: '/team',
        talent: '/talent', marketplace: '/talent', hire: '/talent',
        canvas: '/canvas', docs: '/canvas', documents: '/canvas',
        settings: '/settings', config: '/settings',
        vault: '/vault', files: '/vault',
      };
      const lower = input.toLowerCase();
      for (const [keyword, page] of Object.entries(pageMap)) {
        if (lower.includes(keyword)) return { page };
      }
      return { page: '/' };
    },
    display: (params) => `Go to ${params.page}`,
  },

  // Create invoice
  {
    keywords: ['invoice', 'bill', 'charge'],
    patterns: [/(?:create|new|send|make)\s+(?:an?\s+)?invoice/i, /invoice\s+(\w+)\s+\$?([\d,.]+)/i],
    action: 'create_invoice',
    extract: (input) => {
      const amountMatch = input.match(/\$?([\d,]+(?:\.\d{2})?)/);
      const nameMatch = input.match(/(?:for|to)\s+([A-Z][a-zA-Z\s]+?)(?:\s+\$|\s+for|\s*$)/);
      return {
        amount: amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : undefined,
        client_name: nameMatch?.[1]?.trim(),
      };
    },
    display: (params) => {
      const parts = ['Create invoice'];
      if (params.client_name) parts.push(`for ${params.client_name}`);
      if (params.amount) parts.push(`— $${params.amount}`);
      return parts.join(' ');
    },
  },

  // Log expense
  {
    keywords: ['expense', 'spent', 'paid for', 'cost me'],
    patterns: [/(?:log|add|record|new)\s+(?:an?\s+)?expense/i],
    action: 'create_expense',
    extract: (input) => {
      const amountMatch = input.match(/\$?([\d,]+(?:\.\d{2})?)/);
      const descMatch = input.match(/(?:for|on)\s+(.+?)(?:\s+\$|\s*$)/i);
      return {
        amount: amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : undefined,
        description: descMatch?.[1]?.trim(),
      };
    },
    display: (params) => {
      const parts = ['Log expense'];
      if (params.description) parts.push(`— ${params.description}`);
      if (params.amount) parts.push(`($${params.amount})`);
      return parts.join(' ');
    },
  },

  // Add person
  {
    keywords: ['add contact', 'add person', 'add client', 'add lead', 'new contact', 'new client', 'new lead'],
    action: 'add_person',
    extract: (input) => {
      const nameMatch = input.match(/(?:named?|called?)\s+([A-Z][a-zA-Z\s]+?)(?:\s+as|\s*$)/i);
      const typeMatch = input.match(/\b(client|lead|contractor|vendor|partner)\b/i);
      return {
        name: nameMatch?.[1]?.trim(),
        type: typeMatch?.[1]?.toLowerCase() ?? 'lead',
      };
    },
    display: (params) => `Add ${params.type ?? 'contact'}${params.name ? `: ${params.name}` : ''}`,
  },

  // Agent management
  {
    keywords: ['hire agent', 'create agent', 'new agent', 'add agent'],
    action: 'create_agent',
    extract: (input) => {
      const roleMatch = input.match(/\b(sales|support|content|ops|dev|research|marketing|operations)\b/i);
      return { role: roleMatch?.[1]?.toLowerCase() };
    },
    display: (params) => `Hire ${params.role ? params.role + ' ' : ''}agent`,
  },
  {
    keywords: ['pause agent', 'stop agent', 'disable agent'],
    action: 'pause_agent',
    extract: (input) => {
      const nameMatch = input.match(/(?:pause|stop|disable)\s+(?:agent\s+)?(.+)/i);
      return { agentName: nameMatch?.[1]?.trim() };
    },
    display: (params) => `Pause ${params.agentName ?? 'agent'}`,
  },
  {
    keywords: ['resume agent', 'start agent', 'enable agent', 'unpause', 'resume all'],
    action: 'resume_agent',
    extract: (input) => {
      if (input.toLowerCase().includes('all')) return {};
      const nameMatch = input.match(/(?:resume|start|enable)\s+(?:agent\s+)?(.+)/i);
      return { agentName: nameMatch?.[1]?.trim() };
    },
    display: (params) => params.agentName ? `Resume ${params.agentName}` : 'Resume all agents',
  },

  // Budget
  {
    keywords: ['budget', 'spending limit', 'set budget', 'change budget'],
    action: 'update_budget',
    extract: (input) => {
      const amountMatch = input.match(/\$?([\d,]+(?:\.\d{2})?)/);
      const isMonthly = input.toLowerCase().includes('month');
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(',', ''));
        return isMonthly ? { monthly_limit: amount } : { daily_limit: amount };
      }
      return {};
    },
    display: (params) => {
      if (params.daily_limit) return `Set daily budget to $${params.daily_limit}`;
      if (params.monthly_limit) return `Set monthly budget to $${params.monthly_limit}`;
      return 'Update budget';
    },
  },

  // Model strategy
  {
    keywords: ['model', 'quality', 'savings', 'balanced', 'strategy'],
    patterns: [/(?:set|change|switch)\s+(?:to\s+)?(?:model\s+)?(?:strategy\s+)?(?:to\s+)?(quality|balanced|savings)/i],
    action: 'set_model_strategy',
    extract: (input) => {
      const strategyMatch = input.match(/\b(quality|balanced|savings)\b/i);
      return { strategy: strategyMatch?.[1]?.toLowerCase() ?? 'balanced' };
    },
    display: (params) => `Set model strategy to "${params.strategy}"`,
  },
];

export function parseIntent(input: string): ParsedIntent | null {
  const lower = input.toLowerCase().trim();
  if (!lower) return null;

  let bestMatch: { rule: IntentRule; score: number } | null = null;

  for (const rule of INTENT_RULES) {
    let score = 0;

    // Keyword matching
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.split(' ').length * 2; // multi-word keywords score higher
      }
    }

    // Pattern matching
    if (rule.patterns) {
      for (const pattern of rule.patterns) {
        if (pattern.test(input)) {
          score += 5;
        }
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { rule, score };
    }
  }

  if (!bestMatch) return null;

  const params = bestMatch.rule.extract(input);
  const maxPossibleScore = bestMatch.rule.keywords.length * 2 + (bestMatch.rule.patterns?.length ?? 0) * 5;
  const confidence = Math.min(1, bestMatch.score / Math.max(maxPossibleScore, 1));

  return {
    action: bestMatch.rule.action,
    params,
    confidence,
    display: bestMatch.rule.display(params),
  };
}

// ── Core Engine ──

export interface CoreResponse {
  type: 'action' | 'insight' | 'info' | 'error';
  message: string;
  action?: ActionResult;
  insights?: Insight[];
  intent?: ParsedIntent;
  navigate?: string;
}

/**
 * Process a natural language command. Algorithm-first, no AI.
 */
export async function processCommand(
  input: string,
  supabase: SupabaseClient,
  businessId: string,
): Promise<CoreResponse> {
  // Step 1: Parse intent with keyword matching
  const intent = parseIntent(input);

  if (!intent || intent.confidence < 0.2) {
    return {
      type: 'info',
      message: "I didn't understand that. Try commands like: \"create invoice for $500\", \"pause agent\", \"go to settings\", or \"show me team\".",
    };
  }

  // Step 2: Look up and execute the action
  const actionDef = ACTION_REGISTRY[intent.action];
  if (!actionDef) {
    return {
      type: 'info',
      message: `Recognized intent "${intent.action}" but no handler found.`,
      intent,
    };
  }

  // Step 3: If action needs agent ID and we only have a name, resolve it
  if (intent.params.agentName && !intent.params.agentId) {
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name')
      .eq('business_id', businessId);

    if (agents) {
      const name = (intent.params.agentName as string).toLowerCase();
      const match = agents.find(a => a.name.toLowerCase().includes(name));
      if (match) {
        intent.params.agentId = match.id;
      }
    }
  }

  // Step 4: Execute
  try {
    const result = await actionDef.execute(intent.params, supabase, businessId);
    return {
      type: 'action',
      message: result.message,
      action: result,
      intent,
      navigate: result.navigate,
    };
  } catch (err) {
    return {
      type: 'error',
      message: `Failed to execute: ${err instanceof Error ? err.message : 'Unknown error'}`,
      intent,
    };
  }
}

/**
 * Get proactive insights for a page section. Pure algorithms.
 */
export async function getInsights(
  section: string,
  supabase: SupabaseClient,
  businessId: string,
): Promise<Insight[]> {
  return analyzeForSection(section, supabase, businessId);
}

/**
 * Get a quick status summary for the header. Pure algorithm.
 */
export async function getQuickStatus(
  supabase: SupabaseClient,
  businessId: string,
): Promise<{ health: number; alerts: number; summary: string }> {
  const today = new Date().toISOString().split('T')[0];

  // Parallel queries
  const [
    { count: pendingDecisions },
    { data: overdueInvoices },
    { data: agents },
    { data: costRecords },
  ] = await Promise.all([
    supabase
      .from('decisions')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'pending'),
    supabase
      .from('invoices')
      .select('id')
      .eq('business_id', businessId)
      .eq('status', 'sent')
      .lt('due_date', today),
    supabase
      .from('agents')
      .select('status')
      .eq('business_id', businessId),
    supabase
      .from('audit_log')
      .select('cost')
      .eq('business_id', businessId)
      .gte('created_at', `${today}T00:00:00`),
  ]);

  const pending = pendingDecisions ?? 0;
  const overdue = overdueInvoices?.length ?? 0;
  const totalAgents = agents?.length ?? 0;
  const activeAgents = agents?.filter(a => a.status === 'active').length ?? 0;
  const errorAgents = agents?.filter(a => a.status === 'error').length ?? 0;
  const costToday = costRecords?.reduce((s, r) => s + (r.cost ?? 0), 0) ?? 0;

  // Health score: 100 = perfect, decreases with issues
  let health = 100;
  health -= pending * 5;       // each pending decision costs 5 points
  health -= overdue * 10;      // each overdue invoice costs 10 points
  health -= errorAgents * 15;  // each errored agent costs 15 points
  if (totalAgents > 0 && activeAgents === 0) health -= 20; // all agents paused/errored
  health = Math.max(0, Math.min(100, health));

  const alerts = pending + overdue + errorAgents;

  // Build summary
  const parts: string[] = [];
  if (pending > 0) parts.push(`${pending} pending`);
  if (overdue > 0) parts.push(`${overdue} overdue`);
  if (errorAgents > 0) parts.push(`${errorAgents} errors`);
  if (parts.length === 0) parts.push('All clear');
  const summary = `${parts.join(', ')}. $${costToday.toFixed(2)} spent today.`;

  return { health, alerts, summary };
}
