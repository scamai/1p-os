import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const SectionSchema = z.enum(['hq', 'finance', 'sales', 'crm', 'work', 'team', 'vault']);

// Template-based summaries — no AI needed.
// The data already tells the story; just format it.

function formatCurrency(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString()}`;
}

async function generateSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  section: string,
): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  switch (section) {
    case 'hq': {
      const { count: pendingDecisions } = await supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'pending');

      const { data: recentActivity } = await supabase
        .from('audit_log')
        .select('action')
        .eq('business_id', businessId)
        .gte('created_at', `${today}T00:00:00`)
        .limit(100);

      const actions = recentActivity?.length ?? 0;
      const pending = pendingDecisions ?? 0;

      if (pending === 0 && actions === 0) return 'All quiet. No pending decisions.';
      if (pending === 0) return `${actions} agent actions today. Nothing needs your attention.`;
      return `${pending} decision${pending > 1 ? 's' : ''} pending. ${actions} agent actions today.`;
    }

    case 'finance': {
      const { data: paidInvoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('business_id', businessId)
        .eq('status', 'paid');

      const revenue = paidInvoices?.reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0;

      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('business_id', businessId)
        .eq('status', 'sent')
        .lt('due_date', today);

      const overdue = overdueInvoices?.length ?? 0;
      const overdueAmt = overdueInvoices?.reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0;

      const parts: string[] = [`${formatCurrency(revenue)} revenue`];
      if (overdue > 0) parts.push(`${overdue} overdue (${formatCurrency(overdueAmt)})`);
      return parts.join('. ') + '.';
    }

    case 'sales': {
      const { data: leads } = await supabase
        .from('relationships')
        .select('type')
        .eq('business_id', businessId)
        .eq('type', 'lead');

      const leadCount = leads?.length ?? 0;
      if (leadCount === 0) return 'No active leads.';
      return `${leadCount} active lead${leadCount > 1 ? 's' : ''} in pipeline.`;
    }

    case 'crm': {
      const { data: relationships } = await supabase
        .from('relationships')
        .select('type')
        .eq('business_id', businessId);

      const total = relationships?.length ?? 0;
      if (total === 0) return 'No contacts yet.';

      const counts: Record<string, number> = {};
      relationships?.forEach((r) => { counts[r.type] = (counts[r.type] ?? 0) + 1; });
      const parts = Object.entries(counts).map(([t, c]) => `${c} ${t}${c > 1 ? 's' : ''}`);
      return `${total} contacts: ${parts.join(', ')}.`;
    }

    case 'work': {
      const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'active');

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { count: milestones } = await supabase
        .from('milestones')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('due_date', today)
        .lte('due_date', nextWeek.toISOString().split('T')[0]);

      const active = activeProjects ?? 0;
      const upcoming = milestones ?? 0;
      if (active === 0) return 'No active projects.';
      return `${active} active project${active > 1 ? 's' : ''}. ${upcoming} milestone${upcoming !== 1 ? 's' : ''} this week.`;
    }

    case 'team': {
      const { data: agents } = await supabase
        .from('agents')
        .select('status')
        .eq('business_id', businessId);

      const total = agents?.length ?? 0;
      const active = agents?.filter((a) => a.status === 'active').length ?? 0;

      const { data: costRecords } = await supabase
        .from('audit_log')
        .select('cost')
        .eq('business_id', businessId)
        .gte('created_at', `${today}T00:00:00`);

      const costToday = costRecords?.reduce((s, r) => s + (r.cost ?? 0), 0) ?? 0;

      if (total === 0) return 'No agents hired yet.';
      return `${total} agent${total > 1 ? 's' : ''} (${active} active). $${costToday.toFixed(2)} spent today.`;
    }

    case 'vault': {
      const { count: docs } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);

      const { count: expiring } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('type', 'contract')
        .gte('expiry_date', today)
        .lte('expiry_date', thirtyDays.toISOString().split('T')[0]);

      const docCount = docs ?? 0;
      const expiringCount = expiring ?? 0;
      if (docCount === 0) return 'No documents yet.';
      const parts = [`${docCount} document${docCount > 1 ? 's' : ''}`];
      if (expiringCount > 0) parts.push(`${expiringCount} contract${expiringCount > 1 ? 's' : ''} expiring in 30 days`);
      return parts.join('. ') + '.';
    }

    default:
      return 'No data available.';
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sectionParsed = SectionSchema.safeParse(searchParams.get('section'));
    if (!sectionParsed.success) {
      return NextResponse.json(
        { error: 'Invalid section. Must be one of: hq, finance, sales, people, work, team, vault' },
        { status: 400 }
      );
    }

    const section = sectionParsed.data;

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const summary = await generateSummary(supabase, business.id, section);
    return NextResponse.json({ summary, section }, { status: 200 });
  } catch (error) {
    console.error('[ai/summary] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
