import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = "nodejs";

async function findOrderIdFromPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
  const metadataOrderId = paymentIntent.metadata?.order_id;
  if (metadataOrderId) return metadataOrderId;

  if (!paymentIntent.id) return null;
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntent.id,
    limit: 1,
  });
  return sessions.data[0]?.metadata?.order_id ?? null;
}

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  await supabase
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", orderId);
}

async function handlePaymentIntent(paymentIntent: Stripe.PaymentIntent) {
  const orderId = await findOrderIdFromPaymentIntent(paymentIntent);
  if (!orderId) return;

  await supabase
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", orderId);
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("Stripe webhook request missing signature or secret.");
    return new Response("Webhook signature / secret missing", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook verify failed:", err);
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : "Invalid payload"}`, {
      status: 400,
    });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSession(session);
    } else if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntent(paymentIntent);
    }
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    return new Response("Webhook handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
