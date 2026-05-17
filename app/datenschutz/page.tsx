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

export default function DatenschutzPage() {
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

        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Datenschutz
        </h1>

        <p className="mb-6 text-sm leading-relaxed text-[#42505c]">
          Diese Datenschutzerklärung beschreibt, welche personenbezogenen Daten
          Lota bei der Nutzung der Website und bei Bestellungen bearbeitet.
        </p>

        <div className="space-y-5 border-t border-[#e4d8c7] pt-5 text-sm leading-relaxed text-[#42505c]">
          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              1. Verantwortliche Stelle
            </h2>
            <p>
              Verantwortlich für die Bearbeitung personenbezogener Daten ist
              Lota. Kontakt:{" "}
              <a
                href="mailto:info@lota.ch"
                className="font-medium text-[#a97937] hover:opacity-70"
              >
                info@lota.ch
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              2. Bearbeitete Daten
            </h2>
            <p>
              Wir bearbeiten insbesondere Name, E-Mail-Adresse, gewählte Adresse
              oder Parzelle, Zahlungsstatus sowie technische Daten, die bei der
              Nutzung der Website anfallen.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              3. Zweck der Datenbearbeitung
            </h2>
            <p>
              Die Daten werden verwendet, um Bestellungen entgegenzunehmen,
              Baupotentialanalysen zu erstellen, Zahlungen abzuwickeln und mit
              Kundinnen und Kunden zu kommunizieren.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              4. Zahlungsabwicklung
            </h2>
            <p>
              Zahlungen werden über Stripe abgewickelt. Zahlungsdaten werden
              direkt durch Stripe verarbeitet. Lota erhält nur die für die
              Bestellung notwendigen Zahlungsinformationen.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              5. Karten- und Geodienste
            </h2>
            <p>
              Für die Kartendarstellung und Grundstückssuche nutzen wir externe
              Kartendienste wie Mapbox und öffentlich zugängliche Geodaten der
              Schweiz. Dabei können technische Nutzungsdaten an diese Dienste
              übermittelt werden.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              6. Speicherung der Daten
            </h2>
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie dies
              für die Bestellung, gesetzliche Pflichten oder berechtigte
              Interessen notwendig ist.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              7. Weitergabe an Dritte
            </h2>
            <p>
              Eine Weitergabe erfolgt nur, wenn dies für die Leistungserbringung
              notwendig ist, zum Beispiel an Zahlungs-, Hosting- oder
              E-Mail-Dienstleister.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              8. Rechte betroffener Personen
            </h2>
            <p>
              Betroffene Personen können Auskunft, Berichtigung, Löschung oder
              Einschränkung der Bearbeitung ihrer Daten verlangen, soweit dies
              gesetzlich vorgesehen ist.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              9. Änderungen
            </h2>
            <p>
              Lota kann diese Datenschutzerklärung jederzeit anpassen. Es gilt
              jeweils die auf der Website veröffentlichte Version.
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
          <Link href="/agb" className="hover:text-[#a97937]">
            AGB
          </Link>
          <Link href="/impressum" className="hover:text-[#a97937]">
            Impressum
          </Link>
        </footer>
      </aside>
    </main>
  );
}