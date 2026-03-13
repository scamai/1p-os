import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export async function createPaymentLink(
  amount: number,
  description: string,
  metadata?: Record<string, string>
): Promise<string> {
  const stripe = getStripeClient();

  const product = await stripe.products.create({
    name: description,
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
  });

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: metadata ?? {},
  });

  return paymentLink.url;
}

export async function createCheckoutSession(
  priceId: string,
  customerId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return session.url;
}
