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

export default function DatenschutzPage() {
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

        <h1 className="mb-2 text-4xl font-bold tracking-tight">Datenschutz</h1>
        <p className="mb-4 text-xs font-medium text-[#a97937]">
          Stand: 21. Juni 2026
        </p>

        <p className="mb-6 text-sm leading-relaxed text-[#42505c]">
          Diese Datenschutzerklärung informiert darüber, wie Lota, Kalcheggweg
          20a, 3006 Bern, Schweiz, Personendaten im Zusammenhang mit der Webseite
          lota-solutions.ch bearbeitet. Wir richten unser Angebot in erster Linie
          an Personen in der Schweiz. Die Bearbeitung von Personendaten erfolgt
          nach dem Schweizer Datenschutzgesetz. Soweit im Einzelfall weitere
          Datenschutzgesetze anwendbar sind, halten wir auch diese ein.
        </p>

        <div className="space-y-5 border-t border-[#e4d8c7] pt-5 text-sm leading-relaxed text-[#42505c]">
          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              1. Verantwortliche Stelle
            </h2>
            <p>
              Verantwortlich für die Datenbearbeitung ist Lota, Kalcheggweg 20a,
              3006 Bern, Schweiz. E-Mail:{" "}
              <a
                href="mailto:info@lota-solutions.ch"
                className="font-medium text-[#a97937] hover:opacity-70"
              >
                info@lota-solutions.ch
              </a>
              , Telefon: +41 79 917 71 08. Für Fragen zum Datenschutz oder zur
              Ausübung von Datenschutzrechten können sich betroffene Personen an
              die oben genannte E-Mail-Adresse wenden.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              2. Zweck der Webseite
            </h2>
            <p>
              Lota bietet Nutzern die Möglichkeit, für ein Grundstück eine
              Baupotentialanalyse anzufragen. Die Analyse basiert insbesondere
              auf öffentlich zugänglichen Geodaten, Zonenordnungen, Zonenplänen,
              Baureglementen und weiteren öffentlich verfügbaren Informationen
              der Kantone, Gemeinden oder anderer öffentlicher Stellen. Nutzer
              können eine Grundstückadresse eingeben. Wenn sie eine Berechnung
              oder Analyse erhalten möchten, geben sie zusätzlich ihren Namen und
              ihre E-Mail-Adresse an und werden anschliessend zu einer
              Zahlungsoption weitergeleitet. Nach erfolgreicher Bezahlung wird
              die Analyse per E-Mail zugestellt.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              3. Welche Personendaten wir bearbeiten
            </h2>
            <p>
              Wir bearbeiten nur diejenigen Personendaten, die für den Betrieb
              der Webseite, die Bearbeitung der Anfrage, die Erstellung der
              Analyse, die Zahlungsabwicklung und die Zustellung des Produkts
              erforderlich oder zweckmässig sind. Dazu gehören insbesondere Name
              und E-Mail-Adresse des Kunden, die eingegebene Grundstückadresse,
              Angaben zur Bestellung, Zahlungsstatus, Datum und Zeitpunkt der
              Anfrage, die erstellte Analyse sowie technische Daten, die beim
              Besuch der Webseite aus Sicherheits- oder Betriebsgründen anfallen
              können. Wir erfassen keine Nutzerkonten und bieten keinen
              Login-Bereich an.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              4. Grundstückdaten und öffentliche Datenquellen
            </h2>
            <p>
              Für die Baupotentialanalyse verwenden wir öffentlich zugängliche
              Daten, insbesondere Geodaten, Zonenpläne, Zonenordnungen,
              Baureglemente und weitere öffentlich verfügbare Informationen von
              Kantonen, Gemeinden oder anderen öffentlichen Stellen. Die
              eingegebene Grundstückadresse muss nicht zwingend dem Nutzer
              gehören. Wir erheben jedoch keine Eigentümerdaten und zeigen solche
              auch nicht an. Die verwendeten öffentlichen Daten können
              unvollständig, veraltet oder fehlerhaft sein. Rechtsverbindlich
              sind ausschliesslich die Angaben und Entscheide der zuständigen
              Behörden.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              5. Zwecke der Datenbearbeitung
            </h2>
            <p>
              Wir bearbeiten Personendaten insbesondere für den Betrieb und die
              Bereitstellung der Webseite, die Entgegennahme von
              Grundstückabfragen, die Prüfung von Zonenordnung, Baureglementen
              und öffentlich zugänglichen Geodaten, die Erstellung von
              Baupotentialanalysen, die Abwicklung von Bestellungen, die
              Zahlungsabwicklung, die Zustellung der Analyse per E-Mail, die
              Kommunikation mit Kunden, die Beantwortung von Rückfragen, die
              interne Dokumentation, die Qualitätssicherung, die Abwehr von
              Missbrauch, Betrug oder technischen Störungen, die Erfüllung
              gesetzlicher Pflichten sowie die Durchsetzung oder Abwehr
              rechtlicher Ansprüche. Wir verwenden die Daten aktuell nicht für
              Newsletter, Nutzerprofile oder personalisierte Werbung.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              6. Keine verbindliche baurechtliche Auskunft
            </h2>
            <p>
              Die von Lota erstellten Analysen dienen der ersten Orientierung.
              Sie stellen keine verbindliche baurechtliche, planerische,
              architektonische, steuerliche, finanzielle oder rechtliche
              Beratung dar. Insbesondere kann keine Garantie übernommen werden
              für die Richtigkeit der verwendeten öffentlichen Daten, die
              Vollständigkeit der Analyse, die Aktualität von Zonenplänen oder
              Baureglementen, die tatsächliche Bebaubarkeit eines Grundstücks,
              die Erteilung einer Baubewilligung, die wirtschaftliche
              Verwertbarkeit eines Grundstücks sowie behördliche Entscheide.
              Massgebend sind immer die aktuell rechtsgültigen Unterlagen sowie
              die Auskünfte und Entscheide der zuständigen Behörden.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              7. Zahlungsabwicklung
            </h2>
            <p>
              Zahlungen auf lota-solutions.ch werden über Stripe abgewickelt.
              Stripe kann je nach Zahlungsart Daten wie Name, E-Mail-Adresse,
              Zahlungsbetrag, Zahlungsmittel, Transaktionsdaten und technische
              Zahlungsinformationen bearbeiten. Bei Zahlungen mit Kreditkarte,
              TWINT oder Apple Pay erfolgt die eigentliche Zahlungsabwicklung
              über Stripe oder über die jeweils beteiligten Zahlungsanbieter. Wir
              speichern selbst keine vollständigen Kreditkartendaten. Stripe
              informiert in der eigenen Datenschutzerklärung darüber, welche
              personenbezogenen Daten erhoben, verwendet und weitergegeben
              werden.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              8. Weitergabe von Daten an Dritte
            </h2>
            <p>
              Wir geben Personendaten nur weiter, soweit dies für den Betrieb
              der Webseite, die Erstellung der Analyse, die Zahlungsabwicklung,
              die Zustellung des Produkts oder aus rechtlichen Gründen
              erforderlich oder zweckmässig ist. Mögliche Empfänger sind
              insbesondere Hosting-Anbieter (voraussichtlich AWS oder Google
              Cloud), Zahlungsdienstleister (insbesondere Stripe), der
              Terminbuchungs-Dienst Cal.com, E-Mail-Dienstleister, Karten- und Geodatenanbieter (insbesondere
              Mapbox), Cloud-Speicher oder interne Ablagesysteme, technische
              Dienstleister sowie Behörden, Gerichte oder Rechtsberater, falls
              dies rechtlich erforderlich ist. Wenn Nutzerinnen und Nutzer über
              die Webseite ein kostenloses Beratungsgespräch buchen, werden die
              dafür eingegebenen Daten (Name, E-Mail-Adresse, angegebene
              Grundstückadresse sowie allfällige Notizen) durch den
              Terminbuchungs-Dienst Cal.com (Cal.com, Inc.) bearbeitet. Wir
              nutzen die EU-Instanz von Cal.com (app.cal.eu); die Buchungsdaten
              werden auf Servern in der EU bearbeitet. Cal.com informiert in der
              eigenen Datenschutzerklärung über die Bearbeitung. Eine Weitergabe
              von Kundenanfragen an Architekten, Makler, Investoren, Bauunternehmen
              oder andere externe Partner findet aktuell nicht statt.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              9. Hosting, Cloud und Datenübermittlung ins Ausland
            </h2>
            <p>
              Die Webseite und die damit verbundenen Daten können bei externen
              Dienstleistern gehostet oder gespeichert werden. Voraussichtlich
              kommen dafür AWS, Google Cloud oder Google Drive in Betracht. Dabei
              können Personendaten auch ausserhalb der Schweiz bearbeitet werden.
              Eine Übermittlung ins Ausland erfolgt nur, soweit die gesetzlichen
              Voraussetzungen erfüllt sind. Nach Schweizer Datenschutzrecht
              dürfen Personendaten grundsätzlich nur in Länder mit angemessenem
              Datenschutzniveau übermittelt werden oder es müssen geeignete
              Garantien bestehen.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              10. Mapbox und Kartendienste
            </h2>
            <p>
              Wir verwenden Mapbox oder vergleichbare Kartendienste, um
              Grundstücke, Adressen oder geografische Informationen darzustellen
              oder zu verarbeiten. Dabei können technische Daten wie IP-Adresse,
              Geräteinformationen, Standort- oder Kartennutzungsdaten an Mapbox
              oder andere Kartendienstleister übermittelt werden. Die
              Verarbeitung durch solche Anbieter richtet sich zusätzlich nach
              deren eigenen Datenschutzbestimmungen.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              11. Cookies und technische Daten
            </h2>
            <p>
              Lota verwendet derzeit nur technisch notwendige Cookies oder
              vergleichbare Technologien, soweit diese für den Betrieb der
              Webseite, die Zahlungsabwicklung, die Sicherheit oder die
              Bereitstellung einzelner Funktionen erforderlich sind. Für die
              Erfolgsmessung unserer Google-Ads-Werbung setzen wir zusätzlich
              Conversion-Cookies von Google ein (siehe Ziffer 12). Analyse-Tools
              wie Google Analytics und Tracking für personalisierte Werbung
              verwenden wir nicht. Beim Besuch der Webseite
              können aus technischen Gründen gewisse Daten automatisch
              verarbeitet werden, zum Beispiel IP-Adresse, Datum und Uhrzeit des
              Zugriffs, aufgerufene Seiten, Browsertyp, Betriebssystem,
              Gerätetyp und technische Logdaten. Diese Daten werden verwendet, um
              die Webseite sicher und funktionsfähig bereitzustellen.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              12. Werbung und Conversion-Tracking
            </h2>
            <p>
              Wir nutzen Google Ads Conversion-Tracking, um die Wirksamkeit
              unserer Werbeanzeigen zu messen. Gelangen Sie über eine unserer
              Google-Anzeigen auf die Webseite und schliessen anschliessend eine
              Bestellung ab, wird über ein Cookie von Google erfasst, dass die
              Bestellung auf eine Anzeige zurückgeht. Dabei können Daten wie eine
              Klick-Kennung, Zeitpunkt und Bestellwert an Google (Google Ireland
              Limited bzw. Google LLC, USA) übermittelt werden. Wir erhalten
              dadurch nur aggregierte Statistiken und keine Daten, die Sie
              persönlich identifizieren. Einzelheiten finden Sie in der
              Datenschutzerklärung von Google. Darüber hinaus erstellen wir keine
              Nutzerprofile und betreiben kein Retargeting. Falls wir künftig
              weitere Tracking- oder Analyse-Tools einsetzen, passen wir diese
              Erklärung an und holen, soweit erforderlich, eine Einwilligung ein.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              13. Keine Newsletter
            </h2>
            <p>
              Wir versenden aktuell keine Newsletter. Die E-Mail-Adresse des
              Kunden wird verwendet, um die bestellte Analyse zuzustellen und bei
              Bedarf mit dem Kunden zur Bestellung oder Analyse zu kommunizieren.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              14. Keine KI-Auswertung
            </h2>
            <p>
              Aktuell verwenden wir keine KI-Tools zur automatisierten Analyse
              von Nutzerdaten oder Grundstückanfragen. Falls in Zukunft KI-Tools
              oder automatisierte Systeme eingesetzt werden, können diese zur
              Erstellung, Prüfung oder Verbesserung von Baupotentialanalysen
              verwendet werden. In diesem Fall wird diese Datenschutzerklärung
              angepasst. Soweit erforderlich, werden zusätzliche
              Schutzmassnahmen getroffen oder Einwilligungen eingeholt.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">15. Speicherdauer</h2>
            <p>
              Wir speichern Anfragen, Reports, Projektdaten und Bestelldaten
              grundsätzlich während mindestens einem Jahr. Eine längere
              Speicherung kann erfolgen, wenn dies aus rechtlichen,
              buchhalterischen, steuerlichen, dokumentarischen oder
              geschäftlichen Gründen erforderlich ist. Personendaten werden
              gelöscht oder anonymisiert, sobald sie für die genannten Zwecke
              nicht mehr erforderlich sind und keine gesetzlichen oder
              berechtigten Gründe für eine weitere Speicherung bestehen.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">16. Datensicherheit</h2>
            <p>
              Wir treffen angemessene technische und organisatorische
              Massnahmen, um Personendaten gegen Verlust, Missbrauch, unbefugten
              Zugriff, Veränderung oder Offenlegung zu schützen. Dazu können
              insbesondere verschlüsselte Übertragung der Webseite,
              Zugriffsbeschränkungen, sichere Speicherung, interne
              Zugriffskontrollen, die sorgfältige Auswahl von Dienstleistern und
              die regelmässige Überprüfung technischer Systeme gehören. Trotz
              angemessener Sicherheitsmassnahmen kann keine absolute Sicherheit
              garantiert werden.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              17. Rechte betroffener Personen
            </h2>
            <p>
              Betroffene Personen haben im Rahmen des anwendbaren
              Datenschutzrechts insbesondere das Recht, Auskunft über
              bearbeitete Personendaten zu verlangen, unrichtige Personendaten
              berichtigen zu lassen, die Löschung von Personendaten zu
              verlangen, der Bearbeitung bestimmter Daten zu widersprechen, eine
              erteilte Einwilligung für die Zukunft zu widerrufen und die
              Herausgabe bestimmter Daten zu verlangen, soweit dies gesetzlich
              vorgesehen ist. Zur Bearbeitung solcher Anfragen können wir einen
              Identitätsnachweis verlangen. Anfragen sind zu richten an{" "}
              <a
                href="mailto:info@lota-solutions.ch"
                className="font-medium text-[#a97937] hover:opacity-70"
              >
                info@lota-solutions.ch
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              18. Daten von Dritten
            </h2>
            <p>
              Wenn Nutzer eine Grundstückadresse eingeben, die ihnen nicht
              gehört, sind sie selbst dafür verantwortlich, dass sie dazu
              berechtigt sind und keine Rechte Dritter verletzen. Wir erfassen
              keine Eigentümerdaten und zeigen keine Eigentümerdaten an. Die
              Baupotentialanalyse bezieht sich auf öffentlich zugängliche
              Grundstück-, Zonen- und Baureglementsdaten.
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-bold text-[#1d2731]">
              19. Änderungen dieser Datenschutzerklärung
            </h2>
            <p>
              Wir können diese Datenschutzerklärung jederzeit anpassen. Es gilt
              jeweils die auf lota-solutions.ch veröffentlichte aktuelle Fassung.
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
          <Link href="/agb" className="hover:text-[#a97937]">
            AGB
          </Link>
          <Link href="/impressum" className="hover:text-[#a97937]">
            Impressum
          </Link>
        </footer>
      </aside>
    </main>
  );
}
