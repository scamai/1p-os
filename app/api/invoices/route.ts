import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const CreateInvoiceSchema = z.object({
  client_name: z.string().min(1).max(200),
  client_email: z.string().email(),
  amount: z.number().positive(),
  description: z.string().min(1).max(2000),
  due_date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: 'No business found' },
        { status: 404 }
      );
    }

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[invoices] Failed to fetch invoices:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoices }, { status: 200 });
  } catch (error) {
    console.error('[invoices] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Get user's business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: 'No business found' },
        { status: 404 }
      );
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        business_id: business.id,
        client_name: parsed.data.client_name,
        client_email: parsed.data.client_email,
        amount: parsed.data.amount,
        description: parsed.data.description,
        due_date: parsed.data.due_date,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('[invoices] Failed to create invoice:', error);
      return NextResponse.json(
        { error: 'Failed to create invoice', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error('[invoices] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
