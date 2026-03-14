import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const SendInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = SendInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { invoiceId } = parsed.data;

    // Get invoice and verify ownership
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*, businesses!inner(user_id, name)')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.businesses.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice already paid' },
        { status: 409 }
      );
    }

    // Create Stripe payment link
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice from ${invoice.businesses.name}`,
              description: invoice.description,
            },
            unit_amount: Math.round(invoice.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoice_id: invoiceId,
        business_id: invoice.business_id,
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceId}/paid`,
        },
      },
    });

    // Update invoice with payment link
    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'sent',
        payment_link: paymentLink.url,
        stripe_payment_link_id: paymentLink.id,
        sent_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError) {
      console.error('[invoices/send] Failed to update invoice:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { invoice: updated, paymentLink: paymentLink.url },
      { status: 200 }
    );
  } catch (error) {
    console.error('[invoices/send] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
