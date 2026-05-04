import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* NAV */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xl font-semibold tracking-tight">
          Baupotential
        </div>

        <nav className="flex gap-3 text-sm">
          <Link
            href="#about"
            className="rounded-full border border-black px-4 py-2 hover:bg-black hover:text-white transition"
          >
            Über uns
          </Link>

          <Link
            href="#how"
            className="rounded-full border border-black px-4 py-2 hover:bg-black hover:text-white transition"
          >
            Wie ermitteln wir Ihr Baupotential?
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 pb-28 text-center">
        <h1 className="max-w-4xl text-5xl font-medium leading-tight tracking-tight md:text-6xl">
          Baupotential für Ihr Grundstück bestimmen
        </h1>

        <p className="mt-8 max-w-2xl text-xl leading-relaxed text-gray-700">
          Erhalten Sie eine erste Einschätzung zur bebaubaren Fläche Ihres
          Grundstücks – schnell, verständlich und auf Basis amtlicher Geodaten.
        </p>

        <Link
  href="/order"
  className="mt-12 rounded-2xl border-2 border-black px-8 py-4 text-xl font-medium hover:bg-black hover:text-white transition"
>
  Jetzt Ihr Grundstück finden
</Link>

{/* TRUST LOGO */}
<div className="mt-10 flex flex-col items-center">
  <p className="text-sm text-gray-500 mb-3">
    Entwickelt im Rahmen eines Projekts am
  </p>

  <img
    src="/Pictures/logos/eth-projecthouse.png"
    alt="ETH Student Project House"
    className="h-50 object-contain opacity-80"
  />
</div>

        <p className="mt-24 max-w-3xl text-3xl leading-snug">
          Innerhalb von 48 Stunden erhalten Sie Ihre Baupotentialanalyse als
          übersichtliches PDF.
        </p>
      </section>

      {/* WHAT YOU GET */}
      <section className="border-t border-gray-200 bg-[#e4f7e9] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-medium tracking-tight">
            Was erhalten Sie?
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Bebaubare Fläche</h3>
              <p className="mt-3 text-gray-700">
                Eine erste Abschätzung der möglichen bebaubaren Grundfläche in
                Quadratmetern.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Grenzabstände</h3>
              <p className="mt-3 text-gray-700">
                Visualisierung der relevanten Grenzabstände auf Ihrem
                Grundstück.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Zoneninformationen</h3>
              <p className="mt-3 text-gray-700">
                Einordnung Ihres Grundstücks anhand der öffentlich verfügbaren
                Zonendaten.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">PDF-Auswertung</h3>
              <p className="mt-3 text-gray-700">
                Ein kompaktes Dokument, das Sie für erste Überlegungen oder
                Gespräche verwenden können.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-medium tracking-tight">
            So funktioniert es
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-black p-6">
              <div className="text-5xl font-medium">1</div>
              <h3 className="mt-6 text-xl font-semibold">
                Grundstück auswählen
              </h3>
              <p className="mt-3 text-gray-700">
                Suchen Sie Ihre Adresse oder wählen Sie die Parzelle direkt auf
                der Karte aus.
              </p>
            </div>

            <div className="rounded-2xl border border-black p-6">
              <div className="text-5xl font-medium">2</div>
              <h3 className="mt-6 text-xl font-semibold">
                Angaben bestätigen
              </h3>
              <p className="mt-3 text-gray-700">
                Bestätigen Sie die ausgewählte Liegenschaft und ergänzen Sie
                Ihre Kontaktdaten.
              </p>
            </div>

            <div className="rounded-2xl border border-black p-6">
              <div className="text-5xl font-medium">3</div>
              <h3 className="mt-6 text-xl font-semibold">
                Analyse erhalten
              </h3>
              <p className="mt-3 text-gray-700">
                Wir prüfen das Grundstück manuell und senden Ihnen die Analyse
                innerhalb von 48 Stunden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EXAMPLE / TRUST */}
      <section id="about" className="bg-gray-50 px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-4xl font-medium tracking-tight">
              Verständlich statt kompliziert
            </h2>

            <p className="mt-6 text-lg leading-relaxed text-gray-700">
              Unsere Analyse basiert auf amtlichen Geodaten und einer manuellen
              Erstbeurteilung. Sie ersetzt keine verbindliche baurechtliche
              Prüfung, hilft aber, das Potential eines Grundstücks schnell
              besser einzuordnen.
            </p>

            <ul className="mt-8 space-y-3 text-gray-800">
              <li>✓ Amtliche Geodaten als Grundlage</li>
              <li>✓ Manuelle Plausibilitätsprüfung</li>
              <li>✓ Kompakte PDF-Auswertung</li>
              <li>✓ Ideal für erste Abklärungen</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="rounded-2xl bg-[#e4f7e9] p-6">
              <p className="text-sm text-gray-600">Beispielanalyse</p>

              <h3 className="mt-4 text-2xl font-semibold">
                Grundstück 601, Muri bei Bern
              </h3>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span>Parzelle</span>
                  <strong>601</strong>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Zone</span>
                  <strong>Wohnzone</strong>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Grenzabstände</span>
                  <strong>6 m / 13 m</strong>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Bebaubare Grundfläche</span>
                  <strong>ca. 195 m²</strong>
                </div>
              </div>

              <p className="mt-6 text-xs text-gray-600">
                Beispielhafte Darstellung. Die tatsächliche Analyse hängt von
                Gemeinde, Zone und Grundstückssituation ab.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-24 text-center">
        <h2 className="text-4xl font-medium tracking-tight">
          Bereit, Ihr Grundstück zu prüfen?
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-700">
          Starten Sie mit der Auswahl Ihrer Parzelle. Die eigentliche Analyse
          erfolgt anschliessend manuell.
        </p>

        <Link
          href="/order"
          className="mt-10 inline-block rounded-2xl bg-black px-8 py-4 text-xl font-medium text-white hover:bg-gray-800 transition"
        >
          Grundstück analysieren
        </Link>
      </section>
    </main>
  );
}