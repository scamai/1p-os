"use client";

import { useState, useEffect, useCallback } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IncStep {
  id: string;
  title: string;
  description: string;
  category: string;
  done: boolean;
  link: string;
}

const STORAGE_KEY = "1pos_incorporation";

const DEFAULT_STEPS: Omit<IncStep, "done">[] = [
  {
    id: "idea-validate",
    title: "Validate your business idea",
    description:
      "Talk to potential customers, research the market, and confirm demand before spending money on legal setup.",
    category: "Preparation",
    link: "",
  },
  {
    id: "entity-type",
    title: "Choose entity type (LLC or C-Corp)",
    description:
      "LLC for simplicity and pass-through taxes. Delaware C-Corp if you plan to raise VC money. Most YC/VC-backed startups must be Delaware C-Corps.",
    category: "Formation",
    link: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
  },
  {
    id: "state",
    title: "Select state of incorporation",
    description:
      "Delaware is standard for C-Corps (VC requirement). Wyoming is popular for LLCs. Your home state works for local businesses.",
    category: "Formation",
    link: "",
  },
  {
    id: "name-check",
    title: "Check business name availability",
    description:
      "Search your state's business registry and USPTO trademark database to ensure your name is available.",
    category: "Formation",
    link: "https://www.uspto.gov/trademarks",
  },
  {
    id: "register",
    title: "Register / file formation documents",
    description:
      "File Articles of Incorporation (C-Corp) or Articles of Organization (LLC) with your state. Cost: $50-$500 depending on state.",
    category: "Formation",
    link: "",
  },
  {
    id: "registered-agent",
    title: "Appoint a registered agent",
    description:
      "Required in most states. This is the person/company that receives legal documents on behalf of your business.",
    category: "Formation",
    link: "",
  },
  {
    id: "ein",
    title: "Get an EIN from the IRS",
    description:
      "Employer Identification Number. Free, takes 5 minutes online. You need this before opening a bank account.",
    category: "Tax & Finance",
    link: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
  },
  {
    id: "bylaws",
    title: "Draft bylaws / operating agreement",
    description:
      "Bylaws (C-Corp) or Operating Agreement (LLC). Defines how the company is governed. Use a template or lawyer.",
    category: "Legal",
    link: "",
  },
  {
    id: "stock",
    title: "Issue founder stock / membership interests",
    description:
      "Formally issue shares to founders with vesting schedules. File 83(b) election within 30 days for tax benefits.",
    category: "Legal",
    link: "",
  },
  {
    id: "83b",
    title: "File 83(b) election (if applicable)",
    description:
      "CRITICAL: Must be filed with IRS within 30 days of receiving restricted stock. Saves potentially huge tax liability. Cannot be undone if missed.",
    category: "Tax & Finance",
    link: "",
  },
  {
    id: "bank",
    title: "Open a business bank account",
    description:
      "Keep personal and business finances separate. You'll need your EIN, formation documents, and ID. Mercury, Brex, and traditional banks all work.",
    category: "Tax & Finance",
    link: "",
  },
  {
    id: "accounting",
    title: "Set up bookkeeping / accounting",
    description:
      "Use QuickBooks, Xero, or Wave. Track every expense from day one. Your future self (and accountant) will thank you.",
    category: "Tax & Finance",
    link: "",
  },
  {
    id: "licenses",
    title: "Obtain business licenses & permits",
    description:
      "Requirements vary by state, city, and industry. Check your local government website for what's needed.",
    category: "Compliance",
    link: "https://www.sba.gov/business-guide/launch-your-business/apply-for-licenses-and-permits",
  },
  {
    id: "insurance",
    title: "Get business insurance",
    description:
      "At minimum: general liability. Consider E&O (errors & omissions) if you provide services. Workers' comp if you have employees.",
    category: "Compliance",
    link: "",
  },
  {
    id: "ip",
    title: "Protect intellectual property",
    description:
      "File trademarks for your brand name/logo. Consider provisional patents if applicable. Use NDAs where appropriate.",
    category: "Legal",
    link: "https://www.uspto.gov/trademarks",
  },
  {
    id: "website",
    title: "Set up business website & email",
    description:
      "Get a domain, set up a professional email (not gmail), and create at least a landing page.",
    category: "Operations",
    link: "",
  },
];

function loadSteps(): IncStep[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  return DEFAULT_STEPS.map((s) => ({ ...s, done: false }));
}

function saveSteps(steps: IncStep[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(steps));
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function IncorporationPage() {
  const [steps, setSteps] = useState<IncStep[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    setSteps(loadSteps());
    setLoaded(true);
  }, []);

  const persist = useCallback((next: IncStep[]) => {
    setSteps(next);
    saveSteps(next);
  }, []);

  const toggleStep = (id: string) => {
    persist(
      steps.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const doneCount = steps.filter((s) => s.done).length;
  const progress =
    steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;

  // Group by category
  const categories = Array.from(new Set(steps.map((s) => s.category)));
  const grouped = categories.map((cat) => ({
    category: cat,
    items: steps.filter((s) => s.category === cat),
  }));

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-[800px]">
      <Education {...EDUCATION.incorporation} />
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Incorporation</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Step-by-step checklist to legally set up your company. Pre-filled for
          US LLC and C-Corp formation.
        </p>
      </div>

      {/* Progress */}
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-zinc-700">
            Formation Progress
          </span>
          <span className="text-[13px] font-mono font-semibold text-zinc-900">
            {progress}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-[12px] text-zinc-400">
          {doneCount} of {steps.length} steps completed
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        {categories.map((cat) => {
          const items = steps.filter((s) => s.category === cat);
          const catDone = items.filter((s) => s.done).length;
          return (
            <button
              key={cat}
              onClick={() =>
                setExpandedCategory(expandedCategory === cat ? null : cat)
              }
              className={`rounded-xl border p-3 text-left transition-all ${
                expandedCategory === cat
                  ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <p className="text-[11px] font-medium text-zinc-500 truncate">
                {cat}
              </p>
              <p className="mt-0.5 text-[14px] font-mono font-semibold text-zinc-900">
                {catDone}/{items.length}
              </p>
            </button>
          );
        })}
      </div>

      {/* Checklist by category */}
      <div className="mt-8 space-y-6">
        {grouped.map(({ category, items }) => {
          const catDone = items.filter((s) => s.done).length;
          const isExpanded =
            expandedCategory === null || expandedCategory === category;

          return (
            <div key={category}>
              <button
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category ? null : category
                  )
                }
                className="flex w-full items-center justify-between mb-3"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-[13px] font-semibold text-zinc-700">
                    {category}
                  </h2>
                  <span className="text-[11px] text-zinc-400">
                    {catDone}/{items.length}
                  </span>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-zinc-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isExpanded && (
                <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
                  {items.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-3 px-4 py-3.5 hover:bg-zinc-50 transition-colors"
                    >
                      <button
                        onClick={() => toggleStep(step.id)}
                        className="mt-0.5 shrink-0"
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                            step.done
                              ? "border-zinc-900 bg-zinc-900"
                              : "border-zinc-300 hover:border-zinc-400"
                          }`}
                        >
                          {step.done && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[13px] font-medium ${
                            step.done
                              ? "text-zinc-400 line-through"
                              : "text-zinc-900"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p
                          className={`mt-1 text-[12px] leading-relaxed ${
                            step.done ? "text-zinc-300" : "text-zinc-500"
                          }`}
                        >
                          {step.description}
                        </p>
                        {step.link && (
                          <a
                            href={step.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors"
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            Helpful link
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => {
            const fresh = DEFAULT_STEPS.map((s) => ({ ...s, done: false }));
            persist(fresh);
            setExpandedCategory(null);
          }}
          className="text-[12px] text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Reset checklist
        </button>
      </div>
    </div>
  );
}
