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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
