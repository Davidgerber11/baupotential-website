"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!token) {
  throw new Error("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
}

mapboxgl.accessToken = token;

export default function OrderAppPage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [parcelInfo, setParcelInfo] = useState<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [7.4474, 46.9481],
      zoom: 16,
      maxZoom: 20,
    });

    mapRef.current.on("load", () => {
      mapRef.current?.addSource("official-parcels", {
        type: "raster",
        tiles: [
          "https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ch.kantone.cadastralwebmap-farbe&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=512&HEIGHT=512&FORMAT=image/png&TRANSPARENT=true",
        ],
        tileSize: 512,
      });

      mapRef.current?.addLayer({
        id: "official-parcels-layer",
        type: "raster",
        source: "official-parcels",
        paint: {
          "raster-opacity": 0.75,
          "raster-fade-duration": 0,
        },
      });
    });

    mapRef.current.on("click", async (e) => {
      await identifyParcel(e.lngLat.lng, e.lngLat.lat);
    });
  }, []);

  async function searchAddress() {
    const url =
      `https://api3.geo.admin.ch/rest/services/api/SearchServer` +
      `?searchText=${encodeURIComponent(query)}` +
      `&type=locations&features=address,parcel&limit=8&sr=4326`;

    const res = await fetch(url);
    const data = await res.json();

    setResults(data.results || []);
  }

  async function identifyParcel(lon: number, lat: number) {
    const url =
      `https://api3.geo.admin.ch/rest/services/api/MapServer/identify` +
      `?geometry=${lon},${lat}` +
      `&geometryType=esriGeometryPoint` +
      `&sr=4326` +
      `&layers=all:ch.kantone.cadastralwebmap-farbe` +
      `&returnGeometry=true` +
      `&geometryFormat=geojson`;

    const res = await fetch(url);
    const data = await res.json();

    const parcel = data.results?.[0];

    if (!parcel?.geometry) {
      alert("Keine Parzelle gefunden");
      return;
    }

    drawParcel(parcel.geometry);

    const attrs = parcel.attrs || {};

    setParcelInfo({
      number: attrs.parzellen_nummer || "—",
      municipality: attrs.gemeinde || "—",
      area: attrs.flaeche ? `${attrs.flaeche} m²` : "—",
    });
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
        "fill-color": "#34d399",
        "fill-opacity": 0.4,
      },
    });

    map.addLayer({
      id: "parcel-line",
      type: "line",
      source: "parcel",
      paint: {
        "line-color": "#059669",
        "line-width": 3,
      },
    });
  }

  async function selectSearchResult(result: any) {
    const lon = result.attrs.lon;
    const lat = result.attrs.lat;

    mapRef.current?.flyTo({
      center: [lon, lat],
      zoom: 18,
    });

    await identifyParcel(lon, lat);
  }

  return (
    <main className="min-h-screen bg-[#e4f7e9] p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-semibold mb-6">
          Grundstück auswählen
        </h1>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <label className="text-sm font-medium">
              Adresse oder Parzelle
            </label>

            <div className="mt-2 flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchAddress()}
                placeholder="z.B. Muri bei Bern"
                className="w-full border rounded-xl px-3 py-2"
              />

              <button
                onClick={searchAddress}
                className="bg-black text-white px-4 py-2 rounded-xl"
              >
                Suche
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => selectSearchResult(r)}
                  className="w-full text-left border p-3 rounded-xl hover:bg-gray-50 text-sm"
                >
                  {r.attrs.label.replace(/<[^>]*>/g, "")}
                </button>
              ))}
            </div>

            {parcelInfo && (
              <div className="mt-6 bg-gray-100 p-4 rounded-xl">
                <h2 className="font-semibold mb-3">
                  Ausgewählte Liegenschaft
                </h2>

                <div className="text-sm space-y-1">
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

                <div className="mt-6 space-y-2">
                  <button className="w-full bg-black text-white py-3 rounded-xl">
                    Ja, das ist mein Grundstück
                  </button>

                  <button className="w-full border py-3 rounded-xl">
                    Nein, anderes auswählen
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative h-[650px] bg-white rounded-2xl overflow-hidden shadow-sm">
            <div ref={mapContainerRef} className="h-full w-full" />

            <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs text-gray-600 shadow">
              Amtliche Parzellendaten werden geladen
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}