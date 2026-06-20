"use client";

import { useEffect } from "react";

// Google-Ads-Conversion-Tracking: feuert einmalig nach erfolgreicher Zahlung.
// Aktiv nur, wenn die beiden Env-Vars gesetzt sind (Conversion-ID + Label aus
// Google Ads -> Tools -> Conversions). Das Basis-gtag wird in app/layout.tsx
// geladen.
const GADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const GADS_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;

// Bestellwert in CHF (Produktpreis). Bei Preisänderung hier anpassen.
const ORDER_VALUE_CHF = 49;

export default function ConversionTracker() {
  useEffect(() => {
    if (!GADS_ID || !GADS_LABEL) return;
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag !== "function") return;

    // Bestell-ID (falls von Stripe via ?order= mitgegeben) als transaction_id,
    // damit Google dieselbe Bestellung nicht doppelt zählt.
    const orderId =
      new URLSearchParams(window.location.search).get("order") || undefined;

    w.gtag("event", "conversion", {
      send_to: `${GADS_ID}/${GADS_LABEL}`,
      value: ORDER_VALUE_CHF,
      currency: "CHF",
      transaction_id: orderId,
    });
  }, []);

  return null;
}
