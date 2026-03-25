"use client";

import Link from "next/link";

// ── Content ──

const LAWYER_MISTAKES = [
  "Paying a $500/hr lawyer for boilerplate they\u2019ve used 1,000 times. Most early-stage legal work is template-based \u2014 you\u2019re paying for their letterhead, not their brain.",
  "Hiring a big firm because it feels \u201Csafe.\u201D A solo practitioner who does 50 startups a year is better than a partner at a top firm who does 2.",
  "Not asking for a fixed fee. Hourly billing incentivizes lawyers to be slow. Always negotiate flat rates for defined work.",
  "Spending $10K on legal before you have a single customer. You need a lawyer eventually \u2014 not on day one.",
  "Using a friend who\u2019s a lawyer but doesn\u2019t do startup law. Corporate law, IP law, and employment law are completely different specialties. Your uncle who does real estate closings cannot help you with a SAFE.",
];

const CONTRACT_MISTAKES = [
  "Handshake deals with co-founders. \u201CWe trust each other\u201D is not a legal document. Get a founder agreement signed before you write a line of code.",
  "No IP assignment. If a contractor or co-founder built something without signing an IP assignment, they might own it \u2014 not the company. Investors will walk away over this.",
  "Signing a contract you didn\u2019t read. Especially non-competes, exclusivity clauses, and auto-renewal terms. One bad clause can lock you out of your own market.",
  "Using free templates from Google without understanding what they say. A template is a starting point, not a finished document. The blanks you don\u2019t fill in are the ones that hurt you.",
  "Not having an NDA when sharing proprietary information with potential partners or hires. Most NDAs aren\u2019t worth the paper they\u2019re printed on \u2014 but not having one at all is worse.",
];

const COMPLIANCE_MISTAKES = [
  "Missing your Delaware franchise tax. It\u2019s $400/year. Miss it and you lose good standing. Lose good standing and you can\u2019t raise, can\u2019t sell, can\u2019t do anything until you fix it \u2014 plus penalties.",
  "Forgetting to file your annual report. Every state has different deadlines. Nobody will remind you. Set a calendar alert or it will slip.",
  "Not getting an EIN immediately after incorporation. You need it for bank accounts, hiring, payroll, tax filings \u2014 everything. It takes 10 minutes on the IRS website. Do it the day you incorporate.",
  "Ignoring sales tax obligations. After the Wayfair ruling, you might owe sales tax in states you\u2019ve never visited. If you sell to customers in multiple states, this applies to you.",
  "Not tracking equity grants properly. The IRS cares about every share you issue, even if you don\u2019t. Sloppy records now become expensive problems during due diligence.",
];

const IP_MISTAKES = [
  "Not filing a trademark for your company name. Someone else will \u2014 and then you\u2019re rebranding at the worst possible time. A trademark application costs $250\u2013$350. Do it early.",
  "Building on someone else\u2019s open source without checking the license. GPL can force you to open-source your entire codebase. AGPL is even stricter. Read the license before you npm install.",
  "Not documenting trade secrets. If you can\u2019t prove it was a secret \u2014 access controls, NDAs, documentation \u2014 it\u2019s not a secret in court.",
  "Letting domain registrations expire. Your domain is your brand. Set it to auto-renew for 10 years. The $100 is nothing compared to losing it.",
  "Not filing provisional patents when you have genuinely novel technology. A provisional buys you 12 months of \u201Cpatent pending\u201D for $320. If you have real IP, protect it before you talk about it publicly.",
];

const EMPLOYMENT_MISTAKES = [
  "Misclassifying employees as contractors. The IRS has destroyed startups over this. If you control when, where, and how they work \u2014 they\u2019re an employee. The penalties include back taxes, interest, and fines per worker.",
  "No offer letters or employment agreements. Even for your first hire. Even for your friend. Especially for your friend.",
  "Promising equity verbally. \u201CI\u2019ll give you 2%\u201D means nothing without a board resolution, stock purchase agreement, and vesting schedule. Verbal promises become lawsuits.",
  "Not having an employee handbook. It doesn\u2019t need to be 100 pages. But you need basic policies on harassment, termination, and IP ownership before you have your first dispute.",
  "Skipping background checks for roles with access to customer data or finances. Trust, but verify. One bad hire in a sensitive role can end everything.",
];

const KEYWORDS: { term: string; explanation: string }[] = [
  {
    term: "Registered Agent",
    explanation: "A person or company designated to receive legal documents on behalf of your business. Required in every state where you\u2019re registered. Use a service ($50\u2013$150/year) \u2014 don\u2019t use your home address.",
  },
  {
    term: "Operating Agreement",
    explanation: "The rulebook for an LLC. Who owns what, how decisions are made, what happens if someone leaves. Without one, your state\u2019s default rules apply \u2014 and they probably aren\u2019t what you want.",
  },
  {
    term: "IP Assignment",
    explanation: "A legal document that transfers ownership of intellectual property to the company. Every founder, employee, and contractor who touches your code, designs, or content needs to sign one.",
  },
  {
    term: "83(b) Election",
    explanation: "A tax filing that lets you pay taxes on stock at its current (low) value instead of when it vests at a (potentially much higher) value. Must be filed within 30 days of receiving stock. Miss the deadline and it could cost you tens of thousands of dollars.",
  },
  {
    term: "Non-Compete",
    explanation: "A clause that prevents someone from working for a competitor after leaving. Enforceability varies wildly by state \u2014 California bans them entirely. Don\u2019t sign one without understanding your state\u2019s laws.",
  },
  {
    term: "Franchise Tax",
    explanation: "An annual tax charged by the state where you\u2019re incorporated, regardless of revenue. Delaware\u2019s starts at $400/year. It\u2019s not optional. Missing it can dissolve your company.",
  },
  {
    term: "Good Standing",
    explanation: "A status indicating your company is compliant with all state requirements \u2014 taxes paid, reports filed, agent registered. Lose it and you can\u2019t raise money, sign contracts, or sell the company until it\u2019s restored.",
  },
  {
    term: "Indemnification",
    explanation: "A contract clause where one party agrees to cover the other\u2019s losses. Common in service agreements. Read it carefully \u2014 unlimited indemnification can expose you to liabilities far exceeding the contract value.",
  },
];

// ── Page ──

export default function LegalPage() {
  return (
    <article className="mx-auto max-w-[680px] px-6 py-16 md:py-24">
      {/* Title */}
      <header>
        <h1 className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] italic font-extralight leading-[1.1] tracking-[-0.03em] text-black">
          Legal
        </h1>
        <div className="mt-8 flex items-center gap-3 text-[13px] text-black/40">
          <span>8 min read</span>
        </div>
      </header>

      {/* Opening */}
      <p className="mt-14 text-[22px] leading-[1.75] text-black/70 font-light">
        Legal is the part of starting a company that nobody wants to think about
        until it&apos;s too late. It&apos;s boring, it&apos;s expensive, and most of
        the time you&apos;re paying someone to tell you things you don&apos;t fully
        understand. But the founders who skip it pay ten times more later.
      </p>

      <div className="mt-16 space-y-12">
        {/* The real cost */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            The real cost of &ldquo;I&apos;ll deal with it later&rdquo;
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Here&apos;s what happens when founders ignore legal:
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            A co-founder leaves and claims half the company because there&apos;s
            no founder agreement. A contractor sues for ownership of the code
            because there&apos;s no IP assignment. An investor walks away during
            due diligence because the cap table is a mess. The IRS sends a
            penalty notice because equity grants weren&apos;t reported.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Every one of these costs 10&ndash;100x more to fix than to prevent.
            </span>{" "}
            A founder agreement costs $0 to draft with a template. A co-founder
            lawsuit costs $50K+ and 18 months of your life.
          </p>
        </section>

        {/* Lawyers */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            How lawyers overcharge founders
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Most founders don&apos;t know what legal work should cost.
            Lawyers know this. Here&apos;s the reality:
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              80% of early-stage legal work is template-based.
            </span>{" "}
            Incorporation, founder agreements, IP assignments, NDAs, advisor
            agreements, employee offer letters &mdash; these are standard
            documents with standard terms. You should not be paying $5,000 for
            a document a lawyer has sent to 200 other startups this year.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The right approach: use templates for standard work (we provide them
            for free), and save your lawyer budget for the 20% that actually
            requires judgment &mdash; complex equity structures, unusual contract
            terms, regulatory questions specific to your industry.
          </p>
          <div className="mt-6 space-y-4">
            {LAWYER_MISTAKES.map((m, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {m}
              </p>
            ))}
          </div>
        </section>

        {/* What legal actually costs */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            What legal should actually cost
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Ballpark numbers so you know when you&apos;re getting ripped off:
          </p>
          <div className="mt-6 space-y-4">
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <span className="underline decoration-black/20 underline-offset-4 text-black">Incorporation</span>{" "}
              &mdash; $89 DIY, $150 with a filing service, $500 with Stripe Atlas. If a lawyer quotes you $2,500 for a standard Delaware C-Corp, walk away.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <span className="underline decoration-black/20 underline-offset-4 text-black">Founder agreement</span>{" "}
              &mdash; $0 with a template (we have one). $500&ndash;$1,500 if you want a lawyer to customize it. Worth it if you have a complex co-founder situation.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <span className="underline decoration-black/20 underline-offset-4 text-black">SAFE round</span>{" "}
              &mdash; $0&ndash;$2,000. SAFEs are standardized by Y Combinator. If a lawyer wants $5K+ to review a standard SAFE, they&apos;re overcharging.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <span className="underline decoration-black/20 underline-offset-4 text-black">Priced round (Series A)</span>{" "}
              &mdash; $15K&ndash;$40K. This is where you actually need a lawyer. Term sheets, preferred stock, board seats, protective provisions. Don&apos;t cheap out here.
            </p>
            <p className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
              <span className="underline decoration-black/20 underline-offset-4 text-black">Trademark filing</span>{" "}
              &mdash; $250&ndash;$350 per class if you file yourself. $800&ndash;$1,500 through a lawyer. The DIY route is fine for most startups.
            </p>
          </div>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            The best legal strategy for a startup is to need
            as little legal as possible. Templates for the standard stuff.
            A good lawyer for everything else.
          </p>
        </blockquote>

        {/* Contracts */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Contract mistakes that kill startups
          </h2>
          <div className="mt-6 space-y-4">
            {CONTRACT_MISTAKES.map((m, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {m}
              </p>
            ))}
          </div>
        </section>

        {/* Compliance */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Compliance mistakes that cost real money
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Compliance is the tax you pay for having a legal entity.
            It&apos;s not optional, it&apos;s not exciting, and missing
            deadlines has real consequences.
          </p>
          <div className="mt-6 space-y-4">
            {COMPLIANCE_MISTAKES.map((m, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {m}
              </p>
            ))}
          </div>
        </section>

        {/* IP */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            IP mistakes that haunt you
          </h2>
          <div className="mt-6 space-y-4">
            {IP_MISTAKES.map((m, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {m}
              </p>
            ))}
          </div>
        </section>

        {/* Employment */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Hiring mistakes with legal consequences
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            The moment you bring someone else into your company &mdash;
            co-founder, employee, contractor &mdash; you have legal obligations.
            Most founders learn this the hard way.
          </p>
          <div className="mt-6 space-y-4">
            {EMPLOYMENT_MISTAKES.map((m, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {m}
              </p>
            ))}
          </div>
        </section>

        {/* When you actually need a lawyer */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            When you actually need a lawyer
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Not every legal task needs a lawyer. Here&apos;s the split:
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Use templates (free):
            </span>{" "}
            Founder agreements, IP assignments, NDAs, advisor agreements,
            employee offer letters, contractor agreements, basic privacy
            policies. These are standardized. Use good templates, fill them
            in, sign them.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Get a lawyer ($500&ndash;$2K):
            </span>{" "}
            Complex founder splits, unusual vesting schedules, reviewing a
            SAFE with non-standard terms, employment questions in regulated
            industries, state-specific compliance questions.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Get a great lawyer ($5K+):
            </span>{" "}
            Priced equity rounds, M&amp;A, licensing negotiations, patent
            filings, regulatory approvals, any situation where the other
            side has a lawyer and you don&apos;t.
          </p>
        </section>
      </div>

      {/* Separator */}
      <div className="my-20 flex justify-center gap-1.5">
        <span className="h-[3px] w-[3px] bg-black/25" />
        <span className="h-[3px] w-[3px] bg-black/25" />
        <span className="h-[3px] w-[3px] bg-black/25" />
      </div>

      {/* Keywords */}
      <h2 className="text-[13px] font-medium uppercase tracking-[0.15em] text-black/30">
        Words you need to know
      </h2>

      <div className="mt-8 space-y-8">
        {KEYWORDS.map((k, i) => (
          <div key={i}>
            <p className="text-[20px] font-medium leading-[1.4] text-black">{k.term}</p>
            <p className="mt-2 text-[17px] leading-[1.9] text-black/50">
              {k.explanation}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 pb-8">
        <Link
          href="/legal/contracts"
          className="inline-flex items-center gap-2.5 border border-black bg-black px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-black/90"
        >
          Browse legal templates
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
