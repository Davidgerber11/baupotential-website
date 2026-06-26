import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);
const MAIL_FROM = process.env.RESEND_FROM ?? "Lota <onboarding@resend.dev>";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "info@lota-solutions.ch";

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

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      stripe_session_id: session.id,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .select("id, name, email, parcel_number, municipality");

  if (error) {
    console.error("Supabase order update failed:", error);
    return;
  }

  const justPaid = data?.[0];
  if (!justPaid) return;

  await sendConfirmationEmail({
    to: justPaid.email ?? session.customer_email ?? session.customer_details?.email ?? null,
    name: justPaid.name ?? null,
    parcelNumber: justPaid.parcel_number ?? session.metadata?.parcel_number ?? null,
    municipality: justPaid.municipality ?? session.metadata?.municipality ?? null,
  });
}

async function sendConfirmationEmail(opts: {
  to: string | null;
  name: string | null;
  parcelNumber: string | null;
  municipality: string | null;
}) {
  if (!opts.to) {
    console.warn("Skipping confirmation email: no recipient address.");
    return;
  }

  const greetingName = opts.name?.trim() || "Hallo";
  const parcelLine =
    opts.parcelNumber && opts.municipality
      ? `<strong>Parzelle ${escapeHtml(opts.parcelNumber)}, ${escapeHtml(opts.municipality)}</strong>`
      : "deiner Parzelle";

  try {
    await resend.emails.send({
      from: MAIL_FROM,
      to: opts.to,
      bcc: SUPPORT_EMAIL,
      subject: "Bestellbestätigung – Baupotentialanalyse",
      html: `
        <p>${escapeHtml(greetingName)},</p>
        <p>vielen Dank für deine Bestellung. Wir haben deine Zahlung erhalten.</p>
        <p>Unser Team analysiert nun ${parcelLine} und sendet dir die fertige Baupotentialanalyse als PDF innerhalb von 24 Stunden per E-Mail.</p>
        <p>Bei Fragen erreichst du uns jederzeit unter
          <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.
        </p>
        <p>Herzliche Grüsse<br/>Lota</p>
      `,
    });
  } catch (err) {
    console.error("Confirmation email failed:", err);
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
