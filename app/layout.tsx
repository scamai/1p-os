import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://1press.com"),
  title: {
    default: "1 Person Company — without stress",
    template: "%s | 1 Person Company",
  },
  description: "Incorporation, legal templates, cap table, fundraising, compliance — guided step by step. Free and open source. We made the mistakes so you don't have to.",
  keywords: ["startup", "incorporation", "cap table", "fundraising", "SAFE", "legal templates", "founder", "open source", "Delaware C-Corp", "equity", "compliance"],
  authors: [{ name: "Reality Inc.", url: "https://scam.ai" }],
  creator: "Reality Inc.",
  publisher: "Reality Inc.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://1press.com",
    siteName: "1 Person Company",
    title: "1 Person Company — without stress",
    description: "We made the mistakes so you don't have to. Templates, calculators, and step-by-step guidance to launch your company right from day one. Free and open source.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ScamAI_Official",
    creator: "@ScamAI_Official",
    title: "1 Person Company — without stress",
    description: "We made the mistakes so you don't have to. Free and open source.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://1press.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${cormorant.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-X3861HH575" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-X3861HH575');
        `}
      </Script>
      <body className="min-h-screen bg-white text-black antialiased">
        {children}
      </body>
    </html>
  );
}
