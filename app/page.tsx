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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);

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

    map.on("load", async () => {
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

      const params = new URLSearchParams(window.location.search);
      const lon = params.get("lon");
      const lat = params.get("lat");

      if (lon && lat) {
        const parsedLon = Number(lon);
        const parsedLat = Number(lat);

        if (!Number.isNaN(parsedLon) && !Number.isNaN(parsedLat)) {
          map.jumpTo({
            center: [parsedLon, parsedLat],
            zoom: 18,
          });

          setTimeout(async () => {
            await identifyParcel(parsedLon, parsedLat);
            window.history.replaceState({}, "", "/");
          }, 500);
        }
      }
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

    console.log("PARCEL ATTRS:", attrs);

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
        attrs.GEMEINDE ||
        attrs.gemeindename ||
        attrs.GEMEINDENAME ||
        attrs.municipality ||
        attrs.MUNICIPALITY ||
        attrs.mun_name ||
        attrs.gmdname ||
        attrs.gemname ||
        attrs.name ||
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
          municipality: parcelInfo.municipality || query || "—",
          parcel_number: `${parcelInfo.municipality || query || "—"} - ${parcelInfo.number}`,
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
  <main className="relative h-screen w-screen overflow-hidden bg-[#f4efe5] text-[#2b2f2a]">
    <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

    <aside className="absolute left-6 top-6 z-10 flex max-h-[calc(100vh-48px)] w-[360px] flex-col overflow-y-auto rounded-xl bg-[#faf7f0]/95 p-6 shadow-xl backdrop-blur">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl text-[#b6843b]">⌂</div>
          <div>
            <div className="text-2xl font-bold">Lota</div>
            <div className="text-xs font-medium text-[#b6843b]">
              Grundstücke schneller einschätzen.
            </div>
          </div>
        </div>

        <button
          onClick={resetSelection}
          className="mt-4 text-xs font-medium text-[#b6843b] hover:opacity-70"
        >
          ← Zurück zur Suche
        </button>
      </div>

      <div className="relative mb-5">
        <div className="flex items-center rounded-md border border-[#ddd4c4] bg-white px-3 py-3 shadow-sm">
          <span className="mr-2 text-neutral-400">⌕</span>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchAddress()}
            placeholder="Adresse oder Parzelle suchen"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-neutral-400 hover:text-black"
            >
              ×
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-[54px] z-20 overflow-hidden rounded-md border border-[#ddd4c4] bg-white shadow-xl">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => selectSearchResult(r)}
                className="block w-full border-b border-neutral-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-[#f4efe5]"
              >
                {r.attrs.label.replace(/<[^>]*>/g, "")}
              </button>
            ))}
          </div>
        )}
      </div>

      {parcelInfo ? (
        <div className="mb-5 border-b border-[#ddd4c4] pb-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#2f8f56]">
            <span>●</span>
            Grundstück gefunden
          </div>

          <h1 className="text-2xl font-bold leading-tight">
            {query || `Parzelle ${parcelInfo.number}`}
          </h1>

          <div className="mt-1 text-sm font-medium text-[#555]">
            {parcelInfo.municipality}
          </div>

          <div className="mt-3 text-sm text-[#b6843b]">
            📍 Auf der Karte markiert
          </div>
        </div>
      ) : (
        <div className="mb-5 border-b border-[#ddd4c4] pb-5 text-sm text-[#555]">
          {message}
        </div>
      )}

      <div className="mb-5">
        <h2 className="mb-3 text-base font-bold">Deine Daten</h2>

        <label className="mb-1 block text-xs font-medium">Name</label>
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Vor- und Nachname"
          className="mb-3 w-full rounded-md border border-[#ddd4c4] bg-white px-3 py-3 text-sm outline-none focus:border-[#b6843b]"
        />

        <label className="mb-1 block text-xs font-medium">E-Mail</label>
        <input
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="Deine E-Mail-Adresse"
          type="email"
          className="w-full rounded-md border border-[#ddd4c4] bg-white px-3 py-3 text-sm outline-none focus:border-[#b6843b]"
        />
      </div>

      <div className="mb-5 flex items-center justify-between">
        <div className="text-2xl font-bold">CHF 49.–</div>

        <div className="text-xs text-[#555]">
          <div>📍 Baupotential auf Karte dargestellt</div>
          <div>📄 PDF per E-Mail</div>
        </div>
      </div>

     
      <div className="mt-5 space-y-3 text-xs text-[#444]">
  <label className="flex gap-2">
    <input
      type="checkbox"
      checked={acceptedTerms}
      onChange={(e) => setAcceptedTerms(e.target.checked)}
      className="mt-0.5"
    />

    <span>
      Ich akzeptiere die{" "}
      <Link href="/agb" className="text-[#a07f4d] underline">
        AGB
      </Link>{" "}
      und nehme die{" "}
      <Link
        href="/datenschutz"
        className="text-[#a07f4d] underline"
      >
        Datenschutzerklärung
      </Link>{" "}
      zur Kenntnis.
    </span>
  </label>

  <label className="flex gap-2">
    <input
      type="checkbox"
      checked={acceptedDisclaimer}
      onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
      className="mt-0.5"
    />

    <span>
      Ich verstehe, dass die Analyse eine unverbindliche
      Ersteinschätzung ist und keine behördliche Auskunft ersetzt.
    </span>
  </label>
</div>

<button
  onClick={saveOrder}
  disabled={
    isSaving ||
    !acceptedTerms ||
    !acceptedDisclaimer
  }
  className="mt-5 w-full rounded-xl bg-[#1d2731] py-3 font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
>
  {isSaving ? "Weiter zur Zahlung..." : "Analyse bestellen"}
</button>

      <div className="mt-3 text-center text-xs text-[#777]">
        🔒 Sichere Zahlung über Stripe
      </div>

      <div className="mt-auto flex flex-wrap justify-center gap-x-3 gap-y-2 border-t border-[#ddd4c4] pt-5 text-xs text-[#555]">
        <Link href="/" className="hover:opacity-60">
          Startseite
        </Link>
        <span>·</span>
        <Link href="/aboutus" className="hover:opacity-60">
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
      <div className="absolute right-6 top-6 z-10 rounded-full bg-[#2b2f2a] px-5 py-3 text-sm font-medium text-white shadow-xl">
        Parzelle wird ermittelt...
      </div>
    )}
  </main>
);
}