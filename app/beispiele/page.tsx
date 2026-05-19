import Link from "next/link";

type Row = { label: string; value: string };

type Example = {
  id: string;
  title: string;
  municipality: string;
  summary: string;
  map: string;
  grundstueck: Row[];
  zone: string;
  grenzabstaende: Row[];
  annahme?: string;
  ergebnis: Row[];
  quellen: { baureglement: string; geodaten: string };
};

const examples: Example[] = [
  {
    id: "aarau-3096",
    title: "Grundstück 3096",
    municipality: "Aarau",
    summary:
      "Unter Berücksichtigung der Grenzabstände resultiert eine bebaubare Grundfläche von ca. 327 m².",
    map: "/examples/aarau-3096-map.png",
    grundstueck: [
      { label: "Parzelle Nr.", value: "601" },
      { label: "Fläche", value: "702 m²" },
      { label: "Gemeinde", value: "Aarau" },
    ],
    zone: "Wohnzone 2, Ausnützungsziffer von 50 %",
    grenzabstaende: [
      { label: "Kleiner Grenzabstand", value: "4 m" },
      { label: "Grosser Grenzabstand", value: "4 m" },
    ],
    annahme: "Grosser Grenzabstand auf südorientierter Längsseite",
    ergebnis: [
      { label: "Bebaubare Grundfläche", value: "ca. 327 m²" },
      { label: "Realisierbare Geschossfläche", value: "351 m²" },
    ],
    quellen: {
      baureglement: "Gemeinde Aarau",
      geodaten: "Kanton Aarau",
    },
  },
  {
    id: "muri-bei-bern-601",
    title: "Grundstück 601",
    municipality: "Muri bei Bern",
    summary:
      "Unter Berücksichtigung der Grenzabstände resultiert eine bebaubare Grundfläche von ca. 195 m².",
    map: "/examples/muri-bei-bern-601-map.png",
    grundstueck: [
      { label: "Parzelle", value: "601" },
      { label: "Gemeinde", value: "Muri bei Bern" },
    ],
    zone: "Wohnzone, 2 Geschosse, anrechenbare Gebäudefläche 240 m²",
    grenzabstaende: [
      { label: "Kleiner Grenzabstand", value: "6 m" },
      { label: "Grosser Grenzabstand", value: "13 m" },
    ],
    annahme: "Grosser Grenzabstand auf südorientierter Längsseite",
    ergebnis: [{ label: "Bebaubare Grundfläche", value: "ca. 195 m²" }],
    quellen: {
      baureglement: "Gemeinde Muri bei Bern",
      geodaten: "Kanton Bern, Amtliche Vermessung (MOPUBE)",
    },
  },
  {
    id: "zuerich-ho4374",
    title: "Grundstück HO4374",
    municipality: "Zürich",
    summary:
      "Unter Berücksichtigung der Grenzabstände resultiert eine bebaubare Grundfläche von ca. 278 m².",
    map: "/examples/zuerich-ho4374-map.png",
    grundstueck: [
      { label: "Parzelle", value: "HO4374" },
      { label: "Fläche", value: "825 m²" },
      { label: "Gemeinde", value: "Zürich" },
    ],
    zone: "Wohnzone, 2 Geschosse, Ausnützungsziffer von 40 %",
    grenzabstaende: [
      { label: "Kleiner Grenzabstand", value: "5 m" },
      { label: "Strassenabstand", value: "bis Baulinie" },
    ],
    ergebnis: [
      { label: "Bebaubare Grundfläche", value: "ca. 278 m²" },
      { label: "Realisierbare Geschossfläche", value: "330 m²" },
    ],
    quellen: {
      baureglement: "Gemeinde Zürich",
      geodaten: "Kanton Zürich, amtliche Vermessungen",
    },
  },
];

function DataBlock({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#a97937]">
        {title}
      </h3>
      <dl className="space-y-1.5 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-4">
            <dt className="text-[#52606b]">{r.label}</dt>
            <dd className="text-right font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function BeispielePage() {
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#1d2731]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/" className="mb-8 flex items-center gap-3">
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
          className="mb-6 inline-block text-sm font-medium text-[#a97937] hover:opacity-70"
        >
          ← Zurück zur Suche
        </Link>

        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          Beispiel-Analysen
        </h1>
        <p className="mb-10 max-w-2xl text-sm leading-relaxed text-[#42505c]">
          So sieht eine Baupotentialanalyse von Lota aus. Jede Analyse zeigt die
          bebaubare Grundfläche auf Basis der Grenzabstände – mit
          Kartendarstellung des Grundstücks und den wichtigsten Eckdaten.
        </p>

        <div className="space-y-10">
          {examples.map((ex) => (
            <article
              key={ex.id}
              className="overflow-hidden rounded-[18px] bg-[#fbf7ef] shadow-lg"
            >
              <div className="grid lg:grid-cols-2">
                <div className="flex items-center bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ex.map}
                    alt={`Bebaubare Grundfläche – ${ex.title}, ${ex.municipality}`}
                    className="w-full rounded-[10px]"
                  />
                </div>

                <div className="flex flex-col gap-5 p-7">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-[#a97937]">
                      {ex.municipality}
                    </div>
                    <h2 className="mt-1 text-2xl font-bold">{ex.title}</h2>
                  </div>

                  <p className="rounded-xl bg-[#f2eadf] p-4 text-sm font-medium leading-relaxed">
                    {ex.summary}
                  </p>

                  <DataBlock title="Grundstück" rows={ex.grundstueck} />

                  <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#a97937]">
                      Zone
                    </h3>
                    <p className="text-sm">{ex.zone}</p>
                  </div>

                  <DataBlock
                    title="Grenzabstände"
                    rows={ex.grenzabstaende}
                  />

                  {ex.annahme && (
                    <p className="text-xs italic text-[#52606b]">
                      Annahme: {ex.annahme}
                    </p>
                  )}

                  <div className="rounded-xl border border-[#e4d8c7] bg-white p-4">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#a97937]">
                      Ergebnis
                    </h3>
                    <dl className="space-y-1.5">
                      {ex.ergebnis.map((r) => (
                        <div
                          key={r.label}
                          className="flex justify-between gap-4 text-sm font-bold"
                        >
                          <dt>{r.label}</dt>
                          <dd className="text-right">{r.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="text-xs leading-relaxed text-[#7a8089]">
                    <span className="font-semibold text-[#52606b]">
                      Quellen:
                    </span>{" "}
                    Baureglement {ex.quellen.baureglement} · Amtliche Geodaten{" "}
                    {ex.quellen.geodaten}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-[#f2eadf] p-5 text-xs leading-relaxed text-[#52606b]">
          Die Analysen berücksichtigen ausschliesslich die Grenzabstände.
          Weitere baurechtliche und projektbezogene Einschränkungen wurden nicht
          berücksichtigt. Es handelt sich um eine unverbindliche
          Ersteinschätzung, die keine behördliche Auskunft ersetzt.
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="rounded-xl bg-[#1d2731] px-6 py-3 text-sm font-medium text-white transition hover:bg-black"
          >
            Eigene Analyse starten
          </Link>
        </div>

        <footer className="mt-10 flex flex-wrap gap-4 border-t border-[#e4d8c7] pt-6 text-xs text-[#42505c]">
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
          <Link href="/impressum" className="hover:text-[#a97937]">
            Impressum
          </Link>
        </footer>
      </div>
    </main>
  );
}
