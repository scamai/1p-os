"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ── Feature Steps ── */

interface FeatureStep {
  id: string;
  num: string;
  title: string;
  description: string;
  features: string[];
  href: string;
}

const STEPS: FeatureStep[] = [
  {
    id: "company",
    num: "01",
    title: "Company",
    description: "Set up your founders, equity, ideation, and incorporation.",
    features: ["Founders & Roles", "Equity & Cap Table", "Ideation", "Incorporation", "Solution Deck", "Apply to Accelerator"],
    href: "/company/founders",
  },
  {
    id: "money",
    num: "02",
    title: "Money",
    description: "Track fundraising, manage runway, and plan your finances.",
    features: ["Fundraising Pipeline", "Runrate & Runway"],
    href: "/money/fundraising",
  },
  {
    id: "business",
    num: "03",
    title: "Business",
    description: "Define your model, pricing, market, and go-to-market strategy.",
    features: ["Business Model Canvas", "Pricing Strategy", "Market Research", "Go-to-Market", "Marketing"],
    href: "/business/model",
  },
  {
    id: "legal",
    num: "04",
    title: "Legal",
    description: "Generate templates, manage SAFEs, and protect your IP.",
    features: ["Contract Templates", "SAFEs", "IP & Trademarks"],
    href: "/legal/contracts",
  },
];

/* ── Icons ── */

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  );
}

/* ── State ── */

type StepStatus = "locked" | "current" | "unlocked" | "skipped";

export default function RootPage() {
  const router = useRouter();
  const [statuses, setStatuses] = React.useState<Record<string, StepStatus>>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("1p-unlock-status");
      if (saved) {
        try { return JSON.parse(saved); } catch { /* ignore */ }
      }
    }
    // Default: first step is current, rest are locked
    const defaults: Record<string, StepStatus> = {};
    STEPS.forEach((step, i) => {
      defaults[step.id] = i === 0 ? "current" : "locked";
    });
    return defaults;
  });

  // Persist to localStorage
  React.useEffect(() => {
    localStorage.setItem("1p-unlock-status", JSON.stringify(statuses));
  }, [statuses]);

  const allDone = STEPS.every((s) => statuses[s.id] === "unlocked" || statuses[s.id] === "skipped");

  function advanceNext(currentId: string) {
    const idx = STEPS.findIndex((s) => s.id === currentId);
    setStatuses((prev) => {
      const next = { ...prev };
      // Unlock the next locked step as current
      for (let i = idx + 1; i < STEPS.length; i++) {
        if (next[STEPS[i].id] === "locked") {
          next[STEPS[i].id] = "current";
          break;
        }
      }
      return next;
    });
  }

  function handleUnlock(step: FeatureStep) {
    setStatuses((prev) => ({ ...prev, [step.id]: "unlocked" }));
    advanceNext(step.id);
  }

  function handleSkip(step: FeatureStep) {
    setStatuses((prev) => ({ ...prev, [step.id]: "skipped" }));
    advanceNext(step.id);
  }

  function handleEnter() {
    // Navigate to the first unlocked feature
    const first = STEPS.find((s) => statuses[s.id] === "unlocked");
    if (first) {
      router.push(first.href);
    } else {
      router.push("/company/founders");
    }
  }

  function handleReset() {
    const defaults: Record<string, StepStatus> = {};
    STEPS.forEach((step, i) => {
      defaults[step.id] = i === 0 ? "current" : "locked";
    });
    setStatuses(defaults);
    localStorage.removeItem("1p-unlock-status");
  }

  return (
    <div className="relative min-h-screen bg-white text-black">
      {/* Header */}
      <header className="mx-auto flex max-w-[600px] items-center justify-between px-6 pt-8">
        <span className="font-heading text-[22px] italic font-extralight tracking-[-0.02em] text-black">
          1P
        </span>
        <Link
          href="/auth/login"
          className="text-[13px] text-black/40 transition-colors duration-150 hover:text-black"
        >
          Sign in
        </Link>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-[600px] px-6 pt-16 pb-24">
        <h1 className="font-heading text-[clamp(1.75rem,4vw,2.5rem)] italic font-extralight leading-[1.1] tracking-[-0.02em] text-black">
          Set up your company
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-black/40">
          Unlock each section to activate it, or skip to come back later.
        </p>

        {/* Progress */}
        <div className="mt-8 flex items-center gap-2">
          {STEPS.map((step) => {
            const status = statuses[step.id];
            return (
              <div
                key={step.id}
                className={`h-1 flex-1 transition-colors duration-300 ${
                  status === "unlocked"
                    ? "bg-black"
                    : status === "skipped"
                      ? "bg-black/10"
                      : status === "current"
                        ? "bg-black/30"
                        : "bg-black/[0.06]"
                }`}
              />
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-black/25">
          {STEPS.filter((s) => statuses[s.id] === "unlocked").length} of {STEPS.length} unlocked
        </p>

        {/* Steps */}
        <div className="mt-10 space-y-0">
          {STEPS.map((step, idx) => {
            const status = statuses[step.id];
            const isCurrent = status === "current";
            const isUnlocked = status === "unlocked";
            const isSkipped = status === "skipped";
            const isLocked = status === "locked";

            return (
              <div
                key={step.id}
                className={`border border-black/[0.06] p-6 transition-colors duration-200 ${
                  idx > 0 ? "-mt-px" : ""
                } ${
                  isCurrent
                    ? "bg-white border-black/[0.12]"
                    : isUnlocked
                      ? "bg-white"
                      : isSkipped
                        ? "bg-black/[0.01]"
                        : "bg-black/[0.02]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {/* Step indicator */}
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center text-[11px] font-medium ${
                          isUnlocked
                            ? "bg-black text-white"
                            : isSkipped
                              ? "border border-dashed border-black/15 text-black/25"
                              : isCurrent
                                ? "border border-black/30 text-black/70"
                                : "border border-black/[0.08] text-black/20"
                        }`}
                      >
                        {isUnlocked ? <CheckIcon /> : step.num}
                      </span>

                      <div>
                        <h2
                          className={`text-[15px] font-medium ${
                            isLocked ? "text-black/30" : isSkipped ? "text-black/35" : "text-black"
                          }`}
                        >
                          {step.title}
                        </h2>
                      </div>
                    </div>

                    {/* Description — show for current or unlocked */}
                    {(isCurrent || isUnlocked) && (
                      <p className="mt-3 ml-10 text-[13px] leading-[1.6] text-black/40">
                        {step.description}
                      </p>
                    )}

                    {/* Feature list — show for current */}
                    {isCurrent && (
                      <div className="mt-4 ml-10 flex flex-wrap gap-x-4 gap-y-1.5">
                        {step.features.map((f) => (
                          <span key={f} className="text-[12px] text-black/30">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Skipped label */}
                    {isSkipped && (
                      <p className="mt-2 ml-10 text-[11px] text-black/20">Skipped — you can unlock this later</p>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex shrink-0 items-center gap-2 pt-0.5">
                    {isCurrent && (
                      <>
                        <button
                          onClick={() => handleSkip(step)}
                          className="flex h-8 items-center gap-1.5 border border-black/[0.08] px-3 text-[12px] text-black/40 transition-colors hover:border-black/15 hover:text-black/60"
                        >
                          <SkipIcon />
                          Skip
                        </button>
                        <button
                          onClick={() => handleUnlock(step)}
                          className="flex h-8 items-center gap-1.5 bg-black px-4 text-[12px] font-medium text-white transition-opacity hover:opacity-80"
                        >
                          Unlock
                          <ArrowRightIcon />
                        </button>
                      </>
                    )}
                    {isUnlocked && (
                      <span className="text-[11px] font-medium text-black/40">
                        Unlocked
                      </span>
                    )}
                    {isSkipped && (
                      <button
                        onClick={() => {
                          setStatuses((prev) => ({ ...prev, [step.id]: "unlocked" }));
                        }}
                        className="flex h-8 items-center gap-1.5 border border-black/[0.08] px-3 text-[12px] text-black/40 transition-colors hover:border-black/15 hover:text-black/60"
                      >
                        Unlock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enter button — shown when all steps are done */}
        {allDone && (
          <div className="mt-8">
            <button
              onClick={handleEnter}
              className="flex h-12 w-full items-center justify-center gap-2 bg-black text-[14px] font-medium uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-80"
            >
              Enter dashboard
              <ArrowRightIcon />
            </button>
          </div>
        )}

        {/* Reset */}
        {!STEPS.every((s) => statuses[s.id] === "current" || statuses[s.id] === "locked") && (
          <div className="mt-6 text-center">
            <button
              onClick={handleReset}
              className="text-[11px] text-black/20 transition-colors hover:text-black/40"
            >
              Reset selections
            </button>
          </div>
        )}

        {/* Footer note */}
        <p className="mt-12 text-center text-[11px] text-black/15 leading-relaxed">
          Free and open source · v1.0
        </p>
      </main>
    </div>
  );
}
