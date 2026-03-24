"use client";

import { useState, useEffect, useMemo } from "react";

import { RelatedPages } from "@/components/shared/RelatedPages";

interface MonthData {
  label: string;
  revenue: number;
  expenses: number;
}

function getLastSixMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleDateString("en-US", { year: "numeric", month: "short" }));
  }
  return months;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

export default function Page() {
  const monthLabels = useMemo(() => getLastSixMonths(), []);

  const [months, setMonths] = useState<MonthData[]>(
    monthLabels.map((label) => ({ label, revenue: 0, expenses: 0 }))
  );
  const [cashInBank, setCashInBank] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("1pos_runrate");
    if (saved) {
      const parsed = JSON.parse(saved);
      setMonths(parsed.months ?? monthLabels.map((label: string) => ({ label, revenue: 0, expenses: 0 })));
      setCashInBank(parsed.cashInBank ?? 0);
    }
    setLoaded(true);
  }, [monthLabels]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("1pos_runrate", JSON.stringify({ months, cashInBank }));
  }, [months, cashInBank, loaded]);

  function updateMonth(idx: number, field: "revenue" | "expenses", value: string) {
    const updated = [...months];
    updated[idx] = { ...updated[idx], [field]: parseFloat(value) || 0 };
    setMonths(updated);
  }

  // Calculations
  const lastMonth = months[months.length - 1];
  const mrr = lastMonth.revenue;
  const arr = mrr * 12;
  const avgExpenses = months.reduce((s, m) => s + m.expenses, 0) / months.length;
  const avgRevenue = months.reduce((s, m) => s + m.revenue, 0) / months.length;
  const burnRate = Math.max(0, avgExpenses - avgRevenue);
  const runway = burnRate > 0 ? Math.round(cashInBank / burnRate) : cashInBank > 0 ? 999 : 0;

  const maxVal = Math.max(...months.flatMap((m) => [m.revenue, m.expenses]), 1);

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-[640px]">

      <h1 className="font-heading text-[clamp(1.5rem,3vw,1.75rem)] italic font-light tracking-[-0.01em] text-black">Runrate</h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-black/40">
        Track revenue, expenses, and understand your runway.
      </p>

      {/* Key metrics */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "MRR", value: fmt(mrr) },
          { label: "ARR", value: fmt(arr) },
          { label: "Burn Rate", value: fmt(burnRate) + "/mo" },
          { label: "Runway", value: runway >= 999 ? "Infinite" : `${runway} mo` },
        ].map((m) => (
          <div key={m.label} className="border border-black/[0.08] rounded-lg p-3 bg-white">
            <p className="text-xs text-black/50">{m.label}</p>
            <p className="font-heading text-[clamp(1.5rem,3vw,1.75rem)] italic font-light tracking-[-0.01em] text-black mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Cash in bank */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-black mb-2">Cash in Bank</label>
        <input
          type="number"
          value={cashInBank || ""}
          onChange={(e) => setCashInBank(parseFloat(e.target.value) || 0)}
          placeholder="100000"
          className="w-full border border-black/[0.08] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      {/* Bar visualization */}
      <div className="mt-8">
        <h2 className="text-sm font-medium text-black mb-4">Revenue vs Expenses</h2>
        <div className="flex items-end gap-1 sm:gap-2 h-32 sm:h-40 overflow-x-auto">
          {months.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
                {/* Revenue bar */}
                <div
                  className="flex-1 bg-black rounded-t transition-all duration-300"
                  style={{ height: `${Math.max(2, (m.revenue / maxVal) * 120)}px` }}
                  title={`Revenue: ${fmt(m.revenue)}`}
                />
                {/* Expense bar */}
                <div
                  className="flex-1 bg-black/30 rounded-t transition-all duration-300"
                  style={{ height: `${Math.max(2, (m.expenses / maxVal) * 120)}px` }}
                  title={`Expenses: ${fmt(m.expenses)}`}
                />
              </div>
              <span className="text-[10px] text-black/50 truncate w-full text-center">
                {m.label.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-black rounded-sm" />
            <span className="text-xs text-black/50">Revenue</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-black/30 rounded-sm" />
            <span className="text-xs text-black/50">Expenses</span>
          </div>
        </div>
      </div>

      {/* Monthly inputs */}
      <div className="mt-8">
        <h2 className="text-sm font-medium text-black mb-3">Monthly Data</h2>
        <div className="space-y-3">
          {months.map((m, i) => (
            <div key={i} className="border border-black/[0.08] rounded-lg p-3 bg-white">
              <p className="text-sm font-medium text-black/70 mb-2">{m.label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-black/50 mb-1">Revenue ($)</label>
                  <input
                    type="number"
                    value={m.revenue || ""}
                    onChange={(e) => updateMonth(i, "revenue", e.target.value)}
                    placeholder="0"
                    className="w-full border border-black/[0.08] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs text-black/50 mb-1">Expenses ($)</label>
                  <input
                    type="number"
                    value={m.expenses || ""}
                    onChange={(e) => updateMonth(i, "expenses", e.target.value)}
                    placeholder="0"
                    className="w-full border border-black/[0.08] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <RelatedPages links={[
        { label: "Fundraising", href: "/money/fundraising", context: "Plan your next raise based on runway" },
        { label: "Pricing Strategy", href: "/business/pricing", context: "Optimize pricing to improve your burn rate" },
        { label: "Business Model", href: "/business/model", context: "Revisit your cost structure and revenue streams" },
      ]} />
    </div>
  );
}
