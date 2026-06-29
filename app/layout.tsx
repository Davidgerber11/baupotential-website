import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Google-Tag (gtag.js) für Google Ads Conversion-Tracking (NEXT_PUBLIC_GOOGLE_ADS_ID,
// Format "AW-XXXXXXXXX") und/oder Google Analytics 4 (NEXT_PUBLIC_GA_ID, "G-XXXXXXXXXX").
// gtag.js wird einmal geladen und konfiguriert beide Ziele, sofern gesetzt.
const GADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GTAG_ID = GADS_ID || GA_ID;
const GTAG_CONFIGS =
  (GADS_ID ? `gtag('config','${GADS_ID}');` : "") +
  (GA_ID ? `gtag('config','${GA_ID}');` : "");

const TITLE = "Lota — Baupotential jeder Schweizer Parzelle";
const DESCRIPTION =
  "Finde heraus, wie viel du auf deinem Grundstück bauen darfst. Lota erstellt eine Baupotentialanalyse jeder Schweizer Parzelle — als PDF-Bericht innerhalb von 24 Stunden.";
const SHORT =
  "Finde heraus, wie viel du auf deinem Grundstück bauen darfst — als PDF-Bericht in 24 Stunden.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lota-solutions.ch"),
  title: {
    default: TITLE,
    template: "%s · Lota",
  },
  description: DESCRIPTION,
  applicationName: "Lota",
  keywords: [
    "Baupotential",
    "Baupotentialanalyse",
    "Grundstück",
    "Parzelle",
    "Schweiz",
    "bebaubare Fläche",
    "Ausnützung",
    "Baurecht",
  ],
  // opengraph-image.png / twitter-image.png im app/-Ordner werden von Next
  // automatisch als og:image / twitter:image (absolut via metadataBase) ergänzt.
  openGraph: {
    type: "website",
    locale: "de_CH",
    url: "https://www.lota-solutions.ch",
    siteName: "Lota",
    title: TITLE,
    description: SHORT,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SHORT,
  },
  alternates: {
    canonical: "https://www.lota-solutions.ch",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {GTAG_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${GTAG_CONFIGS}`}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
