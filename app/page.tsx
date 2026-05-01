export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="max-w-xl text-center space-y-6">
        
        <h1 className="text-4xl font-semibold">
          Baupotential für Ihr Grundstück
        </h1>

        <p className="text-lg text-gray-600">
          Erhalten Sie eine erste Einschätzung zur bebaubaren Fläche Ihres Grundstücks – schnell und einfach.
        </p>

        <a
          href="/order"
          className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition"
        >
          Grundstück prüfen lassen
        </a>

      </div>
    </main>
  );
}