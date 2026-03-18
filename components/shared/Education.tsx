"use client";

import { useState, useEffect } from "react";

/**
 * Education Banner — teaches first-time founders what each page does.
 *
 * Shows at the top of every page with:
 * - What this is (title)
 * - Why it matters (one sentence)
 * - Steps to get started
 * - Dismissable — remembers per page
 * - "Show all tips" to bring them back
 */

interface Step {
  label: string;
  detail?: string;
}

interface EducationProps {
  id: string; // unique key for localStorage
  title: string;
  why: string;
  steps: readonly Step[];
}

const STORAGE_KEY = "1pos_edu_dismissed";

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function setDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function Education({ id, title, why, steps }: EducationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = getDismissed();
    // Default to collapsed — only show if user explicitly opened it
    setVisible(false);
  }, [id]);

  function dismiss() {
    const dismissed = getDismissed();
    dismissed.add(id);
    setDismissed(dismissed);
    setVisible(false);
  }

  function undismiss() {
    const dismissed = getDismissed();
    dismissed.delete(id);
    setDismissed(dismissed);
    setVisible(true);
  }

  if (!visible) {
    return (
      <button
        onClick={undismiss}
        className="mb-4 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
      >
        Show guide
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-2">
        <div>
          <p className="text-[13px] font-semibold text-slate-900">{title}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">{why}</p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-[11px] text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
        >
          Dismiss
        </button>
      </div>

      {/* Steps */}
      <div className="px-5 pb-4 pt-2">
        <div className="flex gap-3 overflow-x-auto">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-2 min-w-[140px] shrink-0"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600 mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="text-[12px] font-medium text-slate-700">{step.label}</p>
                {step.detail && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{step.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Pre-built education content for every page ──

export const EDUCATION = {
  founders: {
    id: "edu_founders",
    title: "Who's building this?",
    why: "Your team, roles, and equity split. Investors ask first.",
    steps: [
      { label: "Add yourself", detail: "Name, role, equity %" },
      { label: "Add co-founders", detail: "If any" },
      { label: "Set vesting", detail: "Standard: 4yr / 1yr cliff" },
    ],
  },
  equity: {
    id: "edu_equity",
    title: "Your Cap Table",
    why: "Track who owns what. Clean cap table = easier fundraising.",
    steps: [
      { label: "Add founders", detail: "With share counts" },
      { label: "Reserve ESOP", detail: "10-15% is standard" },
      { label: "Model dilution", detail: "See what happens when you raise" },
    ],
  },
  ideation: {
    id: "edu_ideation",
    title: "Validate your idea",
    why: "Make sure you're solving a real problem before building.",
    steps: [
      { label: "Define the problem", detail: "What pain exists?" },
      { label: "Identify your customer", detail: "Who has this pain?" },
      { label: "Write your hypothesis", detail: "How you'll solve it" },
      { label: "Study competitors", detail: "What already exists?" },
    ],
  },
  incorporation: {
    id: "edu_incorporation",
    title: "Make it official",
    why: "Legal entity for bank accounts, fundraising, and contracts.",
    steps: [
      { label: "Choose entity type", detail: "LLC or C-Corp" },
      { label: "Register in your state", detail: "Delaware is popular for C-Corp" },
      { label: "Get an EIN", detail: "Free from IRS.gov" },
      { label: "Open a bank account", detail: "Mercury or Brex" },
    ],
  },
  solutionDeck: {
    id: "edu_solution_deck",
    title: "Tell your story",
    why: "Articulate your business in 10 slides. For investors, accelerators, partners.",
    steps: [
      { label: "Fill each slide", detail: "Problem → Solution → Market" },
      { label: "Keep it short", detail: "10 slides max" },
      { label: "Copy & share", detail: "Export as text to paste anywhere" },
    ],
  },
  accelerator: {
    id: "edu_accelerator",
    title: "Get into an accelerator",
    why: "Money, mentorship, and network. Fastest path from idea to funded.",
    steps: [
      { label: "Browse programs", detail: "Filter by deadline & focus" },
      { label: "Track your apps", detail: "Update status as you apply" },
      { label: "Add notes", detail: "Track feedback & contacts" },
    ],
  },
  fundraising: {
    id: "edu_fundraising",
    title: "Raise money",
    why: "Track every investor conversation. Know where your round stands.",
    steps: [
      { label: "Set your target", detail: "How much to raise" },
      { label: "Build your pipeline", detail: "Add investors & track status" },
      { label: "Close commitments", detail: "Move from intro → committed" },
    ],
  },
  runrate: {
    id: "edu_runrate",
    title: "Know your numbers",
    why: "How long until you run out of money. Know this number always.",
    steps: [
      { label: "Enter revenue", detail: "Monthly for last 6 months" },
      { label: "Enter expenses", detail: "Monthly for last 6 months" },
      { label: "Set cash balance", detail: "What's in the bank" },
    ],
  },
  bookkeeping: {
    id: "edu_bookkeeping",
    title: "Track every dollar",
    why: "Saves thousands in accounting fees. Required for due diligence.",
    steps: [
      { label: "Log transactions", detail: "As they happen" },
      { label: "Categorize", detail: "Revenue vs expense" },
      { label: "Review monthly", detail: "Check the summary" },
    ],
  },
  accounting: {
    id: "edu_accounting",
    title: "Financial statements",
    why: "P&L and Balance Sheet. Every investor and bank asks for these.",
    steps: [
      { label: "Fill in revenue", detail: "All income sources" },
      { label: "Add expenses", detail: "By category" },
      { label: "Check the math", detail: "Assets = Liabilities + Equity" },
    ],
  },
  auditing: {
    id: "edu_auditing",
    title: "Stay audit-ready",
    why: "Basic financial controls. Stay ready for investors and tax season.",
    steps: [
      { label: "Review checklist", detail: "18 items across 4 categories" },
      { label: "Check off items", detail: "As you complete them" },
      { label: "Review quarterly", detail: "Keep it current" },
    ],
  },
  tax: {
    id: "edu_tax",
    title: "Don't miss a deadline",
    why: "Late filings = penalties. Track deadlines, deductions, payments.",
    steps: [
      { label: "Check calendar", detail: "Key dates for your entity type" },
      { label: "Track deductions", detail: "Every receipt matters" },
      { label: "Estimate taxes", detail: "Know what you'll owe" },
    ],
  },
  businessModel: {
    id: "edu_business_model",
    title: "How will you make money?",
    why: "Think through every part of your business on one page.",
    steps: [
      { label: "Start with Value Prop", detail: "What do you offer?" },
      { label: "Fill each block", detail: "9 blocks total" },
      { label: "Revisit monthly", detail: "It evolves as you learn" },
    ],
  },
  pricing: {
    id: "edu_pricing",
    title: "Price it right",
    why: "#1 revenue lever. Too low = lost money. Too high = no customers.",
    steps: [
      { label: "Define tiers", detail: "2-3 tiers is ideal" },
      { label: "List features", detail: "What each tier gets" },
      { label: "Simulate revenue", detail: "How many customers per tier?" },
    ],
  },
  marketResearch: {
    id: "edu_market_research",
    title: "How big is the opportunity?",
    why: "Market size and competitor landscape. Investors expect this.",
    steps: [
      { label: "Calculate TAM", detail: "Total addressable market" },
      { label: "Narrow to SAM", detail: "Your reachable segment" },
      { label: "Estimate SOM", detail: "What you can realistically capture" },
    ],
  },
  gtm: {
    id: "edu_gtm",
    title: "Plan your launch",
    why: "Turn your product into a business. Plan where and how to launch.",
    steps: [
      { label: "Pre-launch tasks", detail: "Landing page, waitlist, etc." },
      { label: "Launch plan", detail: "Where and how to announce" },
      { label: "Channel strategy", detail: "Where to find customers" },
    ],
  },
  marketing: {
    id: "edu_marketing",
    title: "Get the word out",
    why: "Plan content, track channels, run campaigns.",
    steps: [
      { label: "Plan content", detail: "Blog, social, email" },
      { label: "Track channels", detail: "What's working?" },
      { label: "Run campaigns", detail: "Coordinated efforts" },
    ],
  },
  contracts: {
    id: "edu_contracts",
    title: "Protect yourself",
    why: "Track NDAs, service agreements, and employment contracts.",
    steps: [
      { label: "Add contracts", detail: "Name, type, counterparty" },
      { label: "Track status", detail: "Draft → Sent → Signed" },
      { label: "Watch expirations", detail: "Don't let them lapse" },
    ],
  },
  safes: {
    id: "edu_safes",
    title: "Simple Agreements for Future Equity",
    why: "Standard for pre-seed/seed raises. Track SAFEs and dilution.",
    steps: [
      { label: "Add SAFEs", detail: "Investor, amount, cap" },
      { label: "Check dilution", detail: "Pro-forma cap table" },
      { label: "Track status", detail: "Pending vs signed" },
    ],
  },
  compliance: {
    id: "edu_compliance",
    title: "Stay legal",
    why: "Corporate, employment, tax, and data requirements. Missing these kills companies.",
    steps: [
      { label: "Review items", detail: "20 pre-filled items" },
      { label: "Check off done", detail: "Track due dates" },
      { label: "Review quarterly", detail: "Stay current" },
    ],
  },
  ip: {
    id: "edu_ip",
    title: "Protect your ideas",
    why: "Trademarks, patents, domains. Track filings and renewals.",
    steps: [
      { label: "Register your name", detail: "Trademark filing" },
      { label: "Secure domains", detail: ".com, .co, .app" },
      { label: "Track renewals", detail: "Don't let them expire" },
    ],
  },
} as const;
