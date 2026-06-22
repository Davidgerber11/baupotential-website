import Link from "next/link";
import VerifiedSuccess from "./VerifiedSuccess";

export default function SuccessPage() {
  return (
    <main className="relative flex min-h-screen w-screen items-center justify-center bg-[#f5f1e8] px-6 py-12 text-[#1d2731]">
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

        <VerifiedSuccess />

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
