import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PrefillInputSchema = z.object({
  form_type: z.enum(['invoice', 'expense', 'person', 'project', 'agent']),
  context_hint: z.string().max(500).optional(),
  current_section: z.string().max(100).optional(),
  related_entity_id: z.string().uuid().optional(),
});

interface Suggestion {
  value: string | number;
  confidence: number;
}

// Deterministic prefill — no AI needed.
// Just query recent data and return the most likely defaults.

async function prefillInvoice(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
): Promise<Record<string, Suggestion>> {
  const suggestions: Record<string, Suggestion> = {};

  // Most recent client
  const { data: recentInvoice } = await supabase
    .from('invoices')
    .select('client_name, client_email, amount')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recentInvoice) {
    if (recentInvoice.client_name) {
      suggestions.client_name = { value: recentInvoice.client_name, confidence: 0.5 };
    }
    if (recentInvoice.client_email) {
      suggestions.client_email = { value: recentInvoice.client_email, confidence: 0.5 };
    }
  }

  // Default due date: 30 days from now
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  suggestions.due_date = { value: dueDate.toISOString().split('T')[0], confidence: 0.8 };

  return suggestions;
}

async function prefillExpense(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
): Promise<Record<string, Suggestion>> {
  const suggestions: Record<string, Suggestion> = {};

  // Most common category
  const { data: expenses } = await supabase
    .from('expenses')
    .select('category')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (expenses?.length) {
    const counts: Record<string, number> = {};
    for (const e of expenses) {
      if (e.category) counts[e.category] = (counts[e.category] ?? 0) + 1;
    }
    const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      suggestions.category = { value: topCategory[0], confidence: 0.6 };
    }
  }

  // Default date: today
  suggestions.date = { value: new Date().toISOString().split('T')[0], confidence: 0.9 };

  return suggestions;
}

async function prefillPerson(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  _businessId: string,
): Promise<Record<string, Suggestion>> {
  // No useful prefill for adding a new person — return empty
  return {
    type: { value: 'client', confidence: 0.4 },
  };
}

async function prefillProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
): Promise<Record<string, Suggestion>> {
  const suggestions: Record<string, Suggestion> = {};

  // Suggest most recent client as project client
  const { data: client } = await supabase
    .from('relationships')
    .select('name')
    .eq('business_id', businessId)
    .eq('type', 'client')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (client?.name) {
    suggestions.client = { value: client.name, confidence: 0.4 };
  }

  return suggestions;
}

async function prefillAgent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
): Promise<Record<string, Suggestion>> {
  // Check which roles already exist
  const { data: agents } = await supabase
    .from('agents')
    .select('role')
    .eq('business_id', businessId);

  const existingRoles = new Set(agents?.map(a => a.role?.toLowerCase()) ?? []);
  const allRoles = ['sales', 'customer support', 'content & marketing', 'operations', 'finance', 'development'];
  const missing = allRoles.find(r => !existingRoles.has(r));

  if (missing) {
    return { role: { value: missing, confidence: 0.5 } };
  }

  return {};
}

const PREFILL_HANDLERS: Record<string, (
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
) => Promise<Record<string, Suggestion>>> = {
  invoice: prefillInvoice,
  expense: prefillExpense,
  person: prefillPerson,
  project: prefillProject,
  agent: prefillAgent,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = PrefillInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { form_type } = parsed.data;

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ suggestions: {} }, { status: 200 });
    }

    const handler = PREFILL_HANDLERS[form_type];
    const suggestions = handler ? await handler(supabase, business.id) : {};

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    console.error('[ai/prefill] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
