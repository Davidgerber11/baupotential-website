"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ConversionTracker from "./ConversionTracker";
import Link from "next/link";

type OrderStatus = "pending" | "paid" | "failed" | string;

interface OrderResponse {
  order?: {
    id: string;
    payment_status: OrderStatus;
  };
  error?: string;
}

export default function VerifiedSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("order");
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Keine Bestell-ID gefunden.");
      setLoading(false);
      return;
    }

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/order/${orderId}`);
        const payload: OrderResponse = await res.json();

        if (!res.ok) {
          setError(payload.error || "Fehler beim Laden der Bestellinformationen.");
        } else {
          setStatus(payload.order?.payment_status ?? "pending");
        }
      } catch {
        setError("Netzwerkfehler beim Laden der Bestellinformationen.");
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [orderId]);

  if (loading) {
    return (
      <div className="mb-6 rounded-md border border-[#e4d8c7] bg-white/60 p-4 text-sm text-[#42505c]">
        Lade Zahlungsinformationen…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-md border border-[#e4d8c7] bg-white/60 p-4 text-sm text-[#c0392b]">
        <p>{error}</p>
        <div className="mt-3 text-xs text-[#42505c]">
          Bitte versuche es später erneut oder kontaktiere <a href="mailto:info@lota-solutions.ch" className="font-medium text-[#a97937] hover:opacity-70">info@lota-solutions.ch</a>.
        </div>
      </div>
    );
  }

  if (status !== "paid") {
    return (
      <div className="mb-6 rounded-md border border-[#e4d8c7] bg-white/60 p-4 text-sm text-[#42505c]">
        Deine Zahlung wird gerade geprüft. Wenn sie bereits abgeschlossen wurde, versuche diese Seite kurz neu zu laden.
      </div>
    );
  }

  return (
    <>
      <ConversionTracker />

      <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#2f8f56]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2f8f56] text-white">
          ✓
        </span>
        Zahlung erfolgreich
      </div>

      <h1 className="mb-4 text-3xl font-bold tracking-tight">
        Vielen Dank für deine Bestellung!
      </h1>

      <p className="mb-4 text-sm leading-relaxed text-[#42505c]">
        Wir haben deine Zahlung erhalten und erstellen jetzt deine
        Baupotenzialanalyse.
      </p>

      <p className="mb-6 text-sm leading-relaxed text-[#42505c]">
        Du erhältst die fertige PDF-Analyse innerhalb von 24 Stunden per
        E-Mail. Bitte prüfe ggf. auch deinen Spam-Ordner.
      </p>

      <div className="mb-6 rounded-md border border-[#e4d8c7] bg-white/60 p-4 text-xs leading-relaxed text-[#42505c]">
        Du hast Fragen oder hast keine E-Mail erhalten? Melde dich bei <a href="mailto:info@lota-solutions.ch" className="font-medium text-[#a97937] hover:opacity-70">info@lota-solutions.ch</a>.
      </div>

      <Link href="/" className="block w-full rounded-xl bg-[#1d2731] py-3 text-center font-medium text-white transition hover:bg-black">
        Zurück zur Startseite
      </Link>
    </>
  );
}
