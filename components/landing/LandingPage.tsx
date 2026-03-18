"use client";

import Link from "next/link";

const MISTAKES = [
  {
    number: "01",
    mistake: "No cap table",
    result: "Equity fights kill 62% of startups with co-founders.",
    fix: "Built-in cap table, vesting schedules, dilution modeling.",
  },
  {
    number: "02",
    mistake: "No bookkeeping",
    result: "Tax season panic. Investors walk when books are messy.",
    fix: "Transaction logging, categorization, monthly summaries.",
  },
  {
    number: "03",
    mistake: "No runway tracking",
    result: "You run out of money and don't see it coming.",
    fix: "Revenue, expenses, cash balance. Runway calculated live.",
  },
  {
    number: "04",
    mistake: "No contracts",
    result: "Handshake deals go wrong. No legal protection.",
    fix: "Contract tracking, status pipeline, expiration alerts.",
  },
  {
    number: "05",
    mistake: "No compliance",
    result: "Missed filings, penalties, legal exposure.",
    fix: "Checklist of corporate, tax, employment, data requirements.",
  },
  {
    number: "06",
    mistake: "No pitch deck",
    result: "Can't articulate your business. Investors pass.",
    fix: "Guided deck builder. Problem, solution, market, traction.",
  },
];

const SECTIONS = [
  { label: "Company", items: ["Founders & Equity", "Ideation", "Incorporation", "Pitch Deck", "Accelerators"] },
  { label: "Money", items: ["Fundraising", "Runrate", "Bookkeeping", "Accounting", "Auditing", "Tax"] },
  { label: "Business", items: ["Business Model", "Pricing", "Market Research", "Go-to-Market", "Marketing"] },
  { label: "Legal", items: ["Contracts", "SAFEs", "Compliance", "IP & Trademarks"] },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <span className="text-[15px] font-bold text-slate-900">1P OS</span>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors">
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="bg-slate-900 text-white px-4 py-1.5 text-[13px] font-medium hover:bg-slate-800 transition-colors"
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16">
        <p className="text-[13px] font-medium text-slate-400 uppercase tracking-wider mb-4">
          For first-time founders
        </p>
        <h1 className="text-[40px] leading-[1.1] font-bold text-slate-900 tracking-tight">
          Every mistake a first-time founder makes is already solved here.
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-slate-500 max-w-xl">
          No cap table. No bookkeeping. No contracts. No runway tracking.
          First-time founders lose money, equity, and their company
          because nobody told them what to set up on day one.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-slate-500 max-w-xl">
          1P OS is the operating system that has it all built in.
          Every tool, every checklist, every workflow — from incorporation
          to fundraising to tax filing. AI agents handle the work.
          You make the decisions.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/auth/signup"
            className="bg-slate-900 text-white px-6 py-2.5 text-[14px] font-medium hover:bg-slate-800 transition-colors"
          >
            Start building your company
          </Link>
          <span className="text-[13px] text-slate-400">Free. Self-hosted. Open source.</span>
        </div>
      </section>

      {/* Mistakes Section */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-slate-100">
        <p className="text-[13px] font-medium text-slate-400 uppercase tracking-wider mb-2">
          Why we built this
        </p>
        <h2 className="text-[28px] font-bold text-slate-900 tracking-tight">
          6 mistakes that kill first-time startups.
        </h2>
        <p className="mt-3 text-[15px] text-slate-500 max-w-lg">
          Every one of these is preventable. 1P OS prevents them by default.
        </p>

        <div className="mt-10 flex flex-col gap-6">
          {MISTAKES.map((m) => (
            <div key={m.number} className="flex gap-5">
              <span className="shrink-0 text-[13px] font-mono font-bold text-slate-300 pt-0.5">
                {m.number}
              </span>
              <div className="flex-1 border-b border-slate-100 pb-6">
                <p className="text-[15px] font-semibold text-slate-900">{m.mistake}</p>
                <p className="mt-1 text-[14px] text-slate-500">{m.result}</p>
                <p className="mt-2 text-[13px] text-slate-400">
                  <span className="font-medium text-slate-600">1P OS:</span> {m.fix}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What's Inside */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-slate-100">
        <p className="text-[13px] font-medium text-slate-400 uppercase tracking-wider mb-2">
          What&apos;s inside
        </p>
        <h2 className="text-[28px] font-bold text-slate-900 tracking-tight">
          Everything a solo founder needs. Nothing extra.
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-[13px] font-semibold text-slate-900 mb-2">{section.label}</p>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item} className="text-[13px] text-slate-500">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* AI Agents */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-slate-100">
        <p className="text-[13px] font-medium text-slate-400 uppercase tracking-wider mb-2">
          How it works
        </p>
        <h2 className="text-[28px] font-bold text-slate-900 tracking-tight">
          AI agents do the work. You make the calls.
        </h2>
        <div className="mt-8 flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <span className="shrink-0 flex h-8 w-8 items-center justify-center bg-slate-100 text-[13px] font-bold text-slate-600">1</span>
            <div>
              <p className="text-[15px] font-medium text-slate-900">Connect your accounts</p>
              <p className="mt-0.5 text-[14px] text-slate-500">Email, calendar, Stripe, Slack. AI reads your business and builds your team.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="shrink-0 flex h-8 w-8 items-center justify-center bg-slate-100 text-[13px] font-bold text-slate-600">2</span>
            <div>
              <p className="text-[15px] font-medium text-slate-900">Agents work autonomously</p>
              <p className="mt-0.5 text-[14px] text-slate-500">Invoice tracking, lead follow-ups, bookkeeping, scheduling. They run 24/7.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="shrink-0 flex h-8 w-8 items-center justify-center bg-slate-100 text-[13px] font-bold text-slate-600">3</span>
            <div>
              <p className="text-[15px] font-medium text-slate-900">You approve what matters</p>
              <p className="mt-0.5 text-[14px] text-slate-500">Payments, contracts, tax filings — agents ask before acting on anything important.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 border-t border-slate-100 text-center">
        <h2 className="text-[28px] font-bold text-slate-900 tracking-tight">
          Don&apos;t learn these lessons the hard way.
        </h2>
        <p className="mt-3 text-[15px] text-slate-500">
          Every tool your startup needs, from day one.
        </p>
        <Link
          href="/auth/signup"
          className="mt-8 inline-block bg-slate-900 text-white px-8 py-3 text-[14px] font-medium hover:bg-slate-800 transition-colors"
        >
          Start building your company
        </Link>
        <p className="mt-4 text-[12px] text-slate-400">
          AGPLv3 open source. Self-host free. You own everything.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-slate-400">1P OS</span>
          <div className="flex gap-4">
            <Link href="/auth/login" className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors">Sign in</Link>
            <Link href="/auth/signup" className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { LandingPage };
