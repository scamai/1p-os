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
    setVisible(!dismissed.has(id));
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
        className="mb-4 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
      >
        Show guide
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-2">
        <div>
          <p className="text-[13px] font-semibold text-zinc-900">{title}</p>
          <p className="text-[12px] text-zinc-500 mt-0.5">{why}</p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors mt-0.5"
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
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600 mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="text-[12px] font-medium text-zinc-700">{step.label}</p>
                {step.detail && (
                  <p className="text-[11px] text-zinc-400 mt-0.5">{step.detail}</p>
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
    why: "Define your founding team, their roles, and how equity is split. This is the first thing investors ask about.",
    steps: [
      { label: "Add yourself", detail: "Name, role, equity %" },
      { label: "Add co-founders", detail: "If any" },
      { label: "Set vesting", detail: "Standard: 4yr / 1yr cliff" },
    ],
  },
  equity: {
    id: "edu_equity",
    title: "Your Cap Table",
    why: "Track who owns what. A clean cap table is essential for fundraising and shows investors you're organized.",
    steps: [
      { label: "Add founders", detail: "With share counts" },
      { label: "Reserve ESOP", detail: "10-15% is standard" },
      { label: "Model dilution", detail: "See what happens when you raise" },
    ],
  },
  ideation: {
    id: "edu_ideation",
    title: "Validate your idea",
    why: "Before writing code or raising money, make sure you're solving a real problem for real people.",
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
    why: "You need a legal entity to open a bank account, raise money, sign contracts, and protect yourself personally.",
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
    why: "A pitch deck forces you to articulate your business clearly. You'll need it for investors, accelerators, and partners.",
    steps: [
      { label: "Fill each slide", detail: "Problem → Solution → Market" },
      { label: "Keep it short", detail: "10 slides max" },
      { label: "Copy & share", detail: "Export as text to paste anywhere" },
    ],
  },
  accelerator: {
    id: "edu_accelerator",
    title: "Get into an accelerator",
    why: "Accelerators give you money, mentorship, and a network. They're the fastest way to go from idea to funded company.",
    steps: [
      { label: "Browse programs", detail: "Filter by deadline & focus" },
      { label: "Track your apps", detail: "Update status as you apply" },
      { label: "Add notes", detail: "Track feedback & contacts" },
    ],
  },
  fundraising: {
    id: "edu_fundraising",
    title: "Raise money",
    why: "Track every investor conversation in one place. Know exactly where you stand in your round at all times.",
    steps: [
      { label: "Set your target", detail: "How much to raise" },
      { label: "Build your pipeline", detail: "Add investors & track status" },
      { label: "Close commitments", detail: "Move from intro → committed" },
    ],
  },
  runrate: {
    id: "edu_runrate",
    title: "Know your numbers",
    why: "Runway = how long until you run out of money. Every founder needs to know this number at all times.",
    steps: [
      { label: "Enter revenue", detail: "Monthly for last 6 months" },
      { label: "Enter expenses", detail: "Monthly for last 6 months" },
      { label: "Set cash balance", detail: "What's in the bank" },
    ],
  },
  bookkeeping: {
    id: "edu_bookkeeping",
    title: "Track every dollar",
    why: "Good bookkeeping now saves you thousands in accounting fees later. Investors will ask for this during due diligence.",
    steps: [
      { label: "Log transactions", detail: "As they happen" },
      { label: "Categorize", detail: "Revenue vs expense" },
      { label: "Review monthly", detail: "Check the summary" },
    ],
  },
  accounting: {
    id: "edu_accounting",
    title: "Financial statements",
    why: "P&L and Balance Sheet are the two reports every investor, bank, and accountant will ask for.",
    steps: [
      { label: "Fill in revenue", detail: "All income sources" },
      { label: "Add expenses", detail: "By category" },
      { label: "Check the math", detail: "Assets = Liabilities + Equity" },
    ],
  },
  auditing: {
    id: "edu_auditing",
    title: "Stay audit-ready",
    why: "Even early-stage companies need basic financial controls. This checklist keeps you prepared for investors and tax season.",
    steps: [
      { label: "Review checklist", detail: "18 items across 4 categories" },
      { label: "Check off items", detail: "As you complete them" },
      { label: "Review quarterly", detail: "Keep it current" },
    ],
  },
  tax: {
    id: "edu_tax",
    title: "Don't miss a deadline",
    why: "Late tax filings = penalties. Track your deadlines, deductions, and estimated payments in one place.",
    steps: [
      { label: "Check calendar", detail: "Key dates for your entity type" },
      { label: "Track deductions", detail: "Every receipt matters" },
      { label: "Estimate taxes", detail: "Know what you'll owe" },
    ],
  },
  businessModel: {
    id: "edu_business_model",
    title: "How will you make money?",
    why: "The Business Model Canvas forces you to think through every part of your business in one page. Used by millions of startups.",
    steps: [
      { label: "Start with Value Prop", detail: "What do you offer?" },
      { label: "Fill each block", detail: "9 blocks total" },
      { label: "Revisit monthly", detail: "It evolves as you learn" },
    ],
  },
  pricing: {
    id: "edu_pricing",
    title: "Price it right",
    why: "Pricing is the #1 lever for revenue. Too low = leaving money on the table. Too high = no customers.",
    steps: [
      { label: "Define tiers", detail: "2-3 tiers is ideal" },
      { label: "List features", detail: "What each tier gets" },
      { label: "Simulate revenue", detail: "How many customers per tier?" },
    ],
  },
  marketResearch: {
    id: "edu_market_research",
    title: "How big is the opportunity?",
    why: "TAM/SAM/SOM shows investors the market size. Competitor analysis shows you know the landscape.",
    steps: [
      { label: "Calculate TAM", detail: "Total addressable market" },
      { label: "Narrow to SAM", detail: "Your reachable segment" },
      { label: "Estimate SOM", detail: "What you can realistically capture" },
    ],
  },
  gtm: {
    id: "edu_gtm",
    title: "Plan your launch",
    why: "A Go-to-Market plan turns your product into a business. Without it, you're just building in the dark.",
    steps: [
      { label: "Pre-launch tasks", detail: "Landing page, waitlist, etc." },
      { label: "Launch plan", detail: "Where and how to announce" },
      { label: "Channel strategy", detail: "Where to find customers" },
    ],
  },
  marketing: {
    id: "edu_marketing",
    title: "Get the word out",
    why: "Consistent marketing is what turns a product into a business. Plan your content, track your channels, run campaigns.",
    steps: [
      { label: "Plan content", detail: "Blog, social, email" },
      { label: "Track channels", detail: "What's working?" },
      { label: "Run campaigns", detail: "Coordinated efforts" },
    ],
  },
  contracts: {
    id: "edu_contracts",
    title: "Protect yourself",
    why: "Every handshake should be a signed contract. Track NDAs, service agreements, and employment contracts here.",
    steps: [
      { label: "Add contracts", detail: "Name, type, counterparty" },
      { label: "Track status", detail: "Draft → Sent → Signed" },
      { label: "Watch expirations", detail: "Don't let them lapse" },
    ],
  },
  safes: {
    id: "edu_safes",
    title: "Simple Agreements for Future Equity",
    why: "SAFEs are the standard way to raise pre-seed/seed money. Track every SAFE and understand the dilution impact.",
    steps: [
      { label: "Add SAFEs", detail: "Investor, amount, cap" },
      { label: "Check dilution", detail: "Pro-forma cap table" },
      { label: "Track status", detail: "Pending vs signed" },
    ],
  },
  compliance: {
    id: "edu_compliance",
    title: "Stay legal",
    why: "Compliance isn't sexy but missing it can kill your company. This checklist covers corporate, employment, tax, and data requirements.",
    steps: [
      { label: "Review items", detail: "20 pre-filled items" },
      { label: "Check off done", detail: "Track due dates" },
      { label: "Review quarterly", detail: "Stay current" },
    ],
  },
  ip: {
    id: "edu_ip",
    title: "Protect your ideas",
    why: "Trademarks, patents, and domains are your company's intellectual property. Track filings, renewals, and status.",
    steps: [
      { label: "Register your name", detail: "Trademark filing" },
      { label: "Secure domains", detail: ".com, .co, .app" },
      { label: "Track renewals", detail: "Don't let them expire" },
    ],
  },
} as const;
