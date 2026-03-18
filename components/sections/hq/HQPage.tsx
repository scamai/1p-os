"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// ── Data ──

const CHECKLIST: {
  id: string;
  label: string;
  why: string;
  href: string;
  category: "company" | "money" | "business" | "legal";
}[] = [
  // Company
  { id: "founders", label: "Add founders & equity split", why: "Equity fights kill 62% of startups with co-founders.", href: "/company/founders", category: "company" },
  { id: "ideation", label: "Validate your idea", why: "Make sure you're solving a real problem before building.", href: "/company/ideation", category: "company" },
  { id: "incorporation", label: "Incorporate your company", why: "You need a legal entity for bank accounts, fundraising, contracts.", href: "/company/incorporation", category: "company" },
  { id: "deck", label: "Build your pitch deck", why: "Can't articulate your business = investors pass.", href: "/company/solution-deck", category: "company" },
  // Money
  { id: "fundraising", label: "Set up fundraising pipeline", why: "Track every investor conversation. Know where your round stands.", href: "/money/fundraising", category: "money" },
  { id: "runrate", label: "Track your runway", why: "How long until you run out of money. Know this number always.", href: "/money/runrate", category: "money" },
  { id: "bookkeeping", label: "Start bookkeeping", why: "Messy books = tax panic + investors walk during due diligence.", href: "/money/bookkeeping", category: "money" },
  { id: "tax", label: "Track tax deadlines", why: "Late filings = penalties. Preventable.", href: "/money/tax", category: "money" },
  // Business
  { id: "model", label: "Define your business model", why: "Think through every part of your business on one page.", href: "/business/model", category: "business" },
  { id: "pricing", label: "Set your pricing", why: "#1 revenue lever. Too low = lost money. Too high = no customers.", href: "/business/pricing", category: "business" },
  { id: "gtm", label: "Plan your go-to-market", why: "Turn your product into a business. Plan where and how to launch.", href: "/business/gtm", category: "business" },
  // Legal
  { id: "contracts", label: "Track your contracts", why: "Handshake deals go wrong. No legal protection.", href: "/legal/contracts", category: "legal" },
  { id: "compliance", label: "Check compliance requirements", why: "Missed filings, penalties, legal exposure. All preventable.", href: "/legal/compliance", category: "legal" },
  { id: "ip", label: "Protect your IP", why: "Trademarks, patents, domains. Don't let them expire.", href: "/legal/ip", category: "legal" },
];

const CATEGORY_LABELS: Record<string, string> = {
  company: "Company",
  money: "Money",
  business: "Business",
  legal: "Legal",
};

// ── Page ──

function HQPage() {
  const router = useRouter();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    company: true,
  });

  const toggle = (category: string) => {
    setOpenSections((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  // Group by category
  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof CHECKLIST>();
    for (const item of CHECKLIST) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return map;
  }, []);

  return (
    <div className="mx-auto max-w-[640px] pb-16">
      {/* Hero */}
      <div>
        <h1 className="text-[22px] font-bold text-zinc-900 leading-tight">
          Don&apos;t make the mistakes every first-time founder makes.
        </h1>
      </div>

      {/* Checklist by category */}
      <div className="mt-10 flex flex-col gap-2">
        {Array.from(grouped.entries()).map(([category, items]) => {
          const isOpen = openSections[category] ?? false;
          return (
            <div key={category}>
              <button
                onClick={() => toggle(category)}
                className="flex w-full items-center gap-2 py-2 text-left"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={`text-zinc-400 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {CATEGORY_LABELS[category]}
                </span>
                {!isOpen && (
                  <span className="text-[11px] text-zinc-400 ml-1">
                    {items.length}
                  </span>
                )}
              </button>
              {isOpen && (
                <div className="flex flex-col">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => router.push(item.href)}
                      className="flex items-start gap-3 border-b border-zinc-100 py-3 last:border-0 text-left transition-colors hover:bg-zinc-50 -mx-3 px-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-zinc-900">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-[13px] text-zinc-400">
                          {item.why}
                        </p>
                      </div>
                      <span className="mt-0.5 shrink-0 text-zinc-300">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { HQPage };
