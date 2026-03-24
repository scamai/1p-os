"use client";

import * as React from "react";
import Link from "next/link";

// ── Content ──

const TRUTHS: { heading: string; body: string }[] = [
  {
    heading: "It will take longer than you think",
    body: "The overnight successes you read about took 7\u201310 years. Airbnb sold cereal boxes to survive. Slack was a failed video game. You are not behind.",
  },
  {
    heading: "Nobody is coming to save you",
    body: "No investor, co-founder, or mentor will care about your company as much as you do. That is the job. The sooner you accept it, the faster you move.",
  },
  {
    heading: "You will be wrong constantly",
    body: "Your first idea is probably wrong. Your first product is probably wrong. Your first pricing is definitely wrong. Speed of learning is the only advantage that matters.",
  },
  {
    heading: "You will hear No more than you hear anything else",
    body: "Investors will pass. Customers will ghost. Partners will say \u201Clet\u2019s circle back\u201D and never do. You\u2019ll pitch 50 people and get 3 replies. That\u2019s not failure \u2014 that\u2019s the game. Every founder you admire has a rejection folder 10x the size of their wins.",
  },
  {
    heading: "Money is oxygen, not the point",
    body: "You need it to survive. But the founders who last are the ones building something they would build even if they were already rich.",
  },
  {
    heading: "Lonely is normal",
    body: "Your friends won\u2019t fully get it. Your family will worry. Other founders are the only people who understand. Find them.",
  },
];

const REASONS = [
  "You saw a problem nobody else is fixing.",
  "You want to build something that outlives you.",
  "You want freedom over your time, your work, your life.",
  "You want to get rich. That\u2019s valid. Be honest about it.",
  "You can\u2019t work for someone else. You tried. It didn\u2019t take.",
  "You want to prove \u2014 to yourself or to someone else \u2014 that you can.",
  "You have no idea why. You just know you have to.",
];

// ── Page ──

function HQPage() {
  return (
    <article className="mx-auto max-w-[680px] px-6 py-16 md:py-24">
      {/* Title */}
      <header>
        <h1 className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] italic font-extralight leading-[1.1] tracking-[-0.03em] text-black">
          Before you started
        </h1>
        <div className="mt-8 flex items-center gap-3 text-[13px] text-black/40">
          <span>5 min read</span>
        </div>
      </header>

      {/* Opening — large lede */}
      <p className="mt-14 text-[22px] leading-[1.75] text-black/70 font-light">
        90% of startups fail. The ones that don&apos;t aren&apos;t
        smarter or luckier. They&apos;re the ones who bent instead of
        broke &mdash; who adapted when the plan fell apart, found a new
        angle when the door closed, and kept moving like water
        through every crack the world gave them.
      </p>

      {/* Hard truths */}
      <div className="mt-16 space-y-12">
        {TRUTHS.map((t, i) => (
          <section key={i}>
            <h2 className="text-[24px] font-medium leading-[1.35] tracking-[-0.015em] text-black">
              {t.heading}
            </h2>
            <p className="mt-4 text-[18px] leading-[2] text-black/55">
              {t.body}
            </p>
          </section>
        ))}
      </div>

      {/* Pull quote */}
      <blockquote className="my-20 border-l-[3px] border-black pl-8">
        <p className="text-[24px] font-light leading-[1.6] tracking-[-0.01em] text-black/80 italic">
          The graveyard of startups is full of people
          who built the wrong thing, not people who quit too early.
        </p>
      </blockquote>

      {/* Why */}
      <p className="text-[22px] leading-[1.75] text-black/70 font-light">
        People start companies for different reasons. Most of them are good.
      </p>

      <div className="mt-10 space-y-5">
        {REASONS.map((r, i) => (
          <p key={i} className="text-[18px] leading-[2] text-black/55 pl-7 border-l-[3px] border-black/[0.08]">
            {r}
          </p>
        ))}
      </div>

      <p className="mt-14 text-[22px] leading-[1.75] text-black/70 font-light">
        It doesn&apos;t matter which one. It matters that you know.
        On the bad days &mdash; and there will be many &mdash; that reason is
        the only thing that keeps you going.
      </p>

      {/* Closing */}
      <p className="mt-20 text-[32px] font-medium leading-[1.35] tracking-[-0.02em] text-black">
        Now go build something.
      </p>

      {/* CTA */}
      <div className="mt-14 pb-8">
        <Link
          href="/company/founders"
          className="inline-flex items-center gap-2.5 border border-black bg-black px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-black/90"
        >
          Start with Founders
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

export { HQPage };
