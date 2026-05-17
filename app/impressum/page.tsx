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

export default function ImpressumPage() {
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

    map.on("click", async (e) => {
  const lon = e.lngLat.lng;
  const lat = e.lngLat.lat;

  window.location.href = `/?lon=${lon}&lat=${lat}`;
});

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

        <h1 className="mb-4 text-4xl font-bold tracking-tight">Impressum</h1>

        <p className="mb-6 text-sm leading-relaxed text-[#42505c]">
          Angaben gemäss den gesetzlichen Informationspflichten.
        </p>

        <div className="space-y-5 border-t border-[#e4d8c7] pt-5 text-sm leading-relaxed text-[#42505c]">
          <section>
            <h2 className="mb-2 font-bold text-[#1d2731]">Kontaktadresse</h2>

            <p>Yves Stauber</p>
            <p>Lota</p>
            <p>Kalcheggweg 20a</p>
            <p>CH-8952 Bern</p>
          </section>

          <section>
            <h2 className="mb-2 font-bold text-[#1d2731]">Kontakt</h2>

            <p>
              E-Mail:{" "}
              <a
                href="mailto:info@lota-solutions.ch"
                className="font-medium text-[#a97937] hover:opacity-70"
              >
                info@lota-solutions.ch
              </a>
            </p>

            <p>
              Website:{" "}
              <a
                href="https://www.lota-solutions.ch"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[#a97937] hover:opacity-70"
              >
                www.lota-solutions.ch
              </a>
            </p>

            <p>
              Telefon:{" "}
              <a
                href="tel:+41415522277"
                className="font-medium text-[#a97937] hover:opacity-70"
              >
                +41 41 552 22 77
              </a>
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
          <Link href="/datenschutz" className="hover:text-[#a97937]">
            Datenschutz
          </Link>
        </footer>
      </aside>
    </main>
  );
}