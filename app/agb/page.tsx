"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { loadMapView, saveMapView } from "@/lib/mapView";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!token) {
  throw new Error("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
}

mapboxgl.accessToken = token;

export default function AGBPage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const view = loadMapView({ center: [7.4474, 46.9481], zoom: 15.7 });

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: view.center,
      zoom: view.zoom,
      interactive: true,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("moveend", () => saveMapView(map));

    map.on("click", (e) => {
      const lon = e.lngLat.lng;
      const lat = e.lngLat.lat;

      window.location.href = `/?lon=${lon}&lat=${lat}`;
    });

    map.on("load", () => {
      map.addSource("official-parcels", {
        type: "raster",
        tiles: [
          "https://wmts.geo.admin.ch/1.0.0/ch.kantone.cadastralwebmap-farbe/default/current/3857/{z}/{x}/{y}.png",
        ],
        tileSize: 512,
        minzoom: 14,
        maxzoom: 20,
      });

      map.addLayer({
        id: "swiss-map",
        type: "raster",
        source: "official-parcels",
        paint: {
          "raster-opacity": 0.55,
          "raster-saturation": -0.6,
          "raster-contrast": 0.15,
          "raster-brightness-min": 0.15,
          "raster-brightness-max": 0.95,
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#f5f1e8] text-[#1d2731]">
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[#f4eadc]/20" />

      <aside className="absolute left-6 top-6 z-10 flex max-h-[calc(100vh-48px)] w-[420px] flex-col overflow-y-auto rounded-[18px] bg-[#fbf7ef]/95 p-7 shadow-2xl backdrop-blur-md">
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

        <Link
          href="/"
          className="mb-4 text-sm font-medium text-[#a97937] hover:opacity-70"
        >
          ← Zurück zur Startseite
        </Link>

        <h1 className="mb-2 text-4xl font-bold tracking-tight">AGB</h1>
        <p className="mb-4 text-xs font-medium text-[#a97937]">
          Stand: 19. Mai 2026
        </p>

        <p className="mb-6 text-sm leading-relaxed text-[#42505c]">
          Diese Allgemeinen Geschäftsbedingungen, nachfolgend «AGB», regeln die
          Nutzung der Webseite lota-solutions.ch sowie den Kauf und die
          Zustellung von Baupotentialanalysen durch Lota, Kalcheggweg 20a, 3006
          Bern, Schweiz. Mit der Bestellung einer Analyse akzeptiert der Kunde
          diese AGB.
        </p>

        <div className="space-y-5 border-t border-[#e4d8c7] pt-5 text-sm leading-relaxed text-[#42505c]">
          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">1. Anbieter</h2>
            <p>
              Anbieter der Webseite und der Dienstleistungen ist Lota,
              Kalcheggweg 20a, 3006 Bern, Schweiz. E-Mail:{" "}
              <a
                href="mailto:info@lota-solutions.ch"
                className="font-medium text-[#a97937] hover:opacity-70"
              >
                info@lota-solutions.ch
              </a>
              , Telefon: +41 79 917 71 08.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              2. Gegenstand der Dienstleistung
            </h2>
            <p>
              Lota bietet kostenpflichtige Baupotentialanalysen für Grundstücke
              in der Schweiz an. Die Analyse basiert insbesondere auf öffentlich
              zugänglichen Informationen, Geodaten, Zonenplänen, Zonenordnungen,
              Baureglementen und weiteren Daten von Kantonen, Gemeinden oder
              anderen öffentlichen Stellen. Der Kunde gibt auf der Webseite eine
              Grundstückadresse ein und kann anschliessend eine
              Baupotentialanalyse bestellen. Nach erfolgreicher Bezahlung wird
              die Analyse an die vom Kunden angegebene E-Mail-Adresse zugestellt.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              3. Keine verbindliche baurechtliche Auskunft
            </h2>
            <p>
              Die von Lota erstellten Analysen dienen ausschliesslich der ersten
              Orientierung. Sie stellen keine verbindliche baurechtliche,
              planerische, architektonische, steuerliche, finanzielle oder
              rechtliche Beratung dar. Insbesondere wird keine Garantie
              übernommen für die Richtigkeit der verwendeten öffentlichen Daten,
              die Vollständigkeit der Analyse, die Aktualität von Zonenplänen,
              Baureglementen oder Geodaten, die tatsächliche Bebaubarkeit eines
              Grundstücks, die Erteilung einer Baubewilligung, die
              wirtschaftliche Verwertbarkeit eines Grundstücks, die Zustimmung
              von Behörden, Nachbarn oder Dritten sowie die Übereinstimmung mit
              Sondervorschriften, Dienstbarkeiten, privatrechtlichen
              Einschränkungen oder zukünftigen Rechtsänderungen. Massgebend sind
              immer die aktuell rechtsgültigen Unterlagen sowie die verbindlichen
              Auskünfte und Entscheide der zuständigen Gemeinde, des Kantons und
              weiterer Behörden.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">4. Bestellung</h2>
            <p>
              Der Kunde bestellt eine Analyse, indem er die erforderlichen
              Angaben eingibt, die AGB und Datenschutzerklärung akzeptiert und
              die Zahlung abschliesst. Erforderlich sind insbesondere
              Grundstückadresse, Name und E-Mail-Adresse des Kunden sowie
              Zahlungsinformationen beim Zahlungsanbieter. Der Kunde ist dafür
              verantwortlich, dass die eingegebenen Angaben vollständig und
              korrekt sind. Fehlerhafte oder unvollständige Angaben können dazu
              führen, dass die Analyse nicht oder nur eingeschränkt erstellt
              werden kann.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              5. Grundstücke Dritter
            </h2>
            <p>
              Der Kunde kann auch eine Grundstückadresse eingeben, die ihm nicht
              selbst gehört. Der Kunde ist jedoch selbst dafür verantwortlich,
              dass er durch die Abfrage keine Rechte Dritter verletzt. Lota
              erhebt keine Eigentümerdaten und zeigt keine Eigentümerdaten an.
              Die Analyse bezieht sich auf öffentlich zugängliche Grundstück-,
              Zonen- und Baureglementsdaten.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              6. Preise und Zahlung
            </h2>
            <p>
              Die auf der Webseite angegebenen Preise gelten zum Zeitpunkt der
              Bestellung. Die Zahlung erfolgt online über den
              Zahlungsdienstleister Stripe. Je nach Verfügbarkeit können
              insbesondere Kreditkarte, TWINT, Apple Pay sowie weitere von
              Stripe unterstützte Zahlungsmittel angeboten werden. Die Analyse
              wird grundsätzlich erst nach erfolgreicher Zahlung erstellt oder
              zugestellt.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              7. Zustellung der Analyse
            </h2>
            <p>
              Die Analyse wird nach erfolgreicher Zahlung an die vom Kunden
              angegebene E-Mail-Adresse gesendet. Der Kunde ist dafür
              verantwortlich, eine korrekte und erreichbare E-Mail-Adresse
              anzugeben. Kann die Analyse aufgrund einer falschen E-Mail-Adresse
              nicht zugestellt werden, besteht kein Anspruch auf Rückerstattung,
              sofern Lota die Analyse ordnungsgemäss erstellt und an die
              angegebene Adresse versendet hat. Sollte der Kunde die Analyse
              nicht erhalten, kann er sich per E-Mail an info@lota-solutions.ch
              wenden.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              8. Kein Widerrufsrecht nach Zustellung
            </h2>
            <p>
              Da es sich bei der Baupotentialanalyse um ein individuell für den
              Kunden erstelltes digitales Produkt handelt, besteht nach Beginn
              der Erstellung oder nach Zustellung der Analyse grundsätzlich kein
              Anspruch auf Widerruf, Rückgabe oder Rückerstattung. Eine
              Rückerstattung erfolgt nur, wenn Lota die bezahlte Analyse aus
              Gründen, die Lota zu vertreten hat, nicht erstellen oder nicht
              zustellen kann.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              9. Fehlerhafte oder unvollständige Analyse
            </h2>
            <p>
              Sollte eine Analyse offensichtlich fehlerhaft, unvollständig oder
              technisch mangelhaft sein, kann der Kunde Lota innert 10 Tagen nach
              Erhalt per E-Mail informieren. Lota kann nach eigenem Ermessen die
              Analyse korrigieren, eine neue Analyse zustellen oder den
              Kaufpreis ganz oder teilweise zurückerstatten. Weitergehende
              Ansprüche sind, soweit gesetzlich zulässig, ausgeschlossen.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              10. Datenquellen und Datenqualität
            </h2>
            <p>
              Lota verwendet öffentlich zugängliche Datenquellen, insbesondere
              kantonale und kommunale Geodaten, Zonenpläne, Zonenordnungen,
              Baureglemente und weitere öffentlich verfügbare Informationen. Lota
              hat keinen Einfluss auf die Richtigkeit, Vollständigkeit und
              Aktualität dieser Datenquellen. Die Analyse kann deshalb Fehler,
              Lücken oder veraltete Informationen enthalten. Der Kunde nimmt zur
              Kenntnis, dass eine abschliessende Beurteilung eines Bauvorhabens
              nur durch die zuständigen Behörden oder geeignete Fachpersonen
              erfolgen kann.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              11. Pflichten des Kunden
            </h2>
            <p>
              Der Kunde verpflichtet sich, korrekte Angaben zu machen, keine
              missbräuchlichen, rechtswidrigen oder automatisierten
              Massenabfragen vorzunehmen, die Webseite nicht zu stören, zu
              überlasten oder technisch zu manipulieren, die Analyse nicht
              irreführend als behördlich bestätigte oder rechtsverbindliche
              Auskunft darzustellen, Rechte Dritter zu beachten und die Analyse
              nur im gesetzlich zulässigen Rahmen zu verwenden.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              12. Nutzungsrechte an der Analyse
            </h2>
            <p>
              Nach vollständiger Zahlung erhält der Kunde das Recht, die
              zugestellte Analyse für eigene private oder geschäftliche Zwecke zu
              verwenden. Ohne schriftliche Zustimmung von Lota ist es nicht
              erlaubt, Analysen systematisch weiterzuverkaufen, Inhalte
              automatisiert auszulesen, die Analyse als eigenes Produkt
              anzubieten, Datenbanken aus den Analysen aufzubauen oder Inhalte
              massenhaft zu vervielfältigen oder öffentlich zugänglich zu machen.
              Die Weitergabe einer einzelnen Analyse an eigene Berater,
              Architekten, Planer, Banken, Investoren oder Projektpartner ist
              zulässig, sofern sie im Zusammenhang mit dem geprüften Grundstück
              erfolgt.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              13. Geistiges Eigentum
            </h2>
            <p>
              Alle Rechte an der Webseite, den Texten, Berechnungsmethoden,
              Darstellungen, Strukturen, Designs, Marken, Logos, Auswertungen
              und sonstigen Inhalten verbleiben bei Lota oder den jeweiligen
              Rechteinhabern. Öffentlich zugängliche Datenquellen bleiben
              Eigentum der jeweiligen Anbieter oder Behörden. Allfällige
              Nutzungsbedingungen dieser Datenquellen bleiben vorbehalten.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              14. Verfügbarkeit der Webseite
            </h2>
            <p>
              Lota bemüht sich, die Webseite möglichst störungsfrei verfügbar zu
              halten. Eine jederzeitige Verfügbarkeit wird jedoch nicht
              garantiert. Lota kann den Betrieb der Webseite jederzeit ganz oder
              teilweise einschränken, unterbrechen oder einstellen, insbesondere
              aus technischen, wirtschaftlichen, rechtlichen oder
              sicherheitsrelevanten Gründen.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">15. Haftung</h2>
            <p>
              Lota haftet nur für direkte Schäden, die durch absichtliches oder
              grobfahrlässiges Verhalten verursacht wurden. Soweit gesetzlich
              zulässig, ist jede weitere Haftung ausgeschlossen, insbesondere für
              indirekte Schäden, Folgeschäden, entgangenen Gewinn, verpasste
              Geschäftsmöglichkeiten, Investitionsentscheide aufgrund der
              Analyse, Planungs-, Projektierungs- oder Baukosten, behördliche
              Ablehnungen, fehlerhafte, unvollständige oder veraltete öffentliche
              Daten, technische Störungen, Nichtverfügbarkeit der Webseite sowie
              Fehler von Drittanbietern, insbesondere Zahlungs-, Hosting-,
              Karten- oder E-Mail-Dienstleistern. Die Haftung für Personenschäden
              sowie für zwingend gesetzlich vorgeschriebene Haftung bleibt
              vorbehalten.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">16. Drittanbieter</h2>
            <p>
              Für den Betrieb der Webseite und die Erbringung der Dienstleistung
              können Drittanbieter eingesetzt werden, insbesondere
              Zahlungsdienstleister, Hosting-Anbieter, Kartenanbieter,
              Cloud-Dienste und E-Mail-Dienstleister. Lota haftet nicht für
              Leistungen, Fehler, Ausfälle oder Datenschutzpraktiken solcher
              Drittanbieter, soweit dies gesetzlich zulässig ist.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">17. Datenschutz</h2>
            <p>
              Die Bearbeitung von Personendaten richtet sich nach der{" "}
              <Link
                href="/datenschutz"
                className="font-medium text-[#a97937] hover:opacity-70"
              >
                Datenschutzerklärung
              </Link>{" "}
              von Lota. Diese ist auf der Webseite abrufbar. Mit der Nutzung der
              Webseite und der Bestellung einer Analyse nimmt der Kunde die
              Datenschutzerklärung zur Kenntnis.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              18. Änderungen der AGB
            </h2>
            <p>
              Lota kann diese AGB jederzeit ändern. Es gilt jeweils die auf der
              Webseite veröffentlichte Fassung zum Zeitpunkt der Bestellung. Für
              bereits abgeschlossene Bestellungen gelten die AGB, die im
              Zeitpunkt der Bestellung gültig waren.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              19. Salvatorische Klausel
            </h2>
            <p>
              Sollte eine Bestimmung dieser AGB unwirksam oder nicht
              durchsetzbar sein, bleibt die Wirksamkeit der übrigen Bestimmungen
              unberührt. Die unwirksame Bestimmung wird durch eine rechtlich
              zulässige Bestimmung ersetzt, die dem wirtschaftlichen Zweck der
              ursprünglichen Bestimmung möglichst nahekommt.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              20. Anwendbares Recht und Gerichtsstand
            </h2>
            <p>
              Diese AGB unterstehen Schweizer Recht. Gerichtsstand ist, soweit
              gesetzlich zulässig, Bern, Schweiz. Zwingende gesetzliche
              Gerichtsstände bleiben vorbehalten.
            </p>
          </section>
        </div>

        <footer className="mt-7 flex gap-4 border-t border-[#e4d8c7] pt-5 text-xs text-[#42505c]">
          <Link href="/" className="hover:text-[#a97937]">
            Startseite
          </Link>
          <Link href="/aboutus" className="hover:text-[#a97937]">
            Über uns
          </Link>
          <Link href="/datenschutz" className="hover:text-[#a97937]">
            Datenschutz
          </Link>
          <Link href="/impressum" className="hover:text-[#a97937]">
            Impressum
          </Link>
        </footer>
      </aside>
    </main>
  );
}
