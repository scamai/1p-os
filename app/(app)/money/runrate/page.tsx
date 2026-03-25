"use client";

import { useState, useEffect, useMemo } from "react";

// ── Helpers ──

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

function runwayAdvice(runway: number, burnRate: number, mrr: number): { headline: string; detail: string } {
  if (burnRate === 0 && mrr === 0) {
    return {
      headline: "Add your numbers to get started",
      detail: "Enter your cash balance and monthly revenue/expenses below. The calculator will tell you how long your money lasts.",
    };
  }
  if (burnRate === 0 || runway >= 999) {
    return {
      headline: "You\u2019re not burning cash",
      detail: "Revenue covers expenses. Focus on growth and keep an eye on costs as you scale.",
    };
  }
  if (runway >= 18) {
    return {
      headline: "Healthy runway",
      detail: "18+ months gives you room to experiment. Focus on product-market fit and don\u2019t rush into fundraising.",
    };
  }
  if (runway >= 12) {
    return {
      headline: "Comfortable, but start planning",
      detail: "12\u201318 months is solid. Start thinking about your next raise now \u2014 fundraising takes 3\u20136 months.",
    };
  }
  if (runway >= 6) {
    return {
      headline: "Time to raise or cut",
      detail: "6\u201312 months. You should be actively fundraising or cutting costs. Don\u2019t wait.",
    };
  }
  if (runway >= 3) {
    return {
      headline: "Danger zone",
      detail: "Under 6 months. Cut non-essential spending immediately. If you\u2019re raising, you needed to start yesterday.",
    };
  }
  return {
    headline: "Emergency",
    detail: "Under 3 months of runway. Make hard decisions now \u2014 cut to survival mode or find bridge funding this week.",
  };
}

// ── Types ──

interface MonthData {
  label: string;
  revenue: number;
  expenses: number;
}

// ── Page ──

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time localStorage hydration
      setMonths(parsed.months ?? monthLabels.map((label: string) => ({ label, revenue: 0, expenses: 0 })));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time localStorage hydration
      setCashInBank(parsed.cashInBank ?? 0);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time localStorage hydration
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
  const netPerMonth = avgRevenue - avgExpenses;
  const maxVal = Math.max(...months.flatMap((m) => [m.revenue, m.expenses]), 1);
  const advice = runwayAdvice(runway, burnRate, mrr);
  const hasData = cashInBank > 0 || avgRevenue > 0 || avgExpenses > 0;

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-[640px] px-4 sm:px-0">
      <h1 className="font-heading text-[clamp(1.5rem,3vw,1.75rem)] italic font-light tracking-[-0.01em] text-black">
        Runrate
      </h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-black/40">
        How long until you run out of money. Know this number always.
      </p>

      {/* Cash in bank */}
      <div className="mt-8">
        <label className="block text-[13px] font-medium text-black mb-2">
          How much cash do you have right now?
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-black/30">$</span>
          <input
            type="number"
            inputMode="decimal"
            value={cashInBank || ""}
            onChange={(e) => setCashInBank(parseFloat(e.target.value) || 0)}
            placeholder="50000"
            className="w-full border border-black/[0.08] pl-8 pr-4 py-3.5 text-[16px] focus:outline-none focus:border-black/30"
          />
        </div>
        <p className="mt-1.5 text-[12px] text-black/30">
          Total across all bank accounts. Be exact.
        </p>
      </div>

      {/* Monthly data — card layout for mobile */}
      <div className="mt-10">
        <h2 className="text-[13px] font-medium text-black mb-1">Monthly numbers</h2>
        <p className="text-[12px] text-black/30 mb-4">
          Revenue and expenses for the last 6 months. Estimates are fine.
        </p>

        <div className="space-y-3">
          {months.map((m, i) => (
            <div key={i} className="border border-black/[0.08] p-4">
              <p className="text-[13px] font-medium text-black/50 mb-3">{m.label}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-black/35 mb-1">Revenue</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-black/25">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={m.revenue || ""}
                      onChange={(e) => updateMonth(i, "revenue", e.target.value)}
                      placeholder="0"
                      className="w-full border border-black/[0.06] pl-7 pr-3 py-2.5 text-[15px] text-black focus:outline-none focus:border-black/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-black/35 mb-1">Expenses</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-black/25">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={m.expenses || ""}
                      onChange={(e) => updateMonth(i, "expenses", e.target.value)}
                      placeholder="0"
                      className="w-full border border-black/[0.06] pl-7 pr-3 py-2.5 text-[15px] text-black focus:outline-none focus:border-black/20"
                    />
                  </div>
                </div>
              </div>
              {/* Net for this month */}
              {(m.revenue > 0 || m.expenses > 0) && (
                <p className="mt-2 text-[11px] text-black/30 text-right">
                  Net: {m.revenue - m.expenses >= 0 ? "+" : ""}{fmt(m.revenue - m.expenses)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {hasData && (
        <>
          {/* Key metrics — 2x2 grid always works on mobile */}
          <div className="mt-10 grid grid-cols-2 gap-3">
            <div className="border border-black/[0.08] p-4">
              <p className="text-[11px] uppercase tracking-[0.1em] text-black/40">MRR</p>
              <p className="mt-1 text-[22px] font-medium tracking-[-0.01em] text-black">{fmt(mrr)}</p>
            </div>
            <div className="border border-black/[0.08] p-4">
              <p className="text-[11px] uppercase tracking-[0.1em] text-black/40">ARR</p>
              <p className="mt-1 text-[22px] font-medium tracking-[-0.01em] text-black">{fmt(arr)}</p>
            </div>
            <div className="border border-black/[0.08] p-4">
              <p className="text-[11px] uppercase tracking-[0.1em] text-black/40">Net Burn</p>
              <p className="mt-1 text-[22px] font-medium tracking-[-0.01em] text-black">
                {fmt(burnRate)}
                <span className="text-[13px] text-black/40">/mo</span>
              </p>
            </div>
            <div className="border border-black/[0.08] p-4">
              <p className="text-[11px] uppercase tracking-[0.1em] text-black/40">Runway</p>
              <p className="mt-1 text-[22px] font-medium tracking-[-0.01em] text-black">
                {runway >= 999 ? "\u221E" : `${runway} mo`}
              </p>
            </div>
          </div>

          {/* Advice */}
          <div className="mt-4 border border-black/[0.08] p-5">
            <p className="text-[15px] font-medium text-black">{advice.headline}</p>
            <p className="mt-2 text-[14px] leading-[1.7] text-black/50">{advice.detail}</p>
          </div>

          {/* Bar chart */}
          <div className="mt-8">
            <div className="flex items-end gap-2 h-28">
              {months.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex gap-0.5 items-end h-20">
                    <div
                      className="flex-1 bg-black transition-all duration-300 min-w-0"
                      style={{ height: `${Math.max(1, (m.revenue / maxVal) * 80)}px` }}
                    />
                    <div
                      className="flex-1 bg-black/20 transition-all duration-300 min-w-0"
                      style={{ height: `${Math.max(1, (m.expenses / maxVal) * 80)}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-black/40 truncate w-full text-center">
                    {m.label.split(" ")[0].slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-black" />
                <span className="text-[11px] text-black/40">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-black/20" />
                <span className="text-[11px] text-black/40">Expenses</span>
              </div>
              {netPerMonth !== 0 && (
                <span className="text-[11px] text-black/30 sm:ml-auto">
                  Avg net: {netPerMonth >= 0 ? "+" : ""}{fmt(netPerMonth)}/mo
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Quick guide */}
      <div className="mt-12 border-t border-black/[0.06] pt-8 pb-8">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.1em] text-black/30">
          Quick guide
        </h2>
        <div className="mt-5 space-y-5">
          <div>
            <p className="text-[14px] font-medium text-black">What is runway?</p>
            <p className="mt-1 text-[13px] leading-[1.7] text-black/45">
              How many months until your bank account hits zero. Cash in bank divided by
              monthly net burn. This is the number every investor will ask you.
            </p>
          </div>
          <div>
            <p className="text-[14px] font-medium text-black">What is burn rate?</p>
            <p className="mt-1 text-[13px] leading-[1.7] text-black/45">
              How much more you spend than you earn each month. If you make $5K and
              spend $15K, your burn rate is $10K/month.
            </p>
          </div>
          <div>
            <p className="text-[14px] font-medium text-black">How much runway do I need?</p>
            <p className="mt-1 text-[13px] leading-[1.7] text-black/45">
              18+ months is ideal. 12 months is the minimum before you should start
              fundraising. Below 6 months, you&apos;re in the danger zone.
            </p>
          </div>
          <div>
            <p className="text-[14px] font-medium text-black">MRR vs ARR</p>
            <p className="mt-1 text-[13px] leading-[1.7] text-black/45">
              MRR is your Monthly Recurring Revenue — what came in last month.
              ARR is that times 12. Investors use ARR to compare you to other
              companies. Hit $1M ARR and you&apos;re in a different conversation.
            </p>
          </div>
          <div>
            <p className="text-[14px] font-medium text-black">Tips</p>
            <div className="mt-2 space-y-2">
              <p className="text-[13px] leading-[1.7] text-black/45 pl-4 border-l-2 border-black/[0.06]">
                Check this monthly. Set a calendar reminder.
              </p>
              <p className="text-[13px] leading-[1.7] text-black/45 pl-4 border-l-2 border-black/[0.06]">
                Include all expenses — SaaS, contractors, rent, your salary.
              </p>
              <p className="text-[13px] leading-[1.7] text-black/45 pl-4 border-l-2 border-black/[0.06]">
                Revenue means money received, not invoices sent.
              </p>
              <p className="text-[13px] leading-[1.7] text-black/45 pl-4 border-l-2 border-black/[0.06]">
                If your runway drops below 6 months, that&apos;s your only priority.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
