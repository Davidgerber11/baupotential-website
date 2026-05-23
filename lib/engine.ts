// lib/engine.ts
//
// Helpers fuer den Aufruf der Baupotential-Engine (https://api.lota-solutions.ch).
// Die Engine ist ein FastAPI-Dienst auf einem Infomaniak-VPS, der aus
// Gemeinde-Slug + Parzellennummer ein PDF mit der Baupotenzialanalyse rendert.
//
// Erwartete Env-Vars:
//   ENGINE_API_URL   z. B. https://api.lota-solutions.ch
//   ENGINE_API_KEY   geheimer Schluessel, wird als X-API-Key-Header gesendet

// Mapping: offizieller BFS-Gemeindename (wie ihn swisstopo's
// `swissboundaries3d-gemeinde-flaeche.fill`-Layer im `gemname`-Feld liefert)
// -> Slug, den die Engine erwartet.
//
// Aktuell deckt die Engine 5 Gemeinden in 5 Kantonen ab (AG, BE, SG, TG, ZH).
// Wenn die Liste waechst, hier neue Eintraege ergaenzen.
const MUNICIPALITY_SLUG_MAP: Record<string, string> = {
  Aarau: "aarau",
  Degersheim: "degersheim",
  "Muri (BE)": "muri_bei_bern",
  "Muri bei Bern": "muri_bei_bern",
  Weinfelden: "weinfelden",
  "Zürich": "zuerich",
  Zurich: "zuerich",
};

/**
 * Wandelt einen Gemeinde-Displaynamen (z. B. "Muri (BE)") in den Engine-Slug
 * ("muri_bei_bern") um. Toleriert Gross-/Kleinschreibung und Whitespace.
 * Gibt `null` zurueck, wenn die Gemeinde nicht von der Engine unterstuetzt wird.
 */
export function municipalityToSlug(
  display: string | null | undefined,
): string | null {
  if (!display) return null;

  const trimmed = display.trim();
  if (!trimmed || trimmed === "—") return null;

  // Exakter Treffer.
  if (MUNICIPALITY_SLUG_MAP[trimmed]) return MUNICIPALITY_SLUG_MAP[trimmed];

  // Toleranter Treffer (case-insensitive).
  const lower = trimmed.toLowerCase();
  for (const [name, slug] of Object.entries(MUNICIPALITY_SLUG_MAP)) {
    if (name.toLowerCase() === lower) return slug;
  }

  return null;
}

export type EngineAnalysis = {
  gemeinde: string;
  kanton: string;
  parzelle: string;
  zone: string;
  grundstuecksflaeche_m2: number | null;
  bestehende_gebaeude_m2: number | null;
  kleiner_grenzabstand_m: number | null;
  grosser_grenzabstand_m: number | null;
  bebaubare_grundflaeche_m2: number | null;
  anrechenbare_gebaeudeflaeche_m2: number | null;
  ausnuetzungsziffer: number | null;
  realisierbare_gebaeudeflaeche_m2: number | null;
  realisierbare_geschossflaeche_m2: number | null;
  massgebend: string;
  hinweis: string;
};

function engineConfig(): { url: string; key: string } {
  const url = process.env.ENGINE_API_URL;
  const key = process.env.ENGINE_API_KEY;
  if (!url) throw new Error("ENGINE_API_URL ist nicht gesetzt");
  if (!key) throw new Error("ENGINE_API_KEY ist nicht gesetzt");
  // Trailing slash wegschneiden, damit das Concatenieren sauber ist.
  return { url: url.replace(/\/+$/, ""), key };
}

/**
 * Ruft die Engine-JSON-Analyse fuer eine Parzelle ab.
 * Wirft, wenn die Engine antwortet (z. B. 404 = Parzelle nicht gefunden).
 */
export async function fetchEngineAnalysis(
  slug: string,
  parzelle: string,
): Promise<EngineAnalysis> {
  const { url, key } = engineConfig();
  const target = `${url}/analyse?gemeinde=${encodeURIComponent(slug)}&parzelle=${encodeURIComponent(parzelle)}`;

  const res = await fetch(target, {
    headers: { "X-API-Key": key },
    // Webhook-Handler laufen Server-seitig in Node; kein Browser-Cache zu beachten.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Engine /analyse antwortete ${res.status}: ${body.slice(0, 300)}`);
  }

  return (await res.json()) as EngineAnalysis;
}

/**
 * Holt das fertige 2-seitige Baupotential-PDF als Buffer.
 * Wirft bei HTTP-Fehlern (404 / 401 / 500).
 */
export async function fetchEnginePdf(
  slug: string,
  parzelle: string,
): Promise<Buffer> {
  const { url, key } = engineConfig();
  const target = `${url}/pdf?gemeinde=${encodeURIComponent(slug)}&parzelle=${encodeURIComponent(parzelle)}`;

  const res = await fetch(target, {
    headers: { "X-API-Key": key },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Engine /pdf antwortete ${res.status}: ${body.slice(0, 300)}`);
  }

  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
