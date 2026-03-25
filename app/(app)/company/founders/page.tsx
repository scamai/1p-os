"use client";

import Link from "next/link";

// ── Keywords ──

const KEYWORDS: { term: string; explanation: string }[] = [
  {
    term: "Equity Split",
    explanation: "How you divide ownership. There\u2019s no perfect formula \u2014 but equal isn\u2019t always fair. Consider who had the idea, who\u2019s full-time, who\u2019s putting in capital, and who has the skills you can\u2019t hire for.",
  },
  {
    term: "Vesting",
    explanation: "You don\u2019t get all your equity at once. It \u2018vests\u2019 over time \u2014 typically 4 years. If a co-founder leaves after 6 months, they don\u2019t walk away with half the company. This protects everyone.",
  },
  {
    term: "Cliff",
    explanation: "A waiting period \u2014 usually 12 months \u2014 before any equity vests. If someone leaves before the cliff, they get nothing. Think of it as a trial period for the partnership.",
  },
  {
    term: "Cap Table",
    explanation: "A spreadsheet showing who owns what. Every founder, investor, and employee with equity appears here. Keep it clean from day one \u2014 messy cap tables scare investors away.",
  },
  {
    term: "ESOP",
    explanation: "Employee Stock Option Pool. A reserve of shares \u2014 usually 10\u201315% \u2014 set aside for future hires. VCs will often require this before they invest, and it comes out of the founders\u2019 share.",
  },
];

const MISTAKES = [
  "Splitting equity 50/50 to avoid an awkward conversation.",
  "No vesting. Someone leaves after 3 months with half the company.",
  "Co-founding with a friend because they\u2019re your friend, not because they\u2019re the right person.",
  "Choosing someone who agrees with everything you say. You need friction, not a mirror.",
  "Skipping the hard conversations about money, commitment, and what happens if it doesn\u2019t work out.",
  "Nothing in writing. \u201CWe trust each other\u201D is not a legal document.",
];

// ── Page ──

export default function FoundersPage() {
  return (
    <article className="mx-auto max-w-[680px] px-6 py-16 md:py-24">
      {/* Title */}
      <header>
        <h1 className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] italic font-extralight leading-[1.1] tracking-[-0.03em] text-black">
          Founders
        </h1>
        <div className="mt-8 flex items-center gap-3 text-[13px] text-black/40">
          <span>4 min read</span>
        </div>
      </header>

      {/* Opening — large lede */}
      <p className="mt-14 text-[22px] leading-[1.75] text-black/70 font-light">
        The most important decision you&apos;ll make isn&apos;t your idea,
        your market, or your product. It&apos;s who you build with &mdash;
        or whether you build alone.
      </p>

      {/* Finding a co-founder */}
      <div className="mt-16 space-y-12">
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Finding a co-founder
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            A great co-founder doubles your capacity and halves the loneliness.
            A bad one is worse than none at all.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              More startups die from co-founder conflict than from running out of money.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Look for someone who complements you, not mirrors you.
            </span>{" "}
            If you&apos;re the visionary, find the operator. If you&apos;re the
            builder, find the seller. The best partnerships are two people
            who are strong where the other is weak.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            Test the relationship before you commit. Work on a small
            project together first. See how they handle disagreement, stress,
            and ambiguity.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              A co-founder is harder to divorce than a spouse.
            </span>
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            One of the most common mistakes: meeting someone at a startup event,
            vibing for two hours, and deciding to build a company together.{" "}
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              This is not a one-night stand.
            </span>{" "}
            You&apos;re signing up for years of shared bank accounts, hard
            conversations, and 2am Slack messages. You wouldn&apos;t marry someone
            you met at a bar last Tuesday. Don&apos;t co-found with them either.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote className="border-l-[3px] border-black pl-8">
          <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
            A co-founder relationship is a marriage
            without the romance. Choose accordingly.
          </p>
        </blockquote>

        {/* Mistakes */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Mistakes that kill co-founder relationships
          </h2>
          <div className="mt-6 space-y-4">
            {MISTAKES.map((m, i) => (
              <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
                {m}
              </p>
            ))}
          </div>
        </section>

        {/* Going solo */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Going solo
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Solo is fine. Plenty of billion-dollar companies were built by one
            person with conviction. You move faster, decide faster, and answer
            to no one.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            The trade-off is you carry everything &mdash; every high, every low,
            every 3am doubt &mdash; alone. Build a network of other founders
            early. You&apos;ll need people who understand what you&apos;re going through.
          </p>
        </section>

        {/* Equity & vesting */}
        <section>
          <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
            Why equity and vesting matter
          </h2>
          <p className="mt-4 text-[18px] leading-[2] text-black/55">
            Equity is the most valuable thing your company has and the easiest
            thing to get wrong. A 50/50 split feels fair on day one. It stops
            feeling fair when one person is working 80-hour weeks and the other
            has moved on.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Vesting exists to protect you from this.
            </span>{" "}
            It means equity is earned over time, not given upfront. If someone
            leaves early, the unvested shares come back to the company. Every
            serious investor will ask if you have vesting in place. If you
            don&apos;t, that&apos;s a red flag.
          </p>
          <p className="mt-5 text-[18px] leading-[2] text-black/55">
            <span className="underline decoration-black/20 underline-offset-4 text-black">
              Get it in writing. Get it signed.
            </span>{" "}
            A handshake today becomes a lawsuit tomorrow.
          </p>
        </section>
      </div>

      {/* Separator — three dots */}
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
          href="/company/founder-wellness"
          className="inline-flex items-center gap-2.5 border border-black bg-black px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-black/90"
        >
          Founder Wellness
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
