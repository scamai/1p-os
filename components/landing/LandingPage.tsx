"use client";

import * as React from "react";
import Link from "next/link";

/* ── Before/After Slider ── */

function BeforeAfterSlider() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState(50);
  const [isDragging, setIsDragging] = React.useState(false);

  const updatePos = React.useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPos((x / rect.width) * 100);
  }, []);

  const handleStart = React.useCallback((clientX: number) => {
    setIsDragging(true);
    updatePos(clientX);
  }, [updatePos]);

  React.useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      updatePos(clientX);
    };
    const onUp = () => setIsDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, updatePos]);

  return (
    <div className="w-full max-w-[440px] shrink-0">
      {/* Labels */}
      <div className="mb-3 flex items-center justify-between">
        <span className="border border-black/[0.08] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-black/30">
          Before
        </span>
        <span className="bg-black px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white">
          After
        </span>
      </div>

      {/* Slider container */}
      <div
        ref={containerRef}
        className="relative aspect-[4/5] w-full cursor-col-resize select-none overflow-hidden border border-black/[0.08] bg-[#FAFAFA]"
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        {/* Before side (full width, always visible behind) */}
        <div className="absolute inset-0 p-6 md:p-8">
          <div className="space-y-4">
            <div className="h-4 w-2/3 bg-black/[0.06]" />
            <div className="h-3 w-full bg-black/[0.04]" />
            <div className="h-3 w-5/6 bg-black/[0.04]" />
            <div className="h-3 w-3/4 bg-black/[0.04]" />
            <div className="mt-6 flex gap-2">
              <div className="h-16 flex-1 bg-black/[0.04]" />
              <div className="h-16 flex-1 bg-black/[0.04]" />
              <div className="h-16 flex-1 bg-black/[0.04]" />
            </div>
            <div className="mt-4 space-y-2">
              {["LLC or C-Corp?", "Do I need an 83(b)?", "Lawyer fees: $10,000", "Missed franchise tax", "Cap table???", "How to find investors?"].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-black/[0.06]" />
                  <span className="text-[12px] text-black/25">{t}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 h-10 w-32 bg-black/[0.06]" />
            <p className="mt-4 text-[11px] italic text-black/15">
              Weeks of confusion. Thousands in fees.
            </p>
          </div>
        </div>

        {/* After side (clipped from right) */}
        <div
          className="absolute inset-0 bg-white p-6 md:p-8"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        >
          <div className="space-y-3">
            <p className="font-heading text-[20px] italic font-light text-black/80">
              Your launch plan
            </p>
            <p className="text-[12px] text-black/30">Personalized · Step by step</p>
            <div className="mt-4 space-y-3">
              {[
                { text: "Delaware C-Corp filed", done: true },
                { text: "83(b) election mailed", done: true },
                { text: "Legal docs signed", done: true },
                { text: "Cap table set up", done: true },
                { text: "Compliance running", done: true },
                { text: "Investor pipeline", done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center text-[10px] ${item.done ? "border border-black/20 text-black/60" : "border border-dashed border-black/10 text-black/20"}`}>
                    {item.done ? "\u2713" : i + 1}
                  </span>
                  <span className={`text-[13px] ${item.done ? "text-black/70" : "text-black/35"}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-black/[0.06] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-black/50">~1.5 hours</span>
                <span className="text-[11px] text-black/25">Free</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] italic text-black/30">
              Every step guided. Every deadline enforced.
            </p>
          </div>
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 z-10 w-px bg-black/20"
          style={{ left: `${pos}%` }}
        />

        {/* Drag handle */}
        <div
          className="absolute top-1/2 z-20 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-col-resize items-center justify-center rounded-full border border-black/10 bg-white shadow-sm"
          style={{ left: `${pos}%` }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 4l-4 4 4 4" />
            <path d="M16 4l4 4-4 4" />
          </svg>
        </div>
      </div>

      {/* Swipe hint */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <span className="text-[11px] text-black/20">&larr; Swipe &rarr;</span>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-black/10 rounded-full" />
          <span className="text-[11px] text-black/30">Without guidance</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-black rounded-full" />
          <span className="text-[11px] text-black/30">With 1 Person Company</span>
        </div>
      </div>
    </div>
  );
}

/* ── SVG Icons ── */

function GitHubIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  );
}

/* ── Data ── */

const INCLUDED = [
  "Delaware C-Corp incorporation guide",
  "83(b) election with 30-day countdown",
  "14 auto-filled legal templates",
  "Cap table & equity calculators",
  "SAFE dilution simulator",
  "Vesting schedule builder",
  "Investor database & CRM",
  "Pitch deck framework",
  "Accelerator matching",
  "Compliance autopilot",
];

const SECTIONS = [
  {
    num: "01",
    label: "You have an idea",
    title: "You want to build something. You don\u2019t know where to start.",
    body: "LLC or C-Corp? If you pick LLC, most VCs won\u2019t even talk to you. Delaware or your home state? Delaware \u2014 but now you owe franchise tax in a state you\u2019ve never been to, and if you miss it you lose good standing. What\u2019s an 83(b) election? It\u2019s a form you file with the IRS within 30 days of receiving stock \u2014 miss the deadline and you could owe six figures in taxes on stock you can\u2019t even sell. Do you need a co-founder agreement? Yes, and without vesting your co-founder can walk away with half the company after two months. The information exists \u2014 buried in Reddit threads, scattered across contradictory blog posts, locked behind $500/hr lawyers. You shouldn\u2019t need a law degree to start a company.",
  },
  {
    num: "02",
    label: "We\u2019ve been there",
    title: "We made every mistake so you can skip them all.",
    body: "Filed as an LLC and had to convert to a C-Corp when investors wouldn\u2019t touch us. Missed the 83(b) election deadline and got a surprise tax bill. Gave a co-founder 50% equity with no vesting \u2014 they left after three months with half the company. Forgot the IP assignment and had to track down a contractor in another country to sign one. Signed a SAFE without understanding dilution and gave away 40% of the company before Series A. Paid a lawyer $10,000 for boilerplate templates. Missed Delaware franchise tax and had to pay penalties to reinstate. Every painful lesson became a step in this platform.",
  },
  {
    num: "03",
    label: "The playbook",
    title: "Every step, in order. Nothing missed.",
    body: "Incorporate as a Delaware C-Corp. Get your EIN from the IRS. File your 83(b) election within 30 days \u2014 not 31. Sign your IP assignment so the company actually owns what you built. Set up your cap table before you promise equity to anyone. Get your CIIA in place before your first hire or contractor. File for S-Corp election if it saves you on self-employment tax. Register for franchise tax. Set up your registered agent. The entire launch process laid out step by step \u2014 one screen at a time, with every template and calculator built in.",
  },
  {
    num: "04",
    label: "The tools",
    title: "Legal templates, calculators, investor database \u2014 all built in.",
    body: "Board consent to authorize your own stock issuance \u2014 you need this and most founders don\u2019t know it. Stock purchase agreement with 4-year vesting and 1-year cliff \u2014 the standard VCs expect. 83(b) election letter pre-filled and ready to mail. IP assignment so your company legally owns your code. CIIA for every employee and contractor. Mutual NDA that doesn\u2019t scare away partners. SAFE dilution simulator so you know exactly what you\u2019re giving up before you sign. Cap table that updates automatically as you issue shares. Investor database you can search by stage, sector, and check size.",
  },
  {
    num: "05",
    label: "The safety net",
    title: "Dangerous deadlines enforced, not just mentioned.",
    body: "The 83(b) election has a hard 30-day deadline \u2014 the IRS will not grant extensions, no exceptions, no appeals. Miss it and you\u2019re taxed on the fair market value of your stock when it vests, not when you bought it for $0.0001. Delaware franchise tax is due March 1 every year \u2014 miss it and you lose good standing, which means you can\u2019t raise, can\u2019t close deals, can\u2019t operate. Annual report due the same day. S-Corp election deadline is March 15. Quarterly estimated tax payments. State tax registrations. We create automatic countdowns the moment you complete each step. 30-day, 7-day, and day-of alerts. The deadlines that ruin companies don\u2019t get missed.",
  },
  {
    num: "06",
    label: "The result",
    title: "Incorporated, compliant, investor-ready. In a day.",
    body: "Delaware C-Corp filed. EIN in hand. 83(b) mailed. IP assigned to the company. Board consent signed. Stock purchase agreement executed. Cap table clean with proper vesting. CIIA ready for your first hire. Franchise tax calendar set. Compliance reminders running. SAFE terms you actually understand. Pitch deck structured around the framework investors expect. What takes most founders weeks of Googling, thousands in legal fees, and at least one expensive mistake \u2014 done in a day, for free.",
  },
];

/* ── Page ── */

function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white text-black">
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:text-sm"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="mx-auto flex max-w-[900px] items-center justify-between px-6 pt-8">
        <Link
          href="/"
          className="font-heading text-[clamp(1.75rem,4vw,2.5rem)] italic font-extralight tracking-[-0.02em] text-black"
        >
          1P
        </Link>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/scamai/1p-os"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black/30 transition-colors duration-150 hover:text-black"
            aria-label="View on GitHub"
          >
            <GitHubIcon />
          </a>
          <Link
            href="/auth/login"
            className="text-[13px] text-black/40 transition-colors duration-150 hover:text-black"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section id="main-content" className="mx-auto max-w-[900px] px-6 pb-[120px] pt-[120px] md:pt-[160px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-16">
          {/* Left: Title & info */}
          <div className="flex-1">
            <h1 className="font-heading text-[clamp(2.5rem,7vw,5rem)] italic font-extralight leading-[0.95] tracking-[-0.03em] text-black">
              1 Person Company
            </h1>
            <p className="mt-5 font-heading text-[clamp(1.125rem,2.5vw,1.5rem)] italic font-normal leading-[1.3] text-black/60">
              build your startup without stress
            </p>

            <p className="mt-10 max-w-[440px] text-[15px] leading-[1.75] text-black/50">
              We made the mistakes so you don&apos;t have to. Missed deadlines, wrong entity
              type, messy cap tables, no IP protection — we learned every lesson the
              expensive way. Now it&apos;s all here.
            </p>

            {/* CTA */}
            <div className="mt-10">
              <Link
                href="/auth/signup"
                className="bg-black px-7 py-3.5 text-[14px] font-medium uppercase tracking-[0.1em] text-white transition-opacity duration-150 hover:opacity-80"
              >
                Get started
              </Link>
            </div>

            {/* Version */}
            <p className="mt-10 text-[12px] text-black/20">
              v1.0 — Free and open source
            </p>
          </div>

          {/* Right: Before/After slider comparison */}
          <BeforeAfterSlider />
        </div>
      </section>

      {/* ── NUMBERED SECTIONS ── */}
      {SECTIONS.map((section, i) => (
        <section
          key={section.num}
          className={`border-t border-black/[0.06] ${i % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}
        >
          <div className="mx-auto max-w-[900px] px-6 py-[80px] md:py-[120px]">
            <div className="flex items-start gap-8 md:gap-16">
              <span className="hidden shrink-0 font-heading text-[80px] italic font-extralight leading-none text-black/[0.05] md:block md:text-[120px]">
                {section.num}
              </span>
              <div className="flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-black/30">
                  <span className="mr-2 md:hidden">{section.num}</span>
                  {section.label}
                </p>
                <h2 className="mt-4 max-w-[520px] font-heading text-[clamp(1.5rem,3.5vw,2.25rem)] italic font-light leading-[1.15] tracking-[-0.01em] text-black">
                  {section.title}
                </h2>
                <p className="mt-6 max-w-[520px] text-[15px] leading-[1.8] text-black/50">
                  {section.body}
                </p>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-black/[0.06] bg-white">
        <div className="mx-auto max-w-[900px] px-6 py-[80px] md:py-[120px]">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-black/30">
            How it works
          </p>
          <h2 className="mt-4 font-heading text-[clamp(1.5rem,3.5vw,2.25rem)] italic font-light leading-[1.15] tracking-[-0.01em] text-black">
            Three steps. One day.
          </h2>

          <div className="mt-16 grid gap-16 md:grid-cols-3 md:gap-10">
            {[
              {
                n: "1",
                title: "Sign up",
                body: "Create an account in 30 seconds. No credit card. No onboarding quiz. Just start.",
              },
              {
                n: "2",
                title: "Follow the steps",
                body: "One screen at a time. Templates auto-fill. Calculators do the math. Dangerous deadlines are enforced.",
              },
              {
                n: "3",
                title: "Launch with confidence",
                body: "Incorporated, compliant, cap table clean, legal docs signed. Every mistake prevented before it costs you.",
              },
            ].map((step) => (
              <div key={step.n}>
                <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-black/25">
                  Step {step.n}
                </span>
                <h3 className="mt-3 text-[15px] font-semibold text-black">
                  {step.title}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.75] text-black/50">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPEN SOURCE ── */}
      <section className="border-t border-black/[0.06] bg-[#FAFAFA]">
        <div className="mx-auto max-w-[900px] px-6 py-[80px] md:py-[120px]">
          <h2 className="max-w-[480px] font-heading text-[clamp(1.5rem,3.5vw,2.25rem)] italic font-light leading-[1.15] tracking-[-0.01em] text-black">
            Open source. Free forever. No catch.
          </h2>
          <p className="mt-6 max-w-[520px] text-[15px] leading-[1.8] text-black/50">
            Every line of code is public. Self-host it. Fork it. Every paid tool we
            recommend also has a free alternative. Built with Next.js, Supabase, and
            TypeScript.
          </p>
          <a
            href="https://github.com/scamai/1p-os"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-[13px] text-black/40 transition-colors duration-150 hover:text-black"
          >
            View on GitHub <ArrowIcon />
          </a>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-black/[0.06] bg-black">
        <div className="mx-auto max-w-[900px] px-6 py-[80px] text-center md:py-[120px]">
          <h2 className="font-heading text-[clamp(1.75rem,4vw,3rem)] italic font-light tracking-[-0.01em] text-white">
            Don&apos;t learn the hard way.
          </h2>
          <p className="mx-auto mt-5 max-w-[400px] text-[15px] leading-[1.7] text-white/40">
            Every template, calculator, and deadline tracker you need to launch.
            Step by step. Free.
          </p>
          <div className="mt-10">
            <Link
              href="/auth/signup"
              className="inline-flex bg-white px-8 py-3.5 text-[14px] font-medium uppercase tracking-[0.1em] text-black transition-opacity duration-150 hover:opacity-80"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-black/[0.06] bg-white">
        <div className="mx-auto max-w-[900px] px-6 py-10">
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/scamai/1p-os"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black/20 transition-colors duration-150 hover:text-black"
              aria-label="GitHub"
            >
              <GitHubIcon className="h-4 w-4" />
            </a>
            <a
              href="https://x.com/ScamAI_Official"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black/20 transition-colors duration-150 hover:text-black"
              aria-label="X"
            >
              <XIcon />
            </a>
          </div>
          <p className="mt-5 max-w-[400px] text-[12px] leading-relaxed text-black/25">
            A public repo from Reality Inc. Not legal, tax, or financial advice. Consult a
            qualified professional for your specific situation.
          </p>
          <p className="mt-3 text-[12px] text-black/15">
            Reality Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}

export { LandingPage };
