import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Business Analyzer — pure algorithmic analysis, zero AI calls.
 * Computes insights, alerts, and recommendations from raw data.
 */

export interface Insight {
  id: string;
  type: 'alert' | 'suggestion' | 'metric' | 'status';
  priority: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  action?: {
    id: string;
    label: string;
    params: Record<string, unknown>;
  };
  section: string; // which page this insight is relevant to
}

export async function analyzeForSection(
  section: string,
  supabase: SupabaseClient,
  businessId: string,
): Promise<Insight[]> {
  const insights: Insight[] = [];
  const today = new Date().toISOString().split('T')[0];

  switch (section) {
    case 'hq':
    case 'all': {
      // Pending decisions
      const { count: pendingDecisions } = await supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'pending');

      if ((pendingDecisions ?? 0) > 0) {
        insights.push({
          id: 'pending-decisions',
          type: 'alert',
          priority: 'high',
          title: `${pendingDecisions} pending decision${(pendingDecisions ?? 0) > 1 ? 's' : ''}`,
          detail: 'Your agents are waiting for your approval to proceed.',
          action: { id: 'navigate', label: 'Review', params: { page: '/' } },
          section: 'hq',
        });
      }

      // Overdue invoices
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id, client_name, amount, due_date')
        .eq('business_id', businessId)
        .eq('status', 'sent')
        .lt('due_date', today);

      if (overdueInvoices && overdueInvoices.length > 0) {
        const total = overdueInvoices.reduce((s, i) => s + (i.amount ?? 0), 0);
        insights.push({
          id: 'overdue-invoices',
          type: 'alert',
          priority: 'high',
          title: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} ($${total.toLocaleString()})`,
          detail: overdueInvoices.map(i => `${i.client_name}: $${i.amount}`).join(', '),
          action: { id: 'navigate', label: 'View', params: { page: '/finance' } },
          section: 'finance',
        });
      }

      // Budget alert
      const { data: safetyConfig } = await supabase
        .from('safety_config')
        .select('global_daily_budget, global_monthly_budget')
        .eq('business_id', businessId)
        .single();

      const { data: costRecords } = await supabase
        .from('audit_log')
        .select('cost')
        .eq('business_id', businessId)
        .gte('created_at', `${today}T00:00:00`);

      const costToday = costRecords?.reduce((s, r) => s + (r.cost ?? 0), 0) ?? 0;
      const dailyBudget = safetyConfig?.global_daily_budget ?? 20;

      if (costToday > dailyBudget * 0.8) {
        insights.push({
          id: 'budget-warning',
          type: 'alert',
          priority: costToday >= dailyBudget ? 'high' : 'medium',
          title: costToday >= dailyBudget ? 'Daily budget exceeded' : 'Approaching daily budget',
          detail: `$${costToday.toFixed(2)} of $${dailyBudget} used today.`,
          action: { id: 'navigate', label: 'Settings', params: { page: '/settings' } },
          section: 'hq',
        });
      }

      // Agent health
      const { data: agents } = await supabase
        .from('agents')
        .select('id, name, status')
        .eq('business_id', businessId);

      const paused = agents?.filter(a => a.status === 'paused') ?? [];
      const errored = agents?.filter(a => a.status === 'error') ?? [];

      if (errored.length > 0) {
        insights.push({
          id: 'agent-errors',
          type: 'alert',
          priority: 'high',
          title: `${errored.length} agent${errored.length > 1 ? 's' : ''} in error state`,
          detail: errored.map(a => a.name).join(', '),
          action: { id: 'navigate', label: 'View', params: { page: '/team' } },
          section: 'team',
        });
      }

      if (paused.length > 0) {
        insights.push({
          id: 'agents-paused',
          type: 'status',
          priority: 'low',
          title: `${paused.length} agent${paused.length > 1 ? 's' : ''} paused`,
          detail: paused.map(a => a.name).join(', '),
          action: { id: 'resume_agent', label: 'Resume All', params: {} },
          section: 'team',
        });
      }

      // No agents yet
      if (!agents || agents.length === 0) {
        insights.push({
          id: 'no-agents',
          type: 'suggestion',
          priority: 'high',
          title: 'Hire your first agent',
          detail: 'Agents handle tasks like invoicing, support, and sales automatically.',
          action: { id: 'navigate', label: 'Browse', params: { page: '/talent' } },
          section: 'team',
        });
      }

      // Upcoming deadlines (next 3 days)
      const threeDays = new Date();
      threeDays.setDate(threeDays.getDate() + 3);
      const { data: urgentDeadlines } = await supabase
        .from('deadlines')
        .select('title, due_date')
        .eq('business_id', businessId)
        .eq('status', 'pending')
        .gte('due_date', today)
        .lte('due_date', threeDays.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(5);

      if (urgentDeadlines && urgentDeadlines.length > 0) {
        insights.push({
          id: 'urgent-deadlines',
          type: 'alert',
          priority: 'medium',
          title: `${urgentDeadlines.length} deadline${urgentDeadlines.length > 1 ? 's' : ''} in the next 3 days`,
          detail: urgentDeadlines.map(d => d.title).join(', '),
          action: { id: 'navigate', label: 'View', params: { page: '/work' } },
          section: 'work',
        });
      }

      // Revenue insight
      const { data: paidInvoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('business_id', businessId)
        .eq('status', 'paid');

      const totalRevenue = paidInvoices?.reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0;
      if (totalRevenue > 0) {
        insights.push({
          id: 'revenue-total',
          type: 'metric',
          priority: 'low',
          title: `$${totalRevenue.toLocaleString()} total revenue collected`,
          detail: `From ${paidInvoices?.length ?? 0} paid invoice${(paidInvoices?.length ?? 0) !== 1 ? 's' : ''}.`,
          section: 'finance',
        });
      }

      if (section !== 'all') break;
      // fall through for 'all'
    }

    // eslint-disable-next-line no-fallthrough
    case 'finance': {
      if (section === 'finance') {
        const { data: unpaidInvoices } = await supabase
          .from('invoices')
          .select('client_name, amount, due_date, status')
          .eq('business_id', businessId)
          .in('status', ['draft', 'sent']);

        const drafts = unpaidInvoices?.filter(i => i.status === 'draft') ?? [];
        if (drafts.length > 0) {
          insights.push({
            id: 'draft-invoices',
            type: 'suggestion',
            priority: 'medium',
            title: `${drafts.length} draft invoice${drafts.length > 1 ? 's' : ''} to send`,
            detail: drafts.map(d => `${d.client_name}: $${d.amount}`).join(', '),
            section: 'finance',
          });
        }
      }
      break;
    }

    case 'team': {
      const { data: agents } = await supabase
        .from('agents')
        .select('id, name, role, status, tasks_completed')
        .eq('business_id', businessId);

      if (agents && agents.length > 0) {
        const idle = agents.filter(a => a.status === 'active' && (a.tasks_completed ?? 0) === 0);
        if (idle.length > 0) {
          insights.push({
            id: 'idle-agents',
            type: 'suggestion',
            priority: 'low',
            title: `${idle.length} agent${idle.length > 1 ? 's have' : ' has'} no completed tasks`,
            detail: `${idle.map(a => a.name).join(', ')} — try sending them a message.`,
            action: { id: 'navigate', label: 'Go', params: { page: '/team' } },
            section: 'team',
          });
        }
      }
      break;
    }

    case 'people': {
      const { data: relationships } = await supabase
        .from('relationships')
        .select('id, name, type, updated_at')
        .eq('business_id', businessId)
        .order('updated_at', { ascending: true })
        .limit(5);

      if (relationships && relationships.length > 0) {
        const stale = relationships.filter(r => {
          const updated = new Date(r.updated_at);
          const daysSince = (Date.now() - updated.getTime()) / 86400000;
          return daysSince > 30;
        });
        if (stale.length > 0) {
          insights.push({
            id: 'stale-contacts',
            type: 'suggestion',
            priority: 'low',
            title: `${stale.length} contact${stale.length > 1 ? 's' : ''} not updated in 30+ days`,
            detail: stale.map(r => r.name).join(', '),
            section: 'people',
          });
        }
      }
      break;
    }

    case 'work': {
      const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'active');

      if ((activeProjects ?? 0) === 0) {
        insights.push({
          id: 'no-projects',
          type: 'suggestion',
          priority: 'medium',
          title: 'No active projects',
          detail: 'Create a project to start tracking work and deadlines.',
          action: { id: 'navigate', label: 'Create', params: { page: '/work' } },
          section: 'work',
        });
      }
      break;
    }

    default:
      break;
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights;
}
