"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!token) {
  throw new Error("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
}

mapboxgl.accessToken = token;

export default function AGBPage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [7.4474, 46.9481],
      zoom: 15.7,
      interactive: true,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("official-parcels", {
        type: "raster",
        tiles: [
          "https://wmts.geo.admin.ch/1.0.0/ch.kantone.cadastralwebmap-farbe/default/current/3857/{z}/{x}/{y}.png",
        ],
        tileSize: 512,
        minzoom: 14,
        maxzoom: 20,
      });

      map.addLayer({
  id: "swiss-map",
  type: "raster",
  source: "official-parcels",
  paint: {
    "raster-opacity": 0.55,
    "raster-saturation": -0.6,
    "raster-contrast": 0.15,
    "raster-brightness-min": 0.15,
    "raster-brightness-max": 0.95,
  },
});
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#f5f1e8] text-[#1d2731]">
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[#f4eadc]/20" />

      <aside className="absolute left-6 top-6 z-10 flex max-h-[calc(100vh-48px)] w-[420px] flex-col overflow-y-auto rounded-[18px] bg-[#fbf7ef]/95 p-7 shadow-2xl backdrop-blur-md">
        <Link href="/" className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c79b5a] text-[#b17a2e]">
            ⌂
          </div>
          <div>
            <div className="text-3xl font-bold leading-none">Lota</div>
            <div className="mt-1 text-xs font-medium text-[#a97937]">
              Grundstücke schneller einschätzen.
            </div>
          </div>
        </Link>

        <Link
          href="/"
          className="mb-4 text-sm font-medium text-[#a97937] hover:opacity-70"
        >
          ← Zurück zur Startseite
        </Link>

        <h1 className="mb-4 text-4xl font-bold tracking-tight">AGB</h1>

        <p className="mb-6 text-sm leading-relaxed text-[#42505c]">
          Diese Allgemeinen Geschäftsbedingungen regeln die Nutzung der Website
          und die Bestellung von Baupotentialanalysen durch Lota.
        </p>

        <div className="space-y-5 border-t border-[#e4d8c7] pt-5 text-sm leading-relaxed text-[#42505c]">
          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">1. Geltungsbereich</h2>
            <p>
              Diese AGB gelten für alle Bestellungen und Nutzungen der Website
              lota.ch durch Kundinnen und Kunden mit Wohnsitz in der Schweiz.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              2. Leistungsbeschreibung
            </h2>
            <p>
              Lota erstellt eine Analyse zum Baupotential eines Grundstücks auf
              Basis öffentlich zugänglicher Daten, Zonenordnungen und weiteren
              rechtlichen Grundlagen. Die Analyse wird als PDF per E-Mail
              zugestellt.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              3. Bestellung und Bezahlung
            </h2>
            <p>
              Die Bestellung erfolgt über die Website. Die Bezahlung wird sicher
              über Stripe abgewickelt. Mit der erfolgreichen Bezahlung kommt der
              Vertrag zustande.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">4. Lieferung</h2>
            <p>
              Die Analyse wird in der Regel innerhalb eines Tages nach
              Zahlungseingang per E-Mail an die angegebene Adresse zugestellt.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              5. Haftungsausschluss
            </h2>
            <p>
              Die Analysen von Lota dienen der ersten Einschätzung und stellen
              keine verbindliche Auskunft dar. Für die Richtigkeit,
              Vollständigkeit und Aktualität der Daten übernimmt Lota keine
              Gewähr.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              6. Keine Baubewilligung
            </h2>
            <p>
              Die Analyse ersetzt keine Prüfung durch Behörden, Fachplanerinnen,
              Architekten oder andere qualifizierte Fachpersonen.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">7. Datenschutz</h2>
            <p>
              Die Bearbeitung personenbezogener Daten erfolgt gemäss der
              Datenschutzerklärung von Lota.
            </p>
          </section>
        </div>

        <footer className="mt-7 flex gap-4 border-t border-[#e4d8c7] pt-5 text-xs text-[#42505c]">
          <Link href="/" className="hover:text-[#a97937]">
            Startseite
          </Link>
          <Link href="/aboutus" className="hover:text-[#a97937]">
            Über uns
          </Link>
          <Link href="/datenschutz" className="hover:text-[#a97937]">
            Datenschutz
          </Link>
          <Link href="/impressum" className="hover:text-[#a97937]">
            Impressum
          </Link>
        </footer>
      </aside>
    </main>
  );
}