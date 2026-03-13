import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[webhooks/stripe] Signature verification failed:', message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceId = session.metadata?.invoice_id;
        const businessId = session.metadata?.business_id;

        if (session.mode === 'subscription' && businessId) {
          // Handle subscription activation
          await supabase
            .from('businesses')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: 'active',
            })
            .eq('id', businessId);

          await supabase.from('audit_log').insert({
            business_id: businessId,
            actor: 'system:stripe',
            action: 'subscription_activated',
            details: {
              customer_id: session.customer,
              subscription_id: session.subscription,
            },
          });
        }

        if (invoiceId) {
          // Handle invoice payment completion
          await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              stripe_session_id: session.id,
            })
            .eq('id', invoiceId);

          // Get business_id from invoice for audit log
          const { data: invoice } = await supabase
            .from('invoices')
            .select('business_id')
            .eq('id', invoiceId)
            .single();

          if (invoice) {
            await supabase.from('audit_log').insert({
              business_id: invoice.business_id,
              actor: 'system:stripe',
              action: 'invoice_paid',
              details: {
                invoice_id: invoiceId,
                amount: session.amount_total,
                customer_email: session.customer_details?.email,
              },
            });
          }
        }
        break;
      }

      case 'invoice.paid': {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        const customerId = stripeInvoice.customer as string;

        // Find business by Stripe customer ID
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (business) {
          await supabase.from('audit_log').insert({
            business_id: business.id,
            actor: 'system:stripe',
            action: 'recurring_payment_received',
            details: {
              amount: stripeInvoice.amount_paid,
              currency: stripeInvoice.currency,
              invoice_number: stripeInvoice.number,
            },
          });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata?.invoice_id;

        if (invoiceId) {
          await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: paymentIntent.id,
            })
            .eq('id', invoiceId);

          const { data: invoice } = await supabase
            .from('invoices')
            .select('business_id, amount, client_name')
            .eq('id', invoiceId)
            .single();

          if (invoice) {
            await supabase.from('audit_log').insert({
              business_id: invoice.business_id,
              actor: 'system:stripe',
              action: 'payment_received',
              details: {
                invoice_id: invoiceId,
                amount: invoice.amount,
                client_name: invoice.client_name,
                payment_intent_id: paymentIntent.id,
              },
            });
          }
        }
        break;
      }

      default:
        // Unhandled event type - log but don't error
        console.log(`[webhooks/stripe] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[webhooks/stripe] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
