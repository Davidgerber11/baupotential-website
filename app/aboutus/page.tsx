"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { loadMapView, saveMapView } from "@/lib/mapView";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!token) {
  throw new Error("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
}

mapboxgl.accessToken = token;

export default function AboutUsPage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const view = loadMapView({ center: [7.4474, 46.9481], zoom: 15.7 });

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: view.center,
      zoom: view.zoom,
      interactive: true,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("moveend", () => saveMapView(map));

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

      <div className="absolute inset-0 bg-[#f4eadc]/20 pointer-events-none" />

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
          className="mb-3 text-sm font-medium text-[#a97937] hover:opacity-70"
        >
          ← Zurück zur Startseite
        </Link>

        <h1 className="mb-5 text-4xl font-bold tracking-tight">Über uns</h1>

        <p className="mb-5 text-sm leading-relaxed text-[#42505c]">
          Lota hilft dir, das Potenzial eines Grundstücks schnell und einfach
          einzuschätzen. Nach Eingabe einer Adresse oder Parzelle erstellen wir
          eine Baupotentialanalyse auf Basis öffentlich zugänglicher Daten,
          Zonenordnungen und Baureglemente.
        </p>

        <div className="mb-4 rounded-xl bg-[#f2eadf] p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#b17a2e] shadow-sm">
              ✉
            </div>
            <div>
              <h2 className="text-sm font-bold">
                Analyse innerhalb eines Tages per E-Mail
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#52606b]">
                Nach erfolgreicher Bezahlung wird die Analyse innerhalb eines
                Tages an deine E-Mail-Adresse zugestellt.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-[#f2eadf] p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#b17a2e] shadow-sm">
              ⚠
            </div>
            <div>
              <h2 className="text-sm font-bold">
                Wir befinden uns in der Testphase
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#52606b]">
                Lota befindet sich aktuell in einer Testphase. Wir verbessern
                unsere Analysen laufend und prüfen jede Bestellung sorgfältig,
                bevor sie versendet wird.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e4d8c7] pt-5">
          <h2 className="mb-4 text-lg font-bold">Wer steckt hinter Lota?</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2 h-28 rounded-xl bg-[#ddd4c8]" />
              <h3 className="text-sm font-bold">Max Mustermann</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#52606b]">
                Mitgründer von Lota. Max bringt Erfahrung in Geodaten,
                Raumplanung und Softwareentwicklung mit.
              </p>
            </div>

            <div>
              <div className="mb-2 h-28 rounded-xl bg-[#ddd4c8]" />
              <h3 className="text-sm font-bold">Lukas Beispiel</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#52606b]">
                Mitgründer von Lota. Lukas kennt den Immobilien- und
                Bausektor und arbeitet an klaren, verständlichen Analysen.
              </p>
            </div>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-[#52606b]">
            Gemeinsam entwickeln wir Lota mit dem Ziel, Grundstücksinformationen
            verständlicher zugänglich zu machen und erste Einschätzungen zum
            Baupotential einfacher bereitzustellen.
          </p>
        </div>

        <div className="mt-6 border-t border-[#e4d8c7] pt-5">
          <h2 className="text-sm font-bold">Hast du Fragen?</h2>
          <p className="mt-1 text-xs text-[#52606b]">
            Schreib uns an{" "}
            <a
              href="mailto:info@lota.ch"
              className="font-medium text-[#a97937] hover:opacity-70"
            >
              info@lota.ch
            </a>
          </p>
        </div>

        <footer className="mt-7 flex gap-4 border-t border-[#e4d8c7] pt-5 text-xs text-[#42505c]">
          <Link href="/aboutus" className="hover:text-[#a97937]">
            Über uns
          </Link>
          <Link href="/agb" className="hover:text-[#a97937]">
            AGB
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