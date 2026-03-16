import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1P OS — Every mistake a first-time founder makes is already solved here",
  description: "The operating system for first-time founders. Cap table, bookkeeping, contracts, fundraising, compliance — all built in. AI agents handle the work.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-white font-sans text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
