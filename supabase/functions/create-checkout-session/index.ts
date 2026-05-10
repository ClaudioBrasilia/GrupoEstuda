import Stripe from 'https://esm.sh/stripe@14.25.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const basicMonthlyPriceId = Deno.env.get('STRIPE_PRICE_BASIC_MONTHLY');
    const basicYearlyPriceId = Deno.env.get('STRIPE_PRICE_BASIC_YEARLY');
    const premiumMonthlyPriceId = Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY');
    const premiumYearlyPriceId = Deno.env.get('STRIPE_PRICE_PREMIUM_YEARLY');
    const siteUrl = Deno.env.get('SITE_URL');

    if (!stripeSecretKey || !siteUrl) {
      return new Response(
        JSON.stringify({ error: 'Stripe indisponível. Configure STRIPE_SECRET_KEY e SITE_URL.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { plan, billingCycle } = await req.json();
    if (!['basic', 'premium'].includes(plan) || !['monthly', 'yearly'].includes(billingCycle)) {
      return new Response(JSON.stringify({ error: 'Parâmetros inválidos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const priceMap: Record<string, string | undefined> = {
      basic_monthly: basicMonthlyPriceId,
      basic_yearly: basicYearlyPriceId,
      premium_monthly: premiumMonthlyPriceId,
      premium_yearly: premiumYearlyPriceId,
    };

    const selectedPriceId = priceMap[`${plan}_${billingCycle}`];
    if (!selectedPriceId) {
      return new Response(
        JSON.stringify({ error: `Preço Stripe não configurado para ${plan} (${billingCycle}).` }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: existingCustomer } = await serviceSupabase
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-04-10' });

    let stripeCustomerId = existingCustomer?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      await serviceSupabase.from('billing_customers').upsert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: selectedPriceId, quantity: 1 }],
      success_url: `${siteUrl}/my-plan?checkout=success`,
      cancel_url: `${siteUrl}/plans?checkout=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        plan,
        billingCycle,
      },
    });

    return new Response(JSON.stringify({ checkoutUrl: checkoutSession.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
