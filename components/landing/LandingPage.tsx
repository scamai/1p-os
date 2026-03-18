"use client";

import Link from "next/link";
function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      {/* Top bar */}
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-6">
        <Link href="/" className="font-heading text-lg italic font-extralight tracking-[-0.02em] text-black">
          1P
        </Link>
        <div className="flex items-center gap-6">
        <a
          href="https://github.com/scamai/1p-os"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black/40 transition-colors duration-150 hover:text-black"
          aria-label="GitHub"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        </a>
        <Link
          href="/auth/login"
          className="text-sm text-black/40 transition-colors duration-150 hover:text-black"
        >
          Sign in
        </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto flex flex-1 max-w-5xl flex-col justify-center px-6 pb-32 pt-28 md:pt-40">
        <h1 className="max-w-3xl font-heading text-[clamp(2.5rem,7vw,4.5rem)] italic font-extralight leading-none tracking-[-0.02em] text-black">
          1 Person Company
        </h1>
        <p className="mt-6 font-heading text-[clamp(1.125rem,2.5vw,1.75rem)] italic font-normal leading-[1.3] text-black/70">
          build your startup without stress
        </p>
        <p className="mt-8 max-w-xl text-[17px] leading-[1.7] text-black/50">
          We made the mistakes so you don&apos;t have to. Missed deadlines,
          wrong entity type, messy cap tables, no IP protection — we learned
          every lesson the expensive way. Now it&apos;s all here: templates,
          calculators, and step-by-step guidance to get it right from day one.
        </p>
        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Link
            href="/auth/login"
            className="bg-black px-6 py-3 text-[15px] font-medium text-white transition-opacity duration-150 hover:opacity-80"
          >
            Get started &rarr;
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/scamai/1p-os"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black/20 transition-colors duration-150 hover:text-black"
              aria-label="GitHub"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
            <a
              href="https://x.com/ScamAI_Official"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black/20 transition-colors duration-150 hover:text-black"
              aria-label="X"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-black/30">
            A public repo from Reality Inc. (Scam.ai). Not legal, tax, or financial advice.
          </p>
          <p className="mt-2 text-[12px] text-black/20">
            Reality Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}

export { LandingPage };
