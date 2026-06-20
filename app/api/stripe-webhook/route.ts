// app/api/stripe-webhook/route.ts
//
// Stripe-Webhook, der die bezahlte Bestellung erfuellt:
//   1. Signatur verifizieren (Stripe-Standard).
//   2. Auf checkout.session.completed Metadata auslesen.
//   3. Engine aufrufen (Slug + Parzellennummer) -> PDF + Kurzanalyse.
//   4. Resend-Mail mit PDF-Attachment an die zahlende Kundin.
//   5. Supabase-Order-Row auf payment_status "paid" setzen.
//
// Stripe-Setup im Dashboard:
//   Endpoints -> Add endpoint
//   URL:       https://www.lota-solutions.ch/api/stripe-webhook
//   Events:    checkout.session.completed
//   Der daraus generierte "Signing secret" (whsec_...) gehoert als
//   STRIPE_WEBHOOK_SECRET in Vercels Env-Vars.

import Stripe from "stripe";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

import {
  fetchEngineAnalysis,
  fetchEnginePdf,
  municipalityToSlug,
} from "@/lib/engine";

// Stripe verlangt den Raw-Body fuer die Signaturpruefung -> Body nicht parsen.
// Default-Runtime in Next.js 16 fuer Route-Handler ist "nodejs"; wir setzen
// "dynamic = force-dynamic", damit Vercel nichts cached.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

// Supabase mit Service-Role-Key waere fuer Schreibzugriffe sauberer, aber
// solange `orders.payment_status` per Anon-Key UPDATE-bar ist (RLS), reicht
// der Anon-Key. Falls Davids RLS strenger wird, hier auf Service-Role wechseln.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Resend braucht eine verifizierte Absender-Domain fuer produktiven Versand.
// Bis "lota-solutions.ch" in Resend verifiziert ist, fallen wir auf die
// Sandbox-Adresse zurueck.
const MAIL_FROM =
  process.env.RESEND_FROM ?? "Lota <onboarding@resend.dev>";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET ist nicht gesetzt");
    return new Response("Webhook secret nicht konfiguriert", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Fehlende Stripe-Signatur", { status: 400 });
  }

  // Raw-Body fuer Signaturpruefung (Stripe verifiziert ueber den exakten Bytes-Body).
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe-Signatur ungueltig:", message);
    return new Response(`Signatur ungueltig: ${message}`, { status: 400 });
  }

  // Aktuell ist nur checkout.session.completed relevant. Andere Events einfach
  // mit 200 quittieren, sonst stuft Stripe den Endpoint als "failing" ein.
  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  await fulfillOrder(session).catch((err) => {
    // Wir loggen den Fehler, geben Stripe aber 200 zurueck -> Stripe wiederholt
    // sonst stundenlang, was bei dauerhaften Fehlern (z. B. Engine kennt die
    // Gemeinde nicht) nur Rauschen erzeugt. Wir benachrichtigen Yves stattdessen.
    console.error("Auftrags-Erfuellung fehlgeschlagen:", err);
    notifySupportFailure(session, err).catch((notifyErr) => {
      console.error("Support-Benachrichtigung fehlgeschlagen:", notifyErr);
    });
  });

  return Response.json({ received: true });
}

async function fulfillOrder(session: Stripe.Checkout.Session): Promise<void> {
  const meta = session.metadata ?? {};
  const orderId = meta.order_id ?? "";
  const parcelNumber = meta.parcel_number ?? "";
  const municipalityName = meta.municipality ?? "";
  const customerEmail = session.customer_email ?? session.customer_details?.email;

  if (!customerEmail) {
    throw new Error(`Session ${session.id} hat keine customer_email`);
  }
  if (!parcelNumber) {
    throw new Error(`Session ${session.id} hat keine parcel_number in metadata`);
  }

  const slug = municipalityToSlug(municipalityName);
  if (!slug) {
    throw new Error(
      `Gemeinde "${municipalityName}" wird von der Engine nicht unterstuetzt (Session ${session.id})`,
    );
  }

  // Engine-Aufrufe parallel — beide brauchen ein paar Sekunden.
  const [pdfBuffer, analysis] = await Promise.all([
    fetchEnginePdf(slug, parcelNumber),
    fetchEngineAnalysis(slug, parcelNumber).catch(() => null),
  ]);

  await sendReportEmail({
    to: customerEmail,
    pdf: pdfBuffer,
    parcelNumber,
    municipalityName,
    analysis,
  });

  if (orderId) {
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", orderId);
    if (error) {
      // Nicht-fatal — Mail ist raus, der wichtige Schritt ist erledigt.
      console.error(`Supabase-Update fuer Order ${orderId} fehlgeschlagen:`, error);
    }
  }
}

type ReportArgs = {
  to: string;
  pdf: Buffer;
  parcelNumber: string;
  municipalityName: string;
  analysis: Awaited<ReturnType<typeof fetchEngineAnalysis>> | null;
};

async function sendReportEmail({
  to,
  pdf,
  parcelNumber,
  municipalityName,
  analysis,
}: ReportArgs): Promise<void> {
  const filename = `Baupotential_${slugifyForFilename(municipalityName)}_${parcelNumber}.pdf`;

  const summaryHtml = analysis
    ? renderAnalysisSummaryHtml(analysis)
    : "";

  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject: `Ihre Baupotenzialanalyse — ${municipalityName} ${parcelNumber}`,
    html: `
      <p>Vielen Dank fuer Ihre Bestellung.</p>
      <p>Im Anhang finden Sie die Baupotenzialanalyse fuer Parzelle
      <strong>${escapeHtml(parcelNumber)}</strong> in
      <strong>${escapeHtml(municipalityName)}</strong>.</p>
      ${summaryHtml}
      <p style="margin-top: 24px; font-size: 12px; color: #666;">
        Hinweis: Automatisch berechnete Erstabschaetzung ohne Gewaehr.
        Bei Fragen: <a href="mailto:info@lota-solutions.ch">info@lota-solutions.ch</a>.
      </p>
    `,
    attachments: [
      {
        filename,
        content: pdf,
      },
    ],
  });

  if (error) {
    throw new Error(`Resend-Versand fehlgeschlagen: ${error.message}`);
  }
}

function renderAnalysisSummaryHtml(a: EngineAnalysisLike): string {
  // Kompakte Zusammenfassung — die volle Begruendung steht im PDF.
  const row = (label: string, value: unknown) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(label)}</td>` +
    `<td style="padding:4px 0;font-weight:600;">${escapeHtml(String(value ?? "—"))}</td></tr>`;

  const fmt = (n: number | null) =>
    n === null || n === undefined ? "—" : `${Math.round(n).toLocaleString("de-CH")} m²`;

  return `
    <table style="margin: 16px 0; border-collapse: collapse;">
      ${row("Zone", a.zone)}
      ${row("Grundstuecksflaeche", fmt(a.grundstuecksflaeche_m2))}
      ${row("Bebaubare Grundflaeche", fmt(a.bebaubare_grundflaeche_m2))}
      ${row("Realisierbare Geschossflaeche", fmt(a.realisierbare_geschossflaeche_m2))}
    </table>
  `;
}

type EngineAnalysisLike = {
  zone: string;
  grundstuecksflaeche_m2: number | null;
  bebaubare_grundflaeche_m2: number | null;
  realisierbare_geschossflaeche_m2: number | null;
};

function slugifyForFilename(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function notifySupportFailure(
  session: Stripe.Checkout.Session,
  err: unknown,
): Promise<void> {
  const support = process.env.SUPPORT_EMAIL ?? "info@lota-solutions.ch";
  const message = err instanceof Error ? err.message : String(err);
  await resend.emails.send({
    from: MAIL_FROM,
    to: support,
    subject: `[Lota] Auftragsfehler ${session.id}`,
    text:
      `Stripe-Session ${session.id} konnte nicht automatisch erfuellt werden.\n\n` +
      `Fehler:\n${message}\n\n` +
      `Metadata:\n${JSON.stringify(session.metadata ?? {}, null, 2)}\n\n` +
      `Customer-Email: ${session.customer_email ?? session.customer_details?.email ?? "?"}\n`,
  });
}
