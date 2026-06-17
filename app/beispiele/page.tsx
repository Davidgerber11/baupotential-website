import Link from "next/link";

// Das echte, ausgelieferte Produkt (Engine-Export) als Beispiel.
const PDF = "/examples/zuerich-ho4374.pdf";

const facts = [
  { label: "Parzelle", value: "HO4374, Zürich" },
  { label: "Zone", value: "Wohnzone, 2 Geschosse" },
  { label: "Bebaubare Grundfläche", value: "ca. 278 m²" },
  { label: "Realisierbare Geschossfläche", value: "330 m²" },
];

export default function BeispielePage() {
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#1d2731]">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c79b5a] text-[#b17a2e]">
            ⌂
          </div>
          <div>
            <div className="text-3xl font-bold leading-none">Lota</div>
            <div className="mt-1 text-xs font-medium text-[#a97937]">
              Baupotential-Analyse für Schweizer Grundstücke
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
          So sieht Ihr Bericht aus
        </h1>
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-[#42505c]">
          Das unten ist <strong>genau das PDF, das Sie erhalten</strong> — hier
          für ein Grundstück in Zürich. Lota berechnet aus Zonenplan und
          Baureglement die bebaubare Grundfläche und liefert sie als Bericht mit
          Kartendarstellung.
        </p>

        {/* Eckdaten dieses Beispiels */}
        <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-4 rounded-xl bg-[#fbf7ef] p-5 shadow sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label}>
              <div className="text-xs text-[#7a8089]">{f.label}</div>
              <div className="mt-0.5 text-sm font-semibold">{f.value}</div>
            </div>
          ))}
        </div>

        {/* Das echte PDF eingebettet */}
        <div className="overflow-hidden rounded-[18px] bg-[#fbf7ef] p-3 shadow-lg">
          <object
            data={PDF}
            type="application/pdf"
            className="h-[82vh] w-full rounded-[10px]"
            aria-label="Beispiel-Bericht Zürich HO4374"
          >
            <iframe
              src={PDF}
              title="Beispiel-Bericht Zürich HO4374"
              className="h-[82vh] w-full rounded-[10px]"
            />
          </object>
        </div>

        <div className="mt-4 flex justify-center">
          <a
            href={PDF}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#b6843b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a3742f]"
          >
            📄 Beispiel-Bericht als PDF öffnen
          </a>
        </div>

        <div className="mt-10 rounded-xl bg-[#f2eadf] p-5 text-xs leading-relaxed text-[#52606b]">
          Die Analyse berücksichtigt ausschliesslich die Grenzabstände. Weitere
          baurechtliche und projektbezogene Einschränkungen wurden nicht
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
