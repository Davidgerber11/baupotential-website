"use client";

import { useEffect, useRef, useState } from "react";
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
    "Suchen Sie eine Adresse oder klicken Sie direkt auf eine Parzelle."
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [7.4474, 46.9481],
      zoom: 16,
      maxZoom: 20,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("official-parcels", {
        type: "raster",
        tiles: [
          "https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ch.kantone.cadastralwebmap-farbe&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=512&HEIGHT=512&FORMAT=image/png&TRANSPARENT=true",
        ],
        tileSize: 512,
      });

      map.addLayer({
        id: "official-parcels-layer",
        type: "raster",
        source: "official-parcels",
        paint: {
          "raster-opacity": 0.78,
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
        setMessage("Wählen Sie einen Treffer aus der Liste.");
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

      const url =
        `https://api3.geo.admin.ch/rest/services/ech/MapServer/identify?${params.toString()}`;

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

      setMessage("Parzelle gefunden. Bitte Kontaktdaten ergänzen.");
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
        "fill-color": "#22c55e",
        "fill-opacity": 0.35,
      },
    });

    map.addLayer({
      id: "parcel-line",
      type: "line",
      source: "parcel",
      paint: {
        "line-color": "#047857",
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
        padding: 80,
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

 const { error } = await supabase.from("orders").insert({
  name: customerName,
  email: customerEmail,
  address: query || null,
  parcel_number: parcelInfo.number,
  municipality: parcelInfo.municipality,
  area: parcelInfo.area,
  longitude: parcelInfo.lon,
  latitude: parcelInfo.lat,
  raw_data: parcelInfo.raw,
});

if (error) {
  console.error(error);
  alert("Fehler beim Speichern");
  return;
}

await fetch("/api/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: customerEmail,
    name: customerName,
    parcel: parcelInfo.number,
  }),
});

    setIsSaving(false);

    if (error) {
      console.error(error);
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    alert("Gespeichert! Wir melden uns per E-Mail.");
    resetSelection();
    setCustomerName("");
    setCustomerEmail("");
    setQuery("");
  }

  function resetSelection() {
    const map = mapRef.current;

    if (map?.getLayer("parcel-fill")) map.removeLayer("parcel-fill");
    if (map?.getLayer("parcel-line")) map.removeLayer("parcel-line");
    if (map?.getSource("parcel")) map.removeSource("parcel");

    setParcelInfo(null);
    setResults([]);
    setMessage("Suchen Sie eine Adresse oder klicken Sie direkt auf eine Parzelle.");
  }

  return (
    <main className="min-h-screen bg-[#dff5e8] px-6 py-10 text-neutral-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">
            Grundstück auswählen
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-neutral-700">
            Suchen Sie Ihre Adresse oder klicken Sie direkt auf die passende
            Parzelle auf der Karte.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-6 shadow-md">
            <label className="text-sm font-semibold text-neutral-900">
              Adresse oder Parzelle
            </label>

            <div className="mt-3 flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchAddress()}
                placeholder="z.B. Baumgartenweg 21"
                className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 py-3 text-neutral-950 placeholder:text-neutral-400 focus:border-black focus:outline-none"
              />

              <button
                onClick={searchAddress}
                disabled={isSearching}
                className="rounded-xl bg-black px-5 py-3 font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {isSearching ? "..." : "Suche"}
              </button>
            </div>

            <p className="mt-3 text-sm text-neutral-700">{message}</p>

            {results.length > 0 && (
              <div className="mt-5 space-y-2">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => selectSearchResult(r)}
                    className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-left text-sm text-neutral-900 transition hover:border-black hover:bg-neutral-50"
                  >
                    {r.attrs.label.replace(/<[^>]*>/g, "")}
                  </button>
                ))}
              </div>
            )}

            {parcelInfo && (
              <div className="mt-6 rounded-xl bg-[#eefaf3] p-4 ring-1 ring-green-200">
                <h2 className="font-semibold text-neutral-950">
                  Ausgewählte Liegenschaft
                </h2>

                <div className="mt-4 space-y-2 text-sm text-neutral-800">
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
                  <div>
                    <label className="text-sm font-medium text-neutral-900">
                      Name
                    </label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ihr Name"
                      className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-neutral-950 placeholder:text-neutral-400 focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-900">
                      E-Mail
                    </label>
                    <input
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="ihre@email.ch"
                      type="email"
                      className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-neutral-950 placeholder:text-neutral-400 focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <details className="mt-4 text-xs text-neutral-600">
                  <summary className="cursor-pointer">
                    Technische Daten anzeigen
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-white p-3">
                    {JSON.stringify(parcelInfo.raw, null, 2)}
                  </pre>
                </details>

                <div className="mt-6 space-y-2">
                  <button
                    onClick={saveOrder}
                    disabled={isSaving}
                    className="w-full rounded-xl bg-black py-3 font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {isSaving ? "Speichern..." : "Daten speichern"}
                  </button>

                  <button
                    onClick={resetSelection}
                    className="w-full rounded-xl border border-neutral-300 bg-white py-3 font-medium text-neutral-900 transition hover:border-black"
                  >
                    Nein, anderes auswählen
                  </button>
                </div>
              </div>
            )}
          </aside>

          <section className="relative h-[660px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-md">
            <div ref={mapContainerRef} className="h-full w-full" />

            {isSelecting && (
              <div className="absolute left-4 top-4 rounded-full bg-black px-4 py-2 text-sm font-medium text-white shadow">
                Parzelle wird ermittelt...
              </div>
            )}

            <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow">
              Amtliche Parzellendaten
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}