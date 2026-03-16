"use client";

import { useState, useEffect, useMemo } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

// ---------- Tax Calendar ----------

interface TaxDate {
  id: string;
  date: string;
  title: string;
  entity: "C-Corp" | "LLC" | "Both";
  description: string;
  done: boolean;
}

const DEFAULT_DATES: TaxDate[] = [
  {
    id: "t1",
    date: "01-15",
    title: "Q4 Estimated Tax Payment",
    entity: "Both",
    description: "Federal estimated tax payment for Q4 of the prior year.",
    done: false,
  },
  {
    id: "t2",
    date: "03-15",
    title: "S-Corp / Partnership Tax Return (Form 1065/1120-S)",
    entity: "LLC",
    description: "File partnership or S-Corp return, or request extension.",
    done: false,
  },
  {
    id: "t3",
    date: "04-15",
    title: "C-Corp Tax Return (Form 1120)",
    entity: "C-Corp",
    description: "File corporate tax return or request extension.",
    done: false,
  },
  {
    id: "t4",
    date: "04-15",
    title: "Individual Tax Return (Form 1040)",
    entity: "LLC",
    description: "File personal tax return with Schedule C/K-1, or request extension.",
    done: false,
  },
  {
    id: "t5",
    date: "04-15",
    title: "Q1 Estimated Tax Payment",
    entity: "Both",
    description: "Federal estimated tax payment for Q1.",
    done: false,
  },
  {
    id: "t6",
    date: "06-15",
    title: "Q2 Estimated Tax Payment",
    entity: "Both",
    description: "Federal estimated tax payment for Q2.",
    done: false,
  },
  {
    id: "t7",
    date: "09-15",
    title: "Q3 Estimated Tax Payment",
    entity: "Both",
    description: "Federal estimated tax payment for Q3.",
    done: false,
  },
  {
    id: "t8",
    date: "09-15",
    title: "Extended S-Corp / Partnership Return Due",
    entity: "LLC",
    description: "If extension filed, partnership/S-Corp return is due.",
    done: false,
  },
  {
    id: "t9",
    date: "10-15",
    title: "Extended C-Corp Return Due",
    entity: "C-Corp",
    description: "If extension filed, corporate return is due.",
    done: false,
  },
  {
    id: "t10",
    date: "10-15",
    title: "Extended Individual Return Due",
    entity: "LLC",
    description: "If extension filed, personal return is due.",
    done: false,
  },
  {
    id: "t11",
    date: "01-31",
    title: "W-2 and 1099 Forms Due",
    entity: "Both",
    description: "Issue W-2s to employees and 1099-NEC to contractors.",
    done: false,
  },
  {
    id: "t12",
    date: "Varies",
    title: "State Annual Report / Franchise Tax",
    entity: "Both",
    description:
      "Varies by state. Delaware franchise tax due Mar 1. CA $800 minimum franchise tax.",
    done: false,
  },
];

// ---------- Deductions ----------

interface Deduction {
  id: string;
  category: string;
  amount: number;
  hasReceipt: boolean;
}

const DEDUCTION_CATEGORIES = [
  "Home Office",
  "Vehicle / Mileage",
  "Equipment & Software",
  "Marketing & Advertising",
  "Professional Services",
  "Travel & Meals",
  "Education & Training",
  "Health Insurance",
  "Retirement Contributions",
  "Subscriptions & Tools",
  "Other",
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function fmt(n: number) {
  return `$${Math.abs(n).toLocaleString()}`;
}

export default function Page() {
  const [taxDates, setTaxDates] = useState<TaxDate[]>(DEFAULT_DATES);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [entityFilter, setEntityFilter] = useState<"Both" | "C-Corp" | "LLC">("Both");
  const [revenue, setRevenue] = useState(0);
  const [taxRate, setTaxRate] = useState(21); // C-Corp default
  const [showDeductionForm, setShowDeductionForm] = useState(false);
  const [dCat, setDCat] = useState(DEDUCTION_CATEGORIES[0]);
  const [dAmount, setDAmount] = useState("");
  const [dReceipt, setDReceipt] = useState(false);
  const [tab, setTab] = useState<"calendar" | "deductions" | "calculator">("calendar");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("1pos_tax");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.taxDates) setTaxDates(parsed.taxDates);
      if (parsed.deductions) setDeductions(parsed.deductions);
      if (parsed.revenue != null) setRevenue(parsed.revenue);
      if (parsed.taxRate != null) setTaxRate(parsed.taxRate);
      if (parsed.entityFilter) setEntityFilter(parsed.entityFilter);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      "1pos_tax",
      JSON.stringify({ taxDates, deductions, revenue, taxRate, entityFilter })
    );
  }, [taxDates, deductions, revenue, taxRate, entityFilter, loaded]);

  function toggleDate(id: string) {
    setTaxDates((prev) =>
      prev.map((d) => (d.id === id ? { ...d, done: !d.done } : d))
    );
  }

  function addDeduction() {
    if (!dAmount) return;
    const d: Deduction = {
      id: genId(),
      category: dCat,
      amount: parseFloat(dAmount) || 0,
      hasReceipt: dReceipt,
    };
    setDeductions((prev) => [d, ...prev]);
    setDAmount("");
    setDReceipt(false);
    setShowDeductionForm(false);
  }

  function removeDeduction(id: string) {
    setDeductions((prev) => prev.filter((d) => d.id !== id));
  }

  const filteredDates = useMemo(
    () =>
      taxDates
        .filter((d) => entityFilter === "Both" || d.entity === entityFilter || d.entity === "Both")
        .sort((a, b) => a.date.localeCompare(b.date)),
    [taxDates, entityFilter]
  );

  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
  const taxableIncome = Math.max(0, revenue - totalDeductions);
  const estimatedTax = taxableIncome * (taxRate / 100);
  const effectiveRate = revenue > 0 ? ((estimatedTax / revenue) * 100).toFixed(1) : "0.0";

  const deductionsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    deductions.forEach((d) => {
      map.set(d.category, (map.get(d.category) ?? 0) + d.amount);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [deductions]);

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-[640px]">
      <Education {...EDUCATION.tax} />
      <h1 className="text-lg font-semibold text-zinc-900">Tax</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Key dates, deduction tracking, and estimated tax calculations.
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        {(["calendar", "deductions", "calculator"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-md border transition-colors capitalize ${
              tab === t
                ? "bg-black text-white border-black"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ===== Calendar Tab ===== */}
      {tab === "calendar" && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-zinc-500">Entity type:</span>
            {(["Both", "C-Corp", "LLC"] as const).map((e) => (
              <button
                key={e}
                onClick={() => setEntityFilter(e)}
                className={`px-3 py-1 text-xs rounded-md border ${
                  entityFilter === e
                    ? "bg-black text-white border-black"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {e === "Both" ? "All" : e}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredDates.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-3 bg-white transition-colors ${
                  item.done ? "border-zinc-100" : "border-zinc-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleDate(item.id)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.done
                        ? "bg-black border-black"
                        : "border-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {item.done && (
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                        {item.date}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          item.entity === "C-Corp"
                            ? "bg-zinc-900 text-white"
                            : item.entity === "LLC"
                            ? "bg-zinc-200 text-zinc-700"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {item.entity}
                      </span>
                    </div>
                    <p
                      className={`text-sm font-medium mt-1 ${
                        item.done ? "text-zinc-400 line-through" : "text-zinc-900"
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Deductions Tab ===== */}
      {tab === "deductions" && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-zinc-600">
                Total deductions: <span className="font-medium text-zinc-900">{fmt(totalDeductions)}</span>
              </p>
            </div>
            <button
              onClick={() => setShowDeductionForm(!showDeductionForm)}
              className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800"
            >
              + Add
            </button>
          </div>

          {showDeductionForm && (
            <div className="border border-zinc-200 rounded-lg p-4 bg-white mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Category</label>
                  <select
                    value={dCat}
                    onChange={(e) => setDCat(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {DEDUCTION_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={dAmount}
                    onChange={(e) => setDAmount(e.target.value)}
                    placeholder="0"
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={dReceipt}
                  onChange={(e) => setDReceipt(e.target.checked)}
                  className="accent-black"
                />
                <span className="text-sm text-zinc-600">Receipt on file</span>
              </label>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={addDeduction}
                  className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800"
                >
                  Add Deduction
                </button>
                <button
                  onClick={() => setShowDeductionForm(false)}
                  className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Summary by category */}
          {deductionsByCategory.length > 0 && (
            <div className="mb-4 border border-zinc-200 rounded-lg p-3 bg-white">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                By Category
              </h3>
              <div className="space-y-1">
                {deductionsByCategory.map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700">{cat}</span>
                    <span className="text-sm font-medium text-zinc-900">{fmt(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deduction list */}
          <div className="space-y-1">
            {deductions.length === 0 && (
              <p className="text-sm text-zinc-400 py-8 text-center">
                No deductions tracked yet.
              </p>
            )}
            {deductions.map((d) => (
              <div
                key={d.id}
                className="border border-zinc-200 rounded-lg p-3 bg-white flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-zinc-900">{d.category}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-500">{fmt(d.amount)}</span>
                    {d.hasReceipt ? (
                      <span className="text-[10px] bg-zinc-900 text-white px-1.5 py-0.5 rounded-full">
                        Receipt
                      </span>
                    ) : (
                      <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">
                        No receipt
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeDeduction(d.id)}
                  className="text-xs text-zinc-300 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Calculator Tab ===== */}
      {tab === "calculator" && (
        <div className="mt-4">
          <div className="border border-zinc-200 rounded-lg p-4 bg-white">
            <h3 className="text-sm font-medium text-zinc-900 mb-4">Estimated Tax Calculator</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Annual Revenue ($)</label>
                <input
                  type="number"
                  value={revenue || ""}
                  onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
                  placeholder="100000"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Tax Rate (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-24 border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <div className="flex gap-1">
                    {[
                      { label: "C-Corp 21%", rate: 21 },
                      { label: "SE 15.3%", rate: 15.3 },
                      { label: "Bracket 24%", rate: 24 },
                      { label: "Bracket 32%", rate: 32 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setTaxRate(preset.rate)}
                        className={`px-2 py-1 text-[10px] rounded border ${
                          taxRate === preset.rate
                            ? "bg-black text-white border-black"
                            : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Revenue</span>
                  <span className="text-sm text-zinc-900">{fmt(revenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Total Deductions</span>
                  <span className="text-sm text-zinc-900">- {fmt(totalDeductions)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-100 pt-2">
                  <span className="text-sm font-medium text-zinc-900">Taxable Income</span>
                  <span className="text-sm font-medium text-zinc-900">{fmt(taxableIncome)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Tax Rate</span>
                  <span className="text-sm text-zinc-900">{taxRate}%</span>
                </div>
                <div className="flex items-center justify-between border-t-2 border-zinc-900 pt-3">
                  <span className="text-base font-semibold text-zinc-900">Estimated Tax</span>
                  <span className="text-base font-semibold text-zinc-900">{fmt(estimatedTax)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Effective rate</span>
                  <span className="text-xs text-zinc-500">{effectiveRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Quarterly estimate</span>
                  <span className="text-xs text-zinc-500">{fmt(estimatedTax / 4)}/quarter</span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-zinc-400 text-center">
            This is a simplified estimate. Consult a tax professional for accurate calculations.
          </p>
        </div>
      )}
    </div>
  );
}
