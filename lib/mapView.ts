import type mapboxgl from "mapbox-gl";

// Remembers the last map camera so the position is kept when switching pages.
// sessionStorage: survives reloads/navigation within the same tab, resets on a new tab.

const KEY = "lota:mapView";

export type MapView = {
  center: [number, number];
  zoom: number;
};

export function loadMapView(fallback: MapView): MapView {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.center) &&
      parsed.center.length === 2 &&
      typeof parsed.center[0] === "number" &&
      typeof parsed.center[1] === "number" &&
      typeof parsed.zoom === "number"
    ) {
      return parsed as MapView;
    }
  } catch {
    // ignore corrupt/unavailable storage
  }

  return fallback;
}

export function saveMapView(map: mapboxgl.Map) {
  if (typeof window === "undefined") return;

  try {
    const c = map.getCenter();
    const view: MapView = {
      center: [c.lng, c.lat],
      zoom: map.getZoom(),
    };
    sessionStorage.setItem(KEY, JSON.stringify(view));
  } catch {
    // ignore unavailable storage
  }
}
