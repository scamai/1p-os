"use client";

import { useState, useEffect } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

interface AuditItem {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  lastReviewed: string;
  category: string;
}

const DEFAULT_ITEMS: AuditItem[] = [
  // Financial Controls
  {
    id: "fc1",
    title: "Separate business and personal accounts",
    description: "All business transactions go through a dedicated business bank account.",
    checked: false,
    lastReviewed: "",
    category: "Financial Controls",
  },
  {
    id: "fc2",
    title: "Expense approval process",
    description: "Defined process for approving expenses above a threshold.",
    checked: false,
    lastReviewed: "",
    category: "Financial Controls",
  },
  {
    id: "fc3",
    title: "Monthly bank reconciliation",
    description: "Bank statements reconciled with bookkeeping records monthly.",
    checked: false,
    lastReviewed: "",
    category: "Financial Controls",
  },
  {
    id: "fc4",
    title: "Receipt and invoice retention",
    description: "All receipts and invoices stored digitally for at least 7 years.",
    checked: false,
    lastReviewed: "",
    category: "Financial Controls",
  },
  {
    id: "fc5",
    title: "Dual authorization for large payments",
    description: "Payments above $5,000 require secondary approval.",
    checked: false,
    lastReviewed: "",
    category: "Financial Controls",
  },
  // Compliance
  {
    id: "co1",
    title: "Business entity registered and in good standing",
    description: "State registration current, annual reports filed.",
    checked: false,
    lastReviewed: "",
    category: "Compliance",
  },
  {
    id: "co2",
    title: "EIN / Tax ID obtained",
    description: "Federal Employer Identification Number on file.",
    checked: false,
    lastReviewed: "",
    category: "Compliance",
  },
  {
    id: "co3",
    title: "Sales tax compliance",
    description: "Registered for sales tax in required jurisdictions, collecting and remitting.",
    checked: false,
    lastReviewed: "",
    category: "Compliance",
  },
  {
    id: "co4",
    title: "Contractor 1099 reporting",
    description: "1099-NEC forms issued to contractors paid over $600/year.",
    checked: false,
    lastReviewed: "",
    category: "Compliance",
  },
  {
    id: "co5",
    title: "Payroll tax compliance",
    description: "If hiring employees, payroll taxes calculated and remitted on time.",
    checked: false,
    lastReviewed: "",
    category: "Compliance",
  },
  {
    id: "co6",
    title: "Privacy policy and terms of service",
    description: "Legal documents published and up to date.",
    checked: false,
    lastReviewed: "",
    category: "Compliance",
  },
  // Documentation
  {
    id: "dc1",
    title: "Operating agreement / bylaws",
    description: "Corporate governance documents executed and on file.",
    checked: false,
    lastReviewed: "",
    category: "Documentation",
  },
  {
    id: "dc2",
    title: "Cap table maintained",
    description: "Equity ownership records accurate and up to date.",
    checked: false,
    lastReviewed: "",
    category: "Documentation",
  },
  {
    id: "dc3",
    title: "Board resolutions documented",
    description: "Key decisions recorded in meeting minutes or written consents.",
    checked: false,
    lastReviewed: "",
    category: "Documentation",
  },
  {
    id: "dc4",
    title: "Contracts and agreements filed",
    description: "All signed contracts organized and accessible.",
    checked: false,
    lastReviewed: "",
    category: "Documentation",
  },
  {
    id: "dc5",
    title: "Insurance policies current",
    description: "General liability, D&O, or other relevant policies active.",
    checked: false,
    lastReviewed: "",
    category: "Documentation",
  },
  // Security
  {
    id: "sc1",
    title: "Financial system access controls",
    description: "Only authorized users can access bank accounts and financial tools.",
    checked: false,
    lastReviewed: "",
    category: "Security",
  },
  {
    id: "sc2",
    title: "Two-factor authentication on financial accounts",
    description: "2FA enabled on all banking and payment platforms.",
    checked: false,
    lastReviewed: "",
    category: "Security",
  },
  {
    id: "sc3",
    title: "Regular password rotation",
    description: "Passwords for financial systems updated at least quarterly.",
    checked: false,
    lastReviewed: "",
    category: "Security",
  },
];

export default function Page() {
  const [items, setItems] = useState<AuditItem[]>(DEFAULT_ITEMS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("1pos_auditing");
    if (saved) setItems(JSON.parse(saved));
    setLoaded(true);
  }, []);

  function save(updated: AuditItem[]) {
    setItems(updated);
    localStorage.setItem("1pos_auditing", JSON.stringify(updated));
  }

  function toggle(id: string) {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        checked: !item.checked,
        lastReviewed: !item.checked ? new Date().toISOString().slice(0, 10) : item.lastReviewed,
      };
    });
    save(updated);
  }

  function markReviewed(id: string) {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      return { ...item, lastReviewed: new Date().toISOString().slice(0, 10) };
    });
    save(updated);
  }

  const checked = items.filter((i) => i.checked).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

  const categories = Array.from(new Set(items.map((i) => i.category)));

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-[640px]">
      <Education {...EDUCATION.auditing} />
      <h1 className="text-lg font-semibold text-slate-900">Auditing</h1>
      <p className="mt-1 text-sm text-slate-500">
        Financial controls, compliance, and documentation checklist for your startup.
      </p>

      {/* Progress */}
      <div className="mt-6 border border-slate-200 rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-600">
            {checked} of {total} items complete
          </span>
          <span className="font-medium text-slate-900">{pct}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Checklist by category */}
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        const catDone = catItems.filter((i) => i.checked).length;
        return (
          <div key={cat} className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-900">{cat}</h2>
              <span className="text-xs text-slate-500">
                {catDone}/{catItems.length}
              </span>
            </div>
            <div className="space-y-2">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-3 bg-white transition-colors ${
                    item.checked ? "border-slate-100" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggle(item.id)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        item.checked
                          ? "bg-black border-black"
                          : "border-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {item.checked && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          item.checked ? "text-slate-400 line-through" : "text-slate-900"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {item.lastReviewed && (
                          <span className="text-[10px] text-slate-400">
                            Last reviewed: {item.lastReviewed}
                          </span>
                        )}
                        <button
                          onClick={() => markReviewed(item.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-700"
                        >
                          Mark reviewed
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
