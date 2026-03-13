import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1P OS",
  description: "Your one-person business operating system. AI agents that run your company while you do the work you love.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
