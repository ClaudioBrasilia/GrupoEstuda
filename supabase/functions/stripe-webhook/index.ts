import Stripe from 'https://esm.sh/stripe@14.25.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const toPlan = (priceId: string): 'basic' | 'premium' | 'free' => {
  const basicPriceIds = [
    Deno.env.get('STRIPE_PRICE_BASIC_MONTHLY'),
    Deno.env.get('STRIPE_PRICE_BASIC_YEARLY'),
  ].filter(Boolean);
  const premiumPriceIds = [
    Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY'),
    Deno.env.get('STRIPE_PRICE_PREMIUM_YEARLY'),
  ].filter(Boolean);

  if (basicPriceIds.includes(priceId)) return 'basic';
  if (premiumPriceIds.includes(priceId)) return 'premium';
  return 'free';
};

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !stripeWebhookSecret || !supabaseUrl || !serviceRoleKey) {
      return new Response('Webhook not configured', { status: 503 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-04-10' });
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('Missing signature', { status: 400 });
    }

    const event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
      const customerId = typeof session.customer === 'string' ? session.customer : null;

      if (userId && subscriptionId && customerId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId ? toPlan(priceId) : 'free';

        await supabase.from('billing_customers').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
        });

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          status: subscription.status,
          plan,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        }, { onConflict: 'user_id' });

        await supabase.from('profiles').update({ plan }).eq('id', userId);
      }
    }

    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;
      if (!customerId) {
        return new Response('ok', { status: 200 });
      }

      const { data: billingCustomer } = await supabase
        .from('billing_customers')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

      if (billingCustomer?.user_id) {
        const priceId = subscription.items.data[0]?.price?.id;
        const activePlan = subscription.status === 'active' || subscription.status === 'trialing'
          ? toPlan(priceId)
          : 'free';

        await supabase.from('subscriptions').upsert({
          user_id: billingCustomer.user_id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          status: subscription.status,
          plan: activePlan,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        }, { onConflict: 'user_id' });

        await supabase.from('profiles').update({ plan: activePlan }).eq('id', billingCustomer.user_id);
      }
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Webhook error', { status: 400 });
  }
});
