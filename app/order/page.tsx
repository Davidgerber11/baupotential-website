export default function OrderPage() {
  return (
    <main className="min-h-screen bg-white text-black px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <a href="/" className="text-sm text-gray-500 hover:text-black">
            ← Zurück
          </a>

          <h1 className="mt-6 text-3xl font-semibold">
            Grundstück prüfen lassen
          </h1>

          <p className="mt-3 text-gray-600">
            Geben Sie die wichtigsten Angaben zu Ihrem Grundstück ein. Wir
            prüfen das Baupotential manuell und melden uns per E-Mail.
          </p>
        </div>

        <form className="space-y-5">
          <input
            className="w-full border border-gray-300 rounded-md px-4 py-3"
            placeholder="Name"
          />

          <input
            className="w-full border border-gray-300 rounded-md px-4 py-3"
            placeholder="E-Mail"
            type="email"
          />

          <input
            className="w-full border border-gray-300 rounded-md px-4 py-3"
            placeholder="Adresse des Grundstücks"
          />

          <input
            className="w-full border border-gray-300 rounded-md px-4 py-3"
            placeholder="Parzellennummer (optional)"
          />

          <textarea
            className="w-full border border-gray-300 rounded-md px-4 py-3 min-h-32"
            placeholder="Zusätzliche Hinweise"
          />

          <button
            type="submit"
            className="w-full bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition"
          >
            Anfrage absenden
          </button>
        </form>
      </div>
    </main>
  );
}