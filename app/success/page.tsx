import Link from "next/link";
import ConversionTracker from "./ConversionTracker";

export default function SuccessPage() {
  return (
    <main className="relative flex min-h-screen w-screen items-center justify-center bg-[#f5f1e8] px-6 py-12 text-[#1d2731]">
      <ConversionTracker />
      <section className="w-full max-w-[480px] rounded-[18px] bg-[#fbf7ef] p-8 shadow-2xl">
        <Link href="/" className="mb-6 flex items-center gap-3">
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

        <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#2f8f56]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2f8f56] text-white">
            ✓
          </span>
          Zahlung erfolgreich
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight">
          Vielen Dank für deine Bestellung!
        </h1>

        <p className="mb-4 text-sm leading-relaxed text-[#42505c]">
          Wir haben deine Zahlung erhalten und erstellen jetzt deine
          Baupotenzialanalyse.
        </p>

        <p className="mb-6 text-sm leading-relaxed text-[#42505c]">
          Du erhältst die fertige PDF-Analyse innerhalb von 24 Stunden per
          E-Mail. Bitte prüfe ggf. auch deinen Spam-Ordner.
        </p>

        <div className="mb-6 rounded-md border border-[#e4d8c7] bg-white/60 p-4 text-xs leading-relaxed text-[#42505c]">
          Du hast Fragen oder hast keine E-Mail erhalten? Melde dich bei{" "}
          <a
            href="mailto:info@lota-solutions.ch"
            className="font-medium text-[#a97937] hover:opacity-70"
          >
            info@lota-solutions.ch
          </a>
          .
        </div>

        <Link
          href="/"
          className="block w-full rounded-xl bg-[#1d2731] py-3 text-center font-medium text-white transition hover:bg-black"
        >
          Zurück zur Startseite
        </Link>

        <footer className="mt-7 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-[#e4d8c7] pt-5 text-xs text-[#42505c]">
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
      </section>
    </main>
  );
}
