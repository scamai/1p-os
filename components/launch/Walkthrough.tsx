"use client";

import { useState, useCallback } from "react";

const SLIDES = [
  {
    tag: "Welcome",
    headline: "We made the mistakes\nso you don\u2019t have to.",
    body: "This isn\u2019t another project management tool. It\u2019s a step-by-step guide built by founders who\u2019ve been through incorporation, fundraising, legal, taxes, and every trap in between.",
  },
  {
    tag: "The problem",
    headline: "90% of startups fail.\nMost from avoidable mistakes.",
    body: "Wrong cofounder. Wrong entity type. Wrong legal partner. Missed 83(b) elections. Bad cap tables. These aren\u2019t hard problems \u2014 they\u2019re just invisible until it\u2019s too late.",
  },
  {
    tag: "How it works",
    headline: "A guided path\nfrom idea to real company.",
    body: "We break the entire process into clear phases \u2014 incorporation, legal setup, banking, equity, compliance, fundraising \u2014 and walk you through each one in order.",
  },
  {
    tag: "What makes this different",
    headline: "Built for first-time founders.\nNot operators.",
    body: "We don\u2019t assume you know what a registered agent is, or why Delaware matters, or what vesting means. Every step explains the why \u2014 not just the what.",
  },
  {
    tag: "Free & open source",
    headline: "No fees. No upsells.\nJust the playbook.",
    body: "This is AGPLv3 open source. We built it because we wished it existed when we started. Let\u2019s get your company set up the right way.",
  },
];

export function Walkthrough({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

  const next = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      setCurrent((s) => s + 1);
    }
  }, [isLast, onComplete]);

  const back = useCallback(() => {
    setCurrent((s) => Math.max(0, s - 1));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-6 sm:px-10">
        <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-black/30">
          {slide.tag}
        </span>
        <button
          onClick={onComplete}
          className="text-[13px] text-black/30 transition-colors duration-150 hover:text-black"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 sm:px-10">
        <div className="w-full max-w-[520px]">
          <h1 className="font-heading text-[clamp(2rem,5vw,3rem)] italic font-light leading-[1.15] tracking-[-0.01em] text-black whitespace-pre-line">
            {slide.headline}
          </h1>

          <p className="mt-6 text-[15px] leading-[1.8] text-black/50">
            {slide.body}
          </p>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-6 py-6 sm:px-10">
        {/* Progress */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-[3px] transition-all duration-300 ${
                i === current
                  ? "w-6 bg-black"
                  : i < current
                  ? "w-1.5 bg-black/20"
                  : "w-1.5 bg-black/[0.08]"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {current > 0 && (
            <button
              onClick={back}
              className="px-4 py-3 text-[13px] text-black/40 transition-colors duration-150 hover:text-black"
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            className="bg-black px-7 py-3 text-[13px] font-medium uppercase tracking-[0.1em] text-white transition-opacity duration-150 hover:opacity-80"
          >
            {isLast ? "Get started" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
