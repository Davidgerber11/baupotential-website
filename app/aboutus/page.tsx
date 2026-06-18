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
      // Gleiche neue Karte wie die Startseite: Satellit + Kataster-Grenzen als
      // feine weisse Linien (raster-color-Transparenz).
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: view.center,
      zoom: view.zoom,
      minZoom: 8,
      maxZoom: 20,
      dragRotate: false,
      pitchWithRotate: false,
      interactive: true,
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    map.on("moveend", () => saveMapView(map));

    map.on("load", () => {
      map.addSource("official-parcels", {
        type: "raster",
        tiles: [
          "https://wmts.geo.admin.ch/1.0.0/ch.kantone.cadastralwebmap-farbe/default/current/3857/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        minzoom: 13,
        maxzoom: 20,
      });

      const firstSymbolId = map
        .getStyle()
        .layers?.find((l) => l.type === "symbol")?.id;

      map.addLayer(
        {
          id: "swiss-map",
          type: "raster",
          source: "official-parcels",
          paint: {
            "raster-resampling": "linear",
            "raster-fade-duration": 300,
            "raster-color-mix": [0.2126, 0.7152, 0.0722, 0],
            "raster-color-range": [0, 1],
            "raster-color": [
              "interpolate",
              ["linear"],
              ["raster-value"],
              0.0, "rgba(255, 255, 255, 1)",
              0.3, "rgba(255, 255, 255, 0.5)",
              0.5, "rgba(255, 255, 255, 0)",
            ],
            "raster-opacity": 0.95,
          },
        },
        firstSymbolId,
      );

      for (const b of ["building", "building_casing", "building_ln"]) {
        if (map.getLayer(b)) map.setLayoutProperty(b, "visibility", "none");
      }

      for (const L of map.getStyle().layers || []) {
        if (
          L.type === "line" &&
          /road|street|motorway|trunk|primary|secondary|bridge|tunnel|ferry|path|rail|transit|aeroway/i.test(
            L.id,
          )
        ) {
          map.setLayoutProperty(L.id, "visibility", "none");
        }
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-[#f5f1e8] text-[#1d2731]">
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />

      <div className="absolute inset-0 bg-[#f4eadc]/20 pointer-events-none" />

      <aside className="absolute inset-x-3 top-3 z-10 flex max-h-[calc(100dvh-24px)] flex-col overflow-y-auto rounded-[18px] bg-[#fbf7ef]/95 p-5 shadow-2xl backdrop-blur-md md:inset-x-auto md:left-6 md:top-6 md:max-h-[calc(100vh-48px)] md:w-[500px] md:p-7">
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

        <p className="mb-5 text-base leading-relaxed text-[#42505c]">
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
              <h2 className="text-base font-bold">
                Analyse innerhalb von 24 Stunden per E-Mail
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#52606b]">
                Nach erfolgreicher Bezahlung wird die Analyse innerhalb von 24
                Stunden an deine E-Mail-Adresse zugestellt.
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
              <h2 className="text-base font-bold">
                Wir befinden uns in der Testphase
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#52606b]">
                Lota befindet sich aktuell in einer Testphase. Wir verbessern
                unsere Analysen laufend und prüfen jede Bestellung sorgfältig,
                bevor sie versendet wird.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e4d8c7] pt-5">
          <h2 className="mb-4 text-xl font-bold">Wer steckt hinter Lota?</h2>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/team/gruender.png"
            alt="Die Gründer von Lota: Yves Stauber und David Gerber"
            className="mb-3 w-full rounded-xl"
          />

          <p className="mt-1 text-sm leading-relaxed text-[#52606b]">
            Wir sind zwei Studenten der ETH Zürich und beide im Raum Bern
            aufgewachsen.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <h3 className="text-base font-bold">
                Yves Stauber{" "}
                <span className="font-medium text-[#a97937]">(rechts)</span>
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[#52606b]">
                Studiert Bauingenieurwissenschaften an der ETH Zürich. Bereits
                während des Gymnasiums hat er sich aktiv mit Immobilienentwicklung
                auseinandergesetzt und danach ein Jahr bei einem Totalunternehmen
                gearbeitet, wo er Immobilien mitentwickelt hat.
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold">
                David Gerber{" "}
                <span className="font-medium text-[#a97937]">(links)</span>
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[#52606b]">
                Studiert Erd- und Klimawissenschaften an der ETH Zürich. Er
                bringt eine grosse Affinität für Technologie mit.
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#52606b]">
            Gemeinsam verbinden wir Wissen aus Immobilienentwicklung und
            Technologie, um das Baupotential jedes Grundstücks verständlich und
            schnell zugänglich zu machen.
          </p>
        </div>

        <div className="mt-6 border-t border-[#e4d8c7] pt-5">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[#a97937]">
            Teil von
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="inline-flex rounded-xl border border-[#e4d8c7] bg-white p-3 shadow-sm">
            <img
              src="/logos/eth-sph.png"
              alt="ETH Student Project House"
              className="w-44"
            />
          </div>
        </div>

        <div className="mt-6 border-t border-[#e4d8c7] pt-5">
          <h2 className="text-base font-bold">Hast du Fragen?</h2>
          <p className="mt-1 text-sm text-[#52606b]">
            Schreib uns an{" "}
            <a
              href="mailto:info@lota-solutions.ch"
              className="font-medium text-[#a97937] hover:opacity-70"
            >
              info@lota-solutions.ch
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