"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/lib/supabase";
import demoBuildable from "@/lib/demo-buildable.json";
import demoBuildings from "@/lib/demo-buildings.json";
import demoEdges from "@/lib/demo-edges.json";
import demoDims from "@/lib/demo-dims.json";
import { saveMapView } from "@/lib/mapView";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!token) {
  throw new Error("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
}

mapboxgl.accessToken = token;

type Potential = {
  zone: string;
  buildableArea: number; // bebaubare Grundflaeche m²
  floorArea: number; // realisierbare Geschossflaeche m²
};

type ParcelInfo = {
  number: string;
  municipality: string;
  area: string;
  lon: number;
  lat: number;
  raw: any;
  potential?: Potential | null;
  isDemo?: boolean;
};

// Vorzeige-Parzelle fuer den Startbildschirm: echte Engine-Werte (Muri bei Bern 601,
// Brunnenweg 5). Zeigt dem Nutzer beim Laden sofort, was das Produkt liefert.
const DEMO = {
  // Zentrum aufs Parzellen-Cluster (601 + Nachbarn) + naeherer Zoom, damit
  // die eingezeichneten Grenzabstaende/Baufelder gross sichtbar sind.
  lon: 7.4857,
  lat: 46.9302,
  zoom: 18.3,
  label: "Brunnenweg 5, Muri bei Bern",
  parcelArea: 944,
  potential: {
    zone: "Wohnzone, 2 Geschosse",
    buildableArea: 307,
    floorArea: 614, // 307 m² Grundflaeche x 2 Vollgeschosse
  } as Potential,
};

export default function OrderPage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  // Verhindert, dass nach Auswahl eines Treffers (setQuery setzt das Label)
  // sofort wieder Vorschläge geladen werden.
  const suppressSearchRef = useRef(false);

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

  // Live-Vorschläge schon beim Tippen (entprellt). Laufende Anfragen werden
  // abgebrochen; nach Auswahl eines Treffers wird einmal übersprungen.
  useEffect(() => {
    const q = query.trim();
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false;
      return;
    }
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url =
          `https://api3.geo.admin.ch/rest/services/ech/SearchServer` +
          `?searchText=${encodeURIComponent(q)}` +
          `&type=locations&origins=address,parcel&limit=8&sr=4326`;
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        // abgebrochen oder Netzwerkfehler -> Vorschläge unverändert lassen
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Beim Laden direkt bei den Demo-Parzellen starten (kein Bern-Altstadt-Flash).
    // Bei ?lon=&lat= (Link aus Suche) startet die Karte dort.
    const initParams = new URLSearchParams(window.location.search);
    const initLon = Number(initParams.get("lon"));
    const initLat = Number(initParams.get("lat"));
    const hasInitParam =
      initParams.get("lon") !== null &&
      initParams.get("lat") !== null &&
      !Number.isNaN(initLon) &&
      !Number.isNaN(initLat);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      // Mapbox Satellite (Google-Earth-Stil): durchgehende Luftbild-Basis ueber
      // alle Zoomstufen. Kataster-Grenzen per raster-color transparent drueber.
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: hasInitParam ? [initLon, initLat] : [DEMO.lon, DEMO.lat],
      zoom: hasInitParam ? 18 : DEMO.zoom,
      minZoom: 8,
      maxZoom: 20,
      dragRotate: false,
      pitchWithRotate: false,
    });

    mapRef.current = map;

    // Info-Panel freihalten: auf Desktop links (Panel daneben), auf dem Handy
    // ohne Offset (Panel liegt oben, vollbreit). padding.left darf nicht groesser
    // als die Kartenbreite sein -> sonst Fehldarstellung auf schmalen Screens.
    if (!hasInitParam) {
      const wide = window.innerWidth >= 768;
      map.jumpTo({
        center: [DEMO.lon, DEMO.lat],
        // Desktop: Panel links freihalten. Handy: Sheet unten -> Cluster in den
        // sichtbaren oberen Bereich rahmen (padding unten).
        zoom: wide ? DEMO.zoom : 17.4,
        padding: wide
          ? { left: 400, top: 0, right: 0, bottom: 0 }
          : {
              left: 16,
              right: 16,
              top: 16,
              bottom: Math.round(window.innerHeight * 0.6),
            },
      });
    }

    // Reine 2D-Kataster-Ansicht: keine Rotation/Neigung noetig.
    map.touchZoomRotate.disableRotation();

    // Fadenkreuz signalisiert "auf die Karte klicken, um eine Parzelle zu waehlen".
    map.getCanvas().style.cursor = "crosshair";
    map.on("dragstart", () => { map.getCanvas().style.cursor = "grabbing"; });
    map.on("dragend", () => { map.getCanvas().style.cursor = "crosshair"; });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("moveend", () => saveMapView(map));

    map.on("load", async () => {
      map.addSource("official-parcels", {
        type: "raster",
        tiles: [
          "https://wmts.geo.admin.ch/1.0.0/ch.kantone.cadastralwebmap-farbe/default/current/3857/{z}/{x}/{y}.png",
        ],
        // Native Kachelgroesse ist 256 px — mit 256 (statt 512) werden die
        // Parzellen-/Gebaeudelinien 1:1 statt hochskaliert gezeichnet = scharf.
        tileSize: 256,
        // Ab Zoom 13 (statt 14): Parzellen erscheinen frueher -> die mittlere
        // Ansicht ist nicht mehr so leer, Uebergang wirkt einheitlicher.
        minzoom: 13,
        maxzoom: 20,
      });

      // Kataster-Overlay UNTER die swisstopo-Beschriftungen legen, damit deren
      // Labels oben und scharf bleiben (keine Text-Dopplung).
      const firstSymbolId = map
        .getStyle()
        .layers?.find((l) => l.type === "symbol")?.id;

      map.addLayer(
        {
          id: "swiss-map",
          type: "raster",
          source: "official-parcels",
          paint: {
            // Transparenz-Trick (Mapbox GL v3): heller/weisser Kataster-Hintergrund
            // wird durchsichtig, dunkle Linien werden zu goldenen Linien ueber dem
            // Luftbild. raster-color-mix = Luminanz, raster-value in [0,1].
            "raster-resampling": "linear",
            "raster-fade-duration": 300,
            "raster-color-mix": [0.2126, 0.7152, 0.0722, 0],
            "raster-color-range": [0, 1],
            // Weisse, FEINE Grenzlinien: enge Alpha-Schwelle -> nur der dunkle
            // Linienkern bleibt sichtbar (anti-aliasing-Rand wird transparent),
            // dadurch wirken die Linien duenner.
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

      // Gebaeude der swisstopo-Basiskarte ausblenden: die Hauskanten kommen jetzt
      // nur noch aus dem Kataster-Overlay (eine einzige Quelle) -> keine doppelt
      // gezeichneten Gebaeudekanten mehr.
      for (const b of ["building", "building_casing", "building_ln"]) {
        if (map.getLayer(b)) map.setLayoutProperty(b, "visibility", "none");
      }

      // Satellit zeigt Strassen bereits im Luftbild -> die orangen/gelben
      // Strassen-Linien des "streets"-Overlays ausblenden (DAS verursacht den
      // Orangestich auf mittlerer Zoomstufe). Beschriftungen (symbol) bleiben.
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

      // --- Warme Marken-Palette, passend zum Bedienfeld (Creme #faf7f0 + Gold).
      //     Einheitliches Creme-Land + blaues Wasser; kraeftiges Gruen NUR fuer
      //     echten Wald und erst beim Reinzoomen (sonst Gruenstich in der Uebersicht). ---
      const CREAM = "rgb(247, 244, 237)";
      const FOREST = "rgb(150, 188, 122)";

      // Land-Hintergrund einheitlich creme.
      if (map.getLayer("background")) {
        map.setPaintProperty("background", "background-color", CREAM);
      }

      // Landcover: NUR echter Wald bleibt gruen; alles andere wird Land (creme).
      // -> kein Gruenstich/Flimmer mehr auf normalen Parzellen (z.B. am See).
      if (map.getLayer("landcover")) {
        map.setPaintProperty("landcover", "fill-color", CREAM);
        map.setPaintProperty("landcover", "fill-opacity", 1);
      }
      // Wald als EIGENE Ebene, die per Layer-minzoom erst ab Zoom 13.5 erscheint
      // (statt eines zoom-Ausdrucks) -> kraeftiges Gruen nur beim Reinzoomen,
      // in der Uebersicht bleibt alles ruhig creme.
      const baseSrc = map
        .getStyle()
        .layers?.find((l) => l.id === "landcover")?.source;
      if (baseSrc && !map.getLayer("forest-fill")) {
        map.addLayer(
          {
            id: "forest-fill",
            type: "fill",
            source: baseSrc,
            "source-layer": "landcover",
            minzoom: 13.5,
            filter: ["match", ["get", "class"], ["forest", "wood"], true, false],
            paint: { "fill-color": FOREST, "fill-opacity": 1 },
          },
          "swiss-map",
        );
      }
      // Stoerende Landcover-Umrisslinien weg (verursachen das Flimmern).
      if (map.getLayer("landcover_casing")) {
        map.setLayoutProperty("landcover_casing", "visibility", "none");
      }
      // Landnutzungs-Farbvielfalt auf Creme vereinheitlichen (weniger Farben).
      if (map.getLayer("landuse")) {
        map.setPaintProperty("landuse", "fill-color", CREAM);
      }
      if (map.getLayer("landuse_outline")) {
        map.setLayoutProperty("landuse_outline", "visibility", "none");
      }

      // Relief/Gelaendeschattierung + Hoehenlinien AUS -> flaches 3-Farben-Bild.
      // (Sonst uebersteuern die Berg-Schattierungen die Uebersicht komplett.)
      const hideRelief = [
        "hillshade_grey",
        "hillshade_yellow",
        "scree_z11",
        "scree_z13",
        "scree_z15",
        "scree_z17",
        "hachure",
        "contour_line",
        "contour_line_blue",
      ];
      for (const id of hideRelief) {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
      }

      // Forst-Textur-Layer aus: DAS verursacht die "gruene Schicht"/Schraffur
      // ueber Waldgebieten.
      if (map.getLayer("pattern_landcover")) {
        map.setLayoutProperty("pattern_landcover", "visibility", "none");
      }

      // Strassen in warmem, dezentem Grau (statt gelb/orange Klassenfarben).
      for (const r of ["road_fill", "tunnel_road"]) {
        if (map.getLayer(r)) {
          map.setPaintProperty(r, "line-color", "rgb(235, 230, 220)");
        }
      }
      for (const r of ["road_casing", "l1_road_casing", "l2_road_casing"]) {
        if (map.getLayer(r)) {
          map.setPaintProperty(r, "line-color", "rgb(213, 205, 192)");
        }
      }

      // Bahnlinien (leuchtend rot) auf dezentes warmes Grau.
      for (const r of [
        "public_transport",
        "l1_public_transport",
        "l2_public_transport_aerialway",
        "tunnel_public_transport",
      ]) {
        if (map.getLayer(r)) {
          map.setPaintProperty(r, "line-color", "rgb(213, 205, 192)");
        }
      }

      // Kantons-/Gemeindegrenzen (rosa gestrichelt) + Park-Umrandungen ausblenden.
      for (const b of ["boundary", "boundary_disputed", "park"]) {
        if (map.getLayer(b)) map.setLayoutProperty(b, "visibility", "none");
      }

      // --- Schlichtes, reduziertes Kartenbild: Labels & Schilder ausblenden ---
      // Strassennamen, Strassennummern-Schilder, POI, Hoehenlinien, Gipfel,
      // Gewaesser-/Park-Namen raus -> ruhig, nicht "Google-Maps"-haft.
      // Ortsnamen (place_city / place_town_village) bleiben zur Orientierung.
      const hideLabels = [
        "road_number",
        "transportation_label",
        "poi_rank1",
        "poi_rank2",
        "contour_line_pt",
        "spot_elevation",
        "peaks_rank1",
        "peaks_rank2",
        "waterway_line_label",
        "water_name_point_label",
        "park_label",
        "area_name_glacier_point_label",
        "area_name_glacier_line_label",
        "area_name_massif_label",
        "aerodrome_label",
        "place_other",
        "place_country",
      ];
      for (const id of hideLabels) {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
      }

      // Wasser kraeftiger/moderner einfaerben (weniger pastellig).
      if (map.getLayer("water")) {
        map.setPaintProperty("water", "fill-color", "rgb(150, 197, 227)");
      }
      if (map.getLayer("water_outline")) {
        map.setPaintProperty("water_outline", "line-color", "rgb(132, 184, 220)");
      }

      const params = new URLSearchParams(window.location.search);
      const lon = params.get("lon");
      const lat = params.get("lat");

      if (lon && lat) {
        const parsedLon = Number(lon);
        const parsedLat = Number(lat);

        if (!Number.isNaN(parsedLon) && !Number.isNaN(parsedLat)) {
          // Kamera steht bereits (Konstruktor). Nur noch die Parzelle ermitteln.
          setTimeout(async () => {
            await identifyParcel(parsedLon, parsedLat);
            window.history.replaceState({}, "", "/");
          }, 500);
        }
      } else {
        // Startbildschirm: Demo-Overlay (oranges Baufeld + Masspfeile) zeichnen.
        // Kamera ist schon beim Parzellen-Cluster (Konstruktor) -> kein Sprung,
        // kein Bern-Altstadt-Flash. Panel bleibt im Normalzustand (Suche).
        drawDemoPotential();
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

  function geodesicArea(geometry: any): number {
    const R = 6378137;
    const rad = (d: number) => (d * Math.PI) / 180;

    function ringArea(ring: number[][]): number {
      const n = ring.length;
      if (n < 3) return 0;
      let total = 0;
      for (let i = 0; i < n; i++) {
        const lo = ring[i === 0 ? n - 1 : i - 1];
        const mi = ring[i];
        const hi = ring[i === n - 1 ? 0 : i + 1];
        total += (rad(hi[0]) - rad(lo[0])) * Math.sin(rad(mi[1]));
      }
      return Math.abs((total * R * R) / 2);
    }

    function polygonArea(rings: number[][][]): number {
      if (!rings.length) return 0;
      let a = ringArea(rings[0]);
      for (let i = 1; i < rings.length; i++) a -= ringArea(rings[i]);
      return a;
    }

    if (geometry?.type === "Polygon") return polygonArea(geometry.coordinates);
    if (geometry?.type === "MultiPolygon") {
      return geometry.coordinates.reduce(
        (sum: number, poly: number[][][]) => sum + polygonArea(poly),
        0
      );
    }
    return 0;
  }

  async function identifyMunicipality(lon: number, lat: number): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        geometry: `${lon},${lat}`,
        geometryType: "esriGeometryPoint",
        sr: "4326",
        layers: "all:ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill",
        returnGeometry: "false",
        tolerance: "0",
        lang: "de",
        limit: "1",
      });

      const res = await fetch(
        `https://api3.geo.admin.ch/rest/services/ech/MapServer/identify?${params.toString()}`
      );
      const data = await res.json();
      const hit = data.results?.[0];
      const a = hit?.properties || hit?.attributes || hit?.attrs || {};

      return (
        a.gemname ||
        a.name ||
        a.bez ||
        a.gemeindename ||
        hit?.label ||
        null
      );
    } catch (error) {
      console.error("Municipality lookup failed:", error);
      return null;
    }
  }

  async function identifyParcel(
    lon: number,
    lat: number,
    opts?: { potential?: Potential; isDemo?: boolean; parcelArea?: number },
  ) {
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
    // Demo behaelt die kuratierte Weitansicht (601 + Nachbarn, via jumpTo mit
    // Offset). Nur bei echter Auswahl auf die Parzelle zoomen.
    if (!opts?.isDemo) zoomToGeometry(parcel.geometry);

    // Waehlt der Nutzer ein eigenes Grundstueck (kein Demo), die vorberechneten
    // Demo-Bau-Flaechen entfernen.
    if (!opts?.isDemo) {
      removeBuildable();
      removeNeighbors();
    }

    const municipality = await identifyMunicipality(lon, lat);

    setParcelInfo({
      number:
        attrs.number ||
        attrs.nummer ||
        attrs.parzellen_nummer ||
        attrs.label ||
        parcel.id ||
        "—",

      municipality: municipality || "—",

      area: (() => {
        const m2 = geodesicArea(parcel.geometry);
        return m2 > 0 ? `${Math.round(m2).toLocaleString("de-CH")} m²` : "—";
      })(),

      lon,
      lat,

      raw: {
        ...attrs,
        geometry: parcel.geometry,
      },

      potential: opts?.potential ?? null,
      isDemo: opts?.isDemo ?? false,
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

  // Grobe "bebaubare Zone": Parzelle flaechen-treu zum Schwerpunkt skalieren UND
  // von der Strasse weg versetzen (grosser Grenzabstand auf der Strassenseite).
  // streetPoint = Anklick-/Adresspunkt (liegt strassennah).
  function buildableGeometry(
    geometry: any,
    scale: number,
    streetPoint?: [number, number],
  ): any {
    const outer: number[][] =
      geometry.type === "Polygon"
        ? geometry.coordinates[0]
        : geometry.coordinates[0][0];
    let cx = 0;
    let cy = 0;
    for (const [x, y] of outer) {
      cx += x;
      cy += y;
    }
    cx /= outer.length;
    cy /= outer.length;

    // Versatz weg vom Strassenpunkt (in den Parzellen-Innenraum).
    let ox = 0;
    let oy = 0;
    if (streetPoint) {
      const dx = cx - streetPoint[0];
      const dy = cy - streetPoint[1];
      const len = Math.hypot(dx, dy) || 1;
      let r = 0;
      for (const [x, y] of outer) r += Math.hypot(x - cx, y - cy);
      r /= outer.length;
      const mag = r * 0.4; // Versatz ~40 % des mittleren Parzellenradius
      ox = (dx / len) * mag;
      oy = (dy / len) * mag;
    }

    const tx = (ring: number[][]) =>
      ring.map(([x, y]) => [cx + (x - cx) * scale + ox, cy + (y - cy) * scale + oy]);

    if (geometry.type === "Polygon") {
      return { type: "Polygon", coordinates: geometry.coordinates.map(tx) };
    }
    if (geometry.type === "MultiPolygon") {
      return {
        type: "MultiPolygon",
        coordinates: geometry.coordinates.map((poly: number[][][]) => poly.map(tx)),
      };
    }
    return geometry;
  }

  function removeBuildable() {
    const map = mapRef.current;
    if (!map) return;
    for (const id of ["buildable-fill", "buildable-line"]) {
      if (map.getLayer(id)) map.removeLayer(id);
    }
    if (map.getSource("buildable")) map.removeSource("buildable");
  }

  // Einmaliges Punkt-Muster (kraeftiges Orange) fuer die Bau-Zone erzeugen.
  function ensureDotPattern(map: mapboxgl.Map) {
    if (map.hasImage("buildable-dots")) return;
    const s = 14;
    const cnv = document.createElement("canvas");
    cnv.width = s;
    cnv.height = s;
    const ctx = cnv.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "rgba(255, 122, 0, 0.97)";
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, 2.4, 0, Math.PI * 2);
    ctx.fill();
    const img = ctx.getImageData(0, 0, s, s);
    map.addImage("buildable-dots", img, { pixelRatio: 2 });
  }

  function drawBuildable(
    geometry: any,
    scale: number,
    streetPoint?: [number, number],
  ) {
    const map = mapRef.current;
    if (!map) return;
    removeBuildable();
    ensureDotPattern(map);

    map.addSource("buildable", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: buildableGeometry(geometry, scale, streetPoint),
        properties: {},
      },
    });
    // Bau-Zone als Punkt-Muster (Baupotential "mit Punkten") + dezente Kontur.
    map.addLayer({
      id: "buildable-fill",
      type: "fill",
      source: "buildable",
      paint: { "fill-pattern": "buildable-dots", "fill-opacity": 0.9 },
    });
    map.addLayer({
      id: "buildable-line",
      type: "line",
      source: "buildable",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#c79b5a", "line-width": 1.5, "line-dasharray": [2, 1.5] },
    });
  }

  function removeNeighbors() {
    const map = mapRef.current;
    if (!map) return;
    for (const id of [
      "neighbors-fill",
      "neighbors-line",
      "neighbors-label",
      "buildings-line",
      "edges-line",
      "edges-label",
      "dims-line",
      "dims-label",
    ]) {
      if (map.getLayer(id)) map.removeLayer(id);
    }
    if (map.getSource("neighbors")) map.removeSource("neighbors");
    if (map.getSource("buildings")) map.removeSource("buildings");
    if (map.getSource("edges")) map.removeSource("edges");
    if (map.getSource("dims")) map.removeSource("dims");
  }

  // Echte bebaubare Flaechen (601 + Nachbarn 608/264/609/254) als Punkt-Muster
  // + m²-Label einzeichnen -> signalisiert: wir kennen das Baupotential JEDES
  // Grundstuecks. Geometrien sind aus der Engine vorberechnet (mit korrektem
  // Strassenabstand 3.6 m), liegen in lib/demo-buildable.json.
  function drawDemoPotential() {
    const map = mapRef.current;
    if (!map) return;
    ensureDotPattern(map);
    removeNeighbors();
    map.addSource("neighbors", {
      type: "geojson",
      data: demoBuildable as unknown as GeoJSON.FeatureCollection,
    });
    map.addLayer({
      id: "neighbors-fill",
      type: "fill",
      source: "neighbors",
      paint: { "fill-pattern": "buildable-dots", "fill-opacity": 0.85 },
    });
    map.addLayer({
      id: "neighbors-line",
      type: "line",
      source: "neighbors",
      paint: { "line-color": "#ff7a00", "line-width": 1.6, "line-opacity": 0.95 },
    });
    map.addLayer({
      id: "neighbors-label",
      type: "symbol",
      source: "neighbors",
      layout: {
        "text-field": ["concat", ["to-string", ["get", "area"]], " m²"],
        "text-size": 13,
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#1d2731",
        "text-halo-width": 1.4,
      },
    });

    // Tatsaechlich realisierte Gebaeude als weisse Kontur -> direkter Vergleich
    // "berechnetes Baufeld (Punkte) vs. real gebautes Haus (Kontur)".
    map.addSource("buildings", {
      type: "geojson",
      data: demoBuildings as unknown as GeoJSON.FeatureCollection,
    });
    map.addLayer({
      id: "buildings-line",
      type: "line",
      source: "buildings",
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#ffffff",
        "line-width": 1.8,
        "line-opacity": 0.95,
      },
    });

    // Parzellengrenzen als feine weisse Linie (der Distanz-Typ steht am Pfeil).
    map.addSource("edges", {
      type: "geojson",
      data: demoEdges as unknown as GeoJSON.FeatureCollection,
    });
    map.addLayer({
      id: "edges-line",
      type: "line",
      source: "edges",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#ffffff",
        "line-width": 2.2,
        "line-opacity": 0.95,
      },
    });
    // Masspfeile: weisser Doppelpfeil von der Grenze bis zur bebaubaren Flaeche
    // mit Distanz-Label -> macht den genommenen Abstand fuer Laien verstaendlich.
    map.addSource("dims", {
      type: "geojson",
      data: demoDims as unknown as GeoJSON.FeatureCollection,
    });
    map.addLayer({
      id: "dims-line",
      type: "line",
      source: "dims",
      filter: ["==", ["get", "role"], "arrow"],
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#16c6ff",
        "line-width": 2.2,
        "line-opacity": 1,
      },
    });
    map.addLayer({
      id: "dims-label",
      type: "symbol",
      source: "dims",
      filter: ["==", ["get", "role"], "label"],
      layout: {
        "text-field": ["get", "label"],
        "text-size": 12,
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#16c6ff",
        "text-halo-color": "#06212e",
        "text-halo-width": 1.9,
      },
    });
  }

  function drawParcel(geometry: any) {
    const map = mapRef.current;
    if (!map) return;

    for (const id of ["parcel-glow", "parcel-fill", "parcel-line"]) {
      if (map.getLayer(id)) map.removeLayer(id);
    }
    if (map.getSource("parcel")) map.removeSource("parcel");

    map.addSource("parcel", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry,
        properties: {},
      },
    });

    // 1) Weicher goldener Schein als Rahmen um die Parzelle.
    map.addLayer({
      id: "parcel-glow",
      type: "line",
      source: "parcel",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#e0b14a",
        "line-width": 16,
        "line-blur": 14,
        "line-opacity": 0.5,
      },
    });

    // 2) Gefuellte Flaeche in dezentem Gold.
    map.addLayer({
      id: "parcel-fill",
      type: "fill",
      source: "parcel",
      paint: {
        "fill-color": "#c79b5a",
        "fill-opacity": 0.3,
      },
    });

    // 3) Klare, abgerundete Kontur.
    map.addLayer({
      id: "parcel-line",
      type: "line",
      source: "parcel",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#9b6f1f",
        "line-width": 2.5,
      },
    });

    // Sanftes Aufblenden der Flaeche fuer einen ruhigen Auswahl-Effekt.
    const start = performance.now();
    const fadeIn = (t: number) => {
      const p = Math.max(0, Math.min((t - start) / 450, 1));
      if (!map.getLayer("parcel-fill")) return;
      map.setPaintProperty("parcel-fill", "fill-opacity", 0.3 * p);
      map.setPaintProperty("parcel-glow", "line-opacity", 0.5 * p);
      if (p < 1) requestAnimationFrame(fadeIn);
    };
    requestAnimationFrame(fadeIn);
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
      // Desktop: Info-Panel links (~440px) freihalten -> Parzelle rechts daneben.
      // Handy: Bottom-Sheet unten freihalten -> Parzelle in den sichtbaren oberen
      // Bereich rahmen (padding unten = Sheet-Hoehe).
      const wide = (map.getContainer().clientWidth || 0) > 760;
      const mapH = map.getContainer().clientHeight || window.innerHeight;
      map.fitBounds(bounds, {
        // Handy: padding unten = Sheet-Maxhoehe (68dvh), damit die Parzelle auch
        // dann ueber dem Sheet bleibt, wenn es nach der Auswahl auf Maxhoehe waechst.
        padding: wide
          ? { left: 480, top: 90, right: 90, bottom: 90 }
          : { top: 60, left: 24, right: 24, bottom: Math.round(mapH * 0.68) },
        maxZoom: 18,
        duration: 700,
      });
    }
  }

  async function selectSearchResult(result: any) {
    const lon = result.attrs.lon;
    const lat = result.attrs.lat;
    const label = result.attrs.label.replace(/<[^>]*>/g, "");

    suppressSearchRef.current = true;
    setQuery(label);
    setResults([]);

    mapRef.current?.flyTo({
      center: [lon, lat],
      zoom: 18,
      duration: 1200,
      curve: 1.42,
      essential: true,
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

    for (const id of ["parcel-glow", "parcel-fill", "parcel-line"]) {
      if (map?.getLayer(id)) map.removeLayer(id);
    }
    if (map?.getSource("parcel")) map.removeSource("parcel");
    removeBuildable();
    removeNeighbors();

    setParcelInfo(null);
    setResults([]);
    setMessage("Adresse oder Parzelle suchen oder direkt auf die Karte klicken.");
  }

  return (
  <main className="relative h-[100dvh] w-screen overflow-hidden bg-[#f4efe5] text-[#2b2f2a]">
    <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

    <aside className="absolute inset-x-0 bottom-0 z-10 flex max-h-[68dvh] flex-col overflow-hidden rounded-t-2xl bg-[#faf7f0]/97 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.18)] backdrop-blur md:inset-x-auto md:bottom-auto md:left-6 md:top-6 md:max-h-[calc(100vh-48px)] md:w-[380px] md:rounded-xl md:p-5 md:shadow-xl">
      {/* Greifer-Bar: signalisiert auf dem Handy das Bottom-Sheet */}
      <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-[#d8cfbe] md:hidden" />
      {/* Kopf bleibt immer sichtbar: Marke + was Lota macht + Beispiel-Button */}
      <div className="shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-3xl text-[#b6843b]">⌂</div>
          <div className="text-2xl font-bold">Lota</div>
        </div>

        <p className="mt-2 text-sm leading-snug text-[#4b4f48]">
          Herausfinden, wie viel du auf deinem{" "}
          <strong className="font-semibold text-[#2b2f2a]">
            Grundstück bauen
          </strong>{" "}
          kannst — als PDF-Bericht in 24 Stunden.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {parcelInfo && (
            <button
              onClick={resetSelection}
              className="text-sm font-medium text-[#b6843b] hover:opacity-70"
            >
              ← Zurück
            </button>
          )}

          <Link
            href="/beispiele"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#b6843b] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a3742f]"
          >
            📄 Beispiel-Bericht ansehen
          </Link>

          <Link
            href="/aboutus"
            className="text-sm font-semibold text-[#b6843b] hover:opacity-70"
          >
            Über uns →
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <span className="text-xs font-medium text-[#8a7e66]">Teil des</span>
          <span className="inline-flex items-center rounded-lg border border-[#e7decd] bg-white px-3 py-2 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/eth-sph.png"
              alt="ETH Student Project House"
              className="h-8 w-auto"
            />
          </span>
        </div>
      </div>

      {/* Scrollbarer Bereich: Suche, Resultat, Bestellformular, Footer */}
      <div className="mt-4 flex-1 overflow-y-auto border-t border-[#e7decd] pr-1 pt-4">
      <div className="relative mb-3">
        <div className="flex items-center rounded-md border border-[#ddd4c4] bg-white px-3 py-2.5 shadow-sm">
          <span className="mr-2 text-neutral-400">⌕</span>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchAddress()}
            placeholder="Adresse oder Parzelle suchen"
            name="lota-grundstuecksuche"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore
            data-form-type="other"
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
        <div className="mb-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#2f8f56]">
            <span>●</span>
            {parcelInfo.isDemo ? "Beispiel-Analyse" : "Grundstück gefunden"}
          </div>

          <h1 className="text-2xl font-bold leading-tight">
            {query ||
              (parcelInfo.isDemo ? DEMO.label : `Parzelle ${parcelInfo.number}`)}
          </h1>

          <dl className="mt-3 space-y-1 text-sm text-[#555]">
            <div className="flex gap-2">
              <dt className="font-medium text-[#2b2f2a]">Gemeinde:</dt>
              <dd>{parcelInfo.municipality}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-[#2b2f2a]">Parzelle:</dt>
              <dd>{parcelInfo.number}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-[#2b2f2a]">Fläche:</dt>
              <dd>{parcelInfo.area}</dd>
            </div>
          </dl>

          {parcelInfo.potential && (
            <div className="mt-4 rounded-lg bg-[#f1ead9] p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#a9701f]">
                Baupotential
              </div>
              <dl className="mt-2 space-y-1 text-sm text-[#555]">
                <div className="flex justify-between gap-3">
                  <dt>Zone</dt>
                  <dd className="text-right font-semibold text-[#2b2f2a]">
                    {parcelInfo.potential.zone}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Bebaubare Grundfläche</dt>
                  <dd className="font-semibold text-[#2b2f2a]">
                    {parcelInfo.potential.buildableArea} m²
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Realisierbare Geschossfläche</dt>
                  <dd className="font-semibold text-[#2b2f2a]">
                    {parcelInfo.potential.floorArea} m²
                  </dd>
                </div>
              </dl>
              <div className="mt-2 space-y-1 text-xs text-[#8a7e66]">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: "#ff7a00" }}
                  />
                  Orange = bebaubares Baufeld
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-3.5 w-4 items-center justify-center rounded-sm bg-[#2b3540]">
                    <span className="h-[2px] w-3 rounded-full bg-white" />
                  </span>
                  Weisse Linie = Parzellengrenze
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-3.5 w-4 items-center justify-center rounded-sm bg-[#2b3540]">
                    <span className="h-2 w-2 border border-white bg-transparent" />
                  </span>
                  Weisse Kontur = bestehendes Gebäude
                </div>
                <div className="mt-1.5 flex items-center gap-2 border-t border-[#e7decd] pt-1.5 font-medium text-[#6f6450]">
                  <span
                    className="inline-block h-[3px] w-4 rounded-full"
                    style={{ backgroundColor: "#16c6ff" }}
                  />
                  Cyan Masspfeile = Abstand bis zum Baufeld
                </div>
                <div className="text-[#8a7e66]">
                  Zahl = Meter · grosser GA 13 m · kleiner GA 6 m · Strassenabstand
                  3,6 m
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 text-sm text-[#b6843b]">
            📍 Auf der Karte markiert
          </div>

          {parcelInfo.isDemo && (
            <div className="mt-3 rounded-md bg-[#1d2731] px-3 py-2 text-xs leading-relaxed text-white">
              👉 Wir kennen das Baupotential{" "}
              <strong>jedes</strong> Grundstücks — die orange Fläche zeigt das
              bebaubare Baufeld. Suchen Sie oben Ihr eigenes Grundstück.
            </div>
          )}
        </div>
      ) : (
        <div className="mb-3 text-xs leading-snug text-[#777]">{message}</div>
      )}

      <div className="border-t border-[#e7decd] pt-4">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-base font-bold">Bestellung</h2>
          <div className="text-xl font-bold">CHF 49.–</div>
        </div>
        <div className="mb-3 text-xs text-[#6f6450]">
          Baupotential auf der Karte · PDF-Bericht in 24 Std. per E-Mail
        </div>

        <label className="mb-0.5 block text-xs font-medium">Name</label>
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Vor- und Nachname"
          className="mb-2 w-full rounded-md border border-[#ddd4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#b6843b]"
        />

        <label className="mb-0.5 block text-xs font-medium">E-Mail</label>
        <input
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="Deine E-Mail-Adresse"
          type="email"
          className="w-full rounded-md border border-[#ddd4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#b6843b]"
        />
      </div>

     
      <div className="mt-3 space-y-2 text-xs text-[#444]">
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
  className="mt-4 w-full rounded-xl bg-[#1d2731] py-2.5 font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
>
  {isSaving ? "Weiter zur Zahlung..." : "Analyse bestellen"}
</button>

      <div className="mt-2.5 text-center text-xs text-[#777]">
        🔒 Sichere Zahlung über Stripe
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 border-t border-[#ddd4c4] pt-3 text-xs text-[#555]">
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