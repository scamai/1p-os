import type { SupabaseClient } from '@supabase/supabase-js';
import { logAudit } from '@/lib/safety/audit-logger';

/**
 * Automation Rules — deterministic business logic that runs on triggers.
 * No AI calls. Just if/then rules that execute actions.
 */

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: 'schedule' | 'event' | 'threshold';
  condition: (context: AutomationContext) => boolean;
  execute: (context: AutomationContext, supabase: SupabaseClient) => Promise<AutomationResult>;
}

interface AutomationContext {
  businessId: string;
  agents: Array<{ id: string; name: string; status: string; role: string }>;
  pendingDecisions: number;
  overdueInvoices: number;
  costToday: number;
  dailyBudget: number;
}

interface AutomationResult {
  action: string;
  message: string;
  success: boolean;
}

// ── Built-in automation rules ──

const RULES: AutomationRule[] = [
  {
    id: 'auto-follow-up-overdue',
    name: 'Auto follow-up overdue invoices',
    description: 'When an invoice is 7+ days overdue, create a decision card to send a follow-up.',
    trigger: 'schedule',
    condition: (ctx) => ctx.overdueInvoices > 0,
    execute: async (ctx, supabase) => {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

      const { data: overdue } = await supabase
        .from('invoices')
        .select('id, client_name, amount, due_date')
        .eq('business_id', ctx.businessId)
        .eq('status', 'sent')
        .lt('due_date', sevenDaysAgo);

      if (!overdue || overdue.length === 0) {
        return { action: 'none', message: 'No invoices overdue 7+ days', success: true };
      }

      // Create a decision card for the owner
      for (const invoice of overdue) {
        await supabase.from('decision_cards').insert({
          business_id: ctx.businessId,
          type: 'follow_up',
          title: `Follow up on overdue invoice — ${invoice.client_name} ($${invoice.amount})`,
          description: `Invoice due ${invoice.due_date}, now ${Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / 86400000)} days overdue.`,
          status: 'pending',
          options: JSON.stringify([
            { label: 'Send reminder', value: 'send_reminder' },
            { label: 'Dismiss', value: 'dismiss' },
          ]),
          metadata: { invoice_id: invoice.id },
        });
      }

      await logAudit({
        businessId: ctx.businessId,
        actor: 'core:automation',
        action: 'auto_follow_up_created',
        success: true,
        metadata: { invoiceCount: overdue.length },
      }, supabase);

      return {
        action: 'create_decision',
        message: `Created follow-up decisions for ${overdue.length} overdue invoice${overdue.length > 1 ? 's' : ''}`,
        success: true,
      };
    },
  },

  {
    id: 'auto-pause-over-budget',
    name: 'Auto-pause agents when budget exceeded',
    description: 'When daily cost exceeds 100% of budget, pause non-essential agents.',
    trigger: 'threshold',
    condition: (ctx) => ctx.costToday > ctx.dailyBudget,
    execute: async (ctx, supabase) => {
      // Pause low-priority agents (not sales or support)
      const toPause = ctx.agents.filter(
        a => a.status === 'active' && !['sales', 'customer-support'].includes(a.role)
      );

      if (toPause.length === 0) {
        return { action: 'none', message: 'No non-essential agents to pause', success: true };
      }

      const ids = toPause.map(a => a.id);
      await supabase
        .from('agents')
        .update({ status: 'paused' })
        .in('id', ids);

      await logAudit({
        businessId: ctx.businessId,
        actor: 'core:automation',
        action: 'auto_pause_budget',
        success: true,
        metadata: { pausedAgents: toPause.map(a => a.name) },
      }, supabase);

      return {
        action: 'pause_agents',
        message: `Paused ${toPause.length} non-essential agent${toPause.length > 1 ? 's' : ''} (budget exceeded)`,
        success: true,
      };
    },
  },

  {
    id: 'auto-resume-morning',
    name: 'Auto-resume agents each morning',
    description: 'Resume budget-paused agents at the start of each day when budget resets.',
    trigger: 'schedule',
    condition: (ctx) => {
      const hour = new Date().getHours();
      return hour >= 8 && hour <= 9 && ctx.costToday < ctx.dailyBudget * 0.1;
    },
    execute: async (ctx, supabase) => {
      const paused = ctx.agents.filter(a => a.status === 'paused');
      if (paused.length === 0) {
        return { action: 'none', message: 'No paused agents', success: true };
      }

      const ids = paused.map(a => a.id);
      await supabase
        .from('agents')
        .update({ status: 'active' })
        .in('id', ids);

      await logAudit({
        businessId: ctx.businessId,
        actor: 'core:automation',
        action: 'auto_resume_morning',
        success: true,
        metadata: { resumedAgents: paused.map(a => a.name) },
      }, supabase);

      return {
        action: 'resume_agents',
        message: `Resumed ${paused.length} agent${paused.length > 1 ? 's' : ''} for the day`,
        success: true,
      };
    },
  },
];

/**
 * Run all applicable automation rules. Called on a schedule or by the core.
 */
export async function runAutomation(
  supabase: SupabaseClient,
  businessId: string,
): Promise<AutomationResult[]> {
  const today = new Date().toISOString().split('T')[0];

  // Build context
  const [
    { data: agents },
    { count: pendingDecisions },
    { data: overdueInvoices },
    { data: costRecords },
    { data: safetyConfig },
  ] = await Promise.all([
    supabase.from('agents').select('id, name, status, role').eq('business_id', businessId),
    supabase.from('decision_cards').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'pending'),
    supabase.from('invoices').select('id').eq('business_id', businessId).eq('status', 'sent').lt('due_date', today),
    supabase.from('audit_log').select('cost').eq('business_id', businessId).gte('created_at', `${today}T00:00:00`),
    supabase.from('safety_config').select('global_daily_budget').eq('business_id', businessId).single(),
  ]);

  const context: AutomationContext = {
    businessId,
    agents: agents ?? [],
    pendingDecisions: pendingDecisions ?? 0,
    overdueInvoices: overdueInvoices?.length ?? 0,
    costToday: costRecords?.reduce((s, r) => s + (r.cost ?? 0), 0) ?? 0,
    dailyBudget: safetyConfig?.global_daily_budget ?? 20,
  };

  // Run matching rules
  const results: AutomationResult[] = [];
  for (const rule of RULES) {
    if (rule.condition(context)) {
      try {
        const result = await rule.execute(context, supabase);
        results.push(result);
      } catch (err) {
        results.push({
          action: rule.id,
          message: `Rule "${rule.name}" failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          success: false,
        });
      }
    }
  }

  return results;
}

export { RULES as AUTOMATION_RULES };
