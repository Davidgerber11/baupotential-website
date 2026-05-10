"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/lib/supabase";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!token) {
  throw new Error("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
}

mapboxgl.accessToken = token;

type ParcelInfo = {
  number: string;
  municipality: string;
  area: string;
  lon: number;
  lat: number;
  raw: any;
};

export default function OrderPage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [parcelInfo, setParcelInfo] = useState<ParcelInfo | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [isSearching, setIsSearching] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState(
    "Adresse oder Parzelle suchen oder direkt auf die Karte klicken."
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [7.4474, 46.9481],
      zoom: 15.5,
      maxZoom: 20,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

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
        id: "official-parcels-layer",
        type: "raster",
        source: "official-parcels",
        paint: {
          "raster-opacity": 0.75,
          "raster-fade-duration": 0,
        },
      });
    });

    map.on("click", async (e) => {
      await identifyParcel(e.lngLat.lng, e.lngLat.lat);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  async function searchAddress() {
    if (!query.trim()) return;

    setIsSearching(true);
    setResults([]);
    setMessage("Adresse wird gesucht...");

    try {
      const url =
        `https://api3.geo.admin.ch/rest/services/ech/SearchServer` +
        `?searchText=${encodeURIComponent(query)}` +
        `&type=locations` +
        `&origins=address,parcel` +
        `&limit=8` +
        `&sr=4326`;

      const res = await fetch(url);
      const data = await res.json();

      const foundResults = data.results || [];
      setResults(foundResults);

      if (foundResults.length === 0) {
        setMessage("Keine Adresse oder Parzelle gefunden.");
      } else {
        setMessage("Wählen Sie einen Treffer aus.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Fehler bei der Suche.");
    } finally {
      setIsSearching(false);
    }
  }

  async function identifyParcel(lon: number, lat: number) {
    setIsSelecting(true);
    setMessage("Parzelle wird ermittelt...");

    try {
      const params = new URLSearchParams({
        geometry: `${lon},${lat}`,
        geometryType: "esriGeometryPoint",
        sr: "4326",
        layers: "all:ch.kantone.cadastralwebmap-farbe",
        returnGeometry: "true",
        geometryFormat: "geojson",
        tolerance: "0",
        lang: "de",
        limit: "1",
      });

      const url = `https://api3.geo.admin.ch/rest/services/ech/MapServer/identify?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();

      const parcel = data.results?.[0];

      if (!parcel?.geometry) {
        setParcelInfo(null);
        setMessage("An dieser Stelle wurde keine Parzelle gefunden.");
        return;
      }

      const attrs = parcel.properties || parcel.attributes || parcel.attrs || {};

      drawParcel(parcel.geometry);
      zoomToGeometry(parcel.geometry);

      setParcelInfo({
        number:
          attrs.number ||
          attrs.nummer ||
          attrs.parzellen_nummer ||
          attrs.label ||
          parcel.id ||
          "—",
        municipality:
          attrs.gemeinde ||
          attrs.gemeindename ||
          attrs.municipality ||
          attrs.mun_name ||
          "—",
        area:
          attrs.flaeche || attrs.area || attrs.liegenschaft_flaeche
            ? `${attrs.flaeche || attrs.area || attrs.liegenschaft_flaeche} m²`
            : "—",
        lon,
        lat,
        raw: {
          ...attrs,
          geometry: parcel.geometry,
        },
      });

      setResults([]);
      setMessage("Parzelle gefunden. Kontaktdaten ergänzen.");
    } catch (error) {
      console.error(error);
      setParcelInfo(null);
      setMessage("Fehler beim Ermitteln der Parzelle.");
    } finally {
      setIsSelecting(false);
    }
  }

  function drawParcel(geometry: any) {
    const map = mapRef.current;
    if (!map) return;

    if (map.getLayer("parcel-fill")) map.removeLayer("parcel-fill");
    if (map.getLayer("parcel-line")) map.removeLayer("parcel-line");
    if (map.getSource("parcel")) map.removeSource("parcel");

    map.addSource("parcel", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry,
        properties: {},
      },
    });

    map.addLayer({
      id: "parcel-fill",
      type: "fill",
      source: "parcel",
      paint: {
        "fill-color": "#c6a46b",
        "fill-opacity": 0.35,
      },
    });

    map.addLayer({
      id: "parcel-line",
      type: "line",
      source: "parcel",
      paint: {
        "line-color": "#9b7540",
        "line-width": 4,
      },
    });
  }

  function zoomToGeometry(geometry: any) {
    const map = mapRef.current;
    if (!map) return;

    const bounds = new mapboxgl.LngLatBounds();

    function extendBounds(coords: any) {
      if (typeof coords[0] === "number") {
        bounds.extend(coords as [number, number]);
      } else {
        coords.forEach(extendBounds);
      }
    }

    extendBounds(geometry.coordinates);

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 120,
        maxZoom: 18,
        duration: 700,
      });
    }
  }

  async function selectSearchResult(result: any) {
    const lon = result.attrs.lon;
    const lat = result.attrs.lat;
    const label = result.attrs.label.replace(/<[^>]*>/g, "");

    setQuery(label);
    setResults([]);

    mapRef.current?.flyTo({
      center: [lon, lat],
      zoom: 18,
      duration: 600,
    });

    await identifyParcel(lon, lat);
  }

  async function saveOrder() {
    if (!parcelInfo) {
      alert("Bitte zuerst ein Grundstück auswählen.");
      return;
    }

    if (!customerName.trim() || !customerEmail.trim()) {
      alert("Bitte Name und E-Mail ausfüllen.");
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          name: customerName,
          email: customerEmail,
          address: query || null,
          parcel_number: parcelInfo.number,
          municipality: parcelInfo.municipality,
          area: parcelInfo.area,
          longitude: parcelInfo.lon,
          latitude: parcelInfo.lat,
          raw_data: parcelInfo.raw,
          payment_status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        alert("Fehler beim Speichern: " + error.message);
        return;
      }

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: data.id,
          email: customerEmail,
          parcel_number: parcelInfo.number,
          municipality: parcelInfo.municipality,
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.url) {
        console.error(checkoutData);
        alert("Fehler beim Starten der Zahlung.");
        return;
      }

      window.location.href = checkoutData.url;
    } catch (error) {
      console.error(error);
      alert("Unerwarteter Fehler beim Bestellen.");
    } finally {
      setIsSaving(false);
    }
  }

  function resetSelection() {
    const map = mapRef.current;

    if (map?.getLayer("parcel-fill")) map.removeLayer("parcel-fill");
    if (map?.getLayer("parcel-line")) map.removeLayer("parcel-line");
    if (map?.getSource("parcel")) map.removeSource("parcel");

    setParcelInfo(null);
    setResults([]);
    setMessage("Adresse oder Parzelle suchen oder direkt auf die Karte klicken.");
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#f5f1e8] text-[#1d2731]">
  <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

  <div className="pointer-events-none absolute inset-0 z-[1] bg-[#f5f1e8]/10" />

      <aside className="absolute left-6 top-6 z-10 flex max-h-[calc(100vh-48px)] w-[410px] flex-col overflow-y-auto rounded-[28px] bg-[#f8f5ef]/95 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c6a46b] text-2xl text-[#c6a46b]">
            ⌂
          </div>

          <div>
            <div className="text-[44px] font-semibold leading-none tracking-tight">
              Lota
            </div>
            <div className="mt-1 text-sm text-[#a07f4d]">
              Grundstücke schneller einschätzen.
            </div>
          </div>
        </div>

        <h1 className="mb-7 text-5xl font-semibold leading-tight tracking-tight">
          Baupotential
          <br />
          prüfen
        </h1>

        <div className="relative mb-6">
          <div className="flex items-center rounded-2xl border border-[#ddd6c8] bg-white px-4 py-4 shadow-sm">
            <span className="mr-3 text-xl text-neutral-400">⌕</span>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchAddress()}
              placeholder="Adresse oder Parzelle suchen"
              className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-neutral-400"
            />

            <button
              onClick={searchAddress}
              disabled={isSearching}
              className="ml-3 rounded-xl bg-[#1d2731] px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
            >
              {isSearching ? "..." : "Suche"}
            </button>
          </div>

          {results.length > 0 && (
            <div className="absolute left-0 right-0 top-[72px] z-20 overflow-hidden rounded-2xl border border-[#ddd6c8] bg-white shadow-xl">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => selectSearchResult(r)}
                  className="block w-full border-b border-neutral-100 px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-[#f5f1e8]"
                >
                  {r.attrs.label.replace(/<[^>]*>/g, "")}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="mb-8 text-sm text-[#5f6872]">{message}</p>

        <div className="border-t border-[#e7e0d4] pt-8">
          <div className="mb-3 text-5xl font-semibold tracking-tight">
            CHF 49.–
          </div>

          <div className="space-y-1 text-[18px] text-[#3d4752]">
            <div>Baupotential auf Karte dargestellt</div>
            <div>PDF per E-Mail</div>
          </div>

          <Link
            href="/examples"
            className="mt-8 inline-flex items-center gap-2 text-[18px] font-medium text-[#a07f4d] transition hover:opacity-70"
          >
            Beispielanalyse sehen
            <span>›</span>
          </Link>
        </div>

        {parcelInfo && (
          <div className="mt-8 rounded-2xl border border-[#d8c7a3] bg-white/75 p-5">
            <h2 className="font-semibold">Ausgewählte Liegenschaft</h2>

            <div className="mt-4 space-y-1 text-sm text-[#3d4752]">
              <p>
                <strong>Parzelle:</strong> {parcelInfo.number}
              </p>
              <p>
                <strong>Gemeinde:</strong> {parcelInfo.municipality}
              </p>
              <p>
                <strong>Fläche:</strong> {parcelInfo.area}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ihr Name"
                className="w-full rounded-xl border border-[#ddd6c8] bg-white px-3 py-3 outline-none focus:border-[#a07f4d]"
              />

              <input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="ihre@email.ch"
                type="email"
                className="w-full rounded-xl border border-[#ddd6c8] bg-white px-3 py-3 outline-none focus:border-[#a07f4d]"
              />
            </div>

            <button
              onClick={saveOrder}
              disabled={isSaving}
              className="mt-5 w-full rounded-xl bg-[#1d2731] py-3 font-medium text-white transition hover:bg-black disabled:opacity-50"
            >
              {isSaving ? "Weiter zur Zahlung..." : "Analyse bestellen"}
            </button>

            <button
              onClick={resetSelection}
              className="mt-2 w-full rounded-xl border border-[#ddd6c8] bg-white py-3 font-medium transition hover:border-[#1d2731]"
            >
              Anderes Grundstück wählen
            </button>
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t border-[#e7e0d4] pt-6 text-sm text-[#4d5761]">
          <Link href="/about" className="hover:opacity-60">
            Über uns
          </Link>
          <span>·</span>
          <Link href="/agb" className="hover:opacity-60">
            AGB
          </Link>
          <span>·</span>
          <Link href="/datenschutz" className="hover:opacity-60">
            Datenschutz
          </Link>
          <span>·</span>
          <Link href="/impressum" className="hover:opacity-60">
            Impressum
          </Link>
        </div>
      </aside>

      {isSelecting && (
        <div className="absolute right-6 top-6 z-10 rounded-full bg-[#1d2731] px-5 py-3 text-sm font-medium text-white shadow-xl">
          Parzelle wird ermittelt...
        </div>
      )}

      <div className="absolute bottom-6 left-[455px] z-10 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-[#4d5761] shadow">
        Amtliche Parzellendaten
      </div>
    </main>
  );
}