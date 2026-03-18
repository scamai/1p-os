"use client";

import * as React from "react";

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function DilutionSimulator() {
  const [cap, setCap] = React.useState(5_000_000);
  const [investment, setInvestment] = React.useState(500_000);
  const [seriesA, setSeriesA] = React.useState(15_000_000);
  const [optionPool, setOptionPool] = React.useState(10);

  // SAFE conversion math
  const safeShares = investment / (cap / 10_000_000); // shares at cap price
  const pricePerShare = seriesA / 10_000_000;
  const safeConvertedShares = investment / (cap / 10_000_000);
  const totalPreMoney = 10_000_000 + safeConvertedShares;
  const optionPoolShares = totalPreMoney * (optionPool / 100);
  const seriesAShares = (investment * 10_000_000) / seriesA; // new Series A investor
  const totalFullyDiluted = totalPreMoney + optionPoolShares + seriesAShares;

  const founderPct = (10_000_000 / totalFullyDiluted) * 100;
  const safePct = (safeConvertedShares / totalFullyDiluted) * 100;
  const poolPct = (optionPoolShares / totalFullyDiluted) * 100;
  const seriesAPct = (seriesAShares / totalFullyDiluted) * 100;

  const sliders = [
    { label: "Valuation cap", value: cap, setValue: setCap, min: 1_000_000, max: 20_000_000, step: 500_000, format: formatMoney },
    { label: "SAFE investment", value: investment, setValue: setInvestment, min: 50_000, max: 2_000_000, step: 50_000, format: formatMoney },
    { label: "Series A valuation", value: seriesA, setValue: setSeriesA, min: 5_000_000, max: 50_000_000, step: 1_000_000, format: formatMoney },
    { label: "Option pool", value: optionPool, setValue: setOptionPool, min: 5, max: 25, step: 1, format: (n: number) => `${n}%` },
  ];

  const rows = [
    { label: "Founders", pct: founderPct, shade: "bg-slate-900" },
    { label: "SAFE investors", pct: safePct, shade: "bg-slate-600" },
    { label: "Option pool", pct: poolPct, shade: "bg-slate-400" },
    { label: "Series A", pct: seriesAPct, shade: "bg-slate-300" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">SAFE dilution simulator</h3>
        <p className="mt-1 text-[13px] text-slate-500">
          See how a SAFE converts at different Series A valuations.
        </p>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sliders.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {s.label}
              </label>
              <span className="text-sm font-semibold tabular-nums text-slate-900">
                {s.format(s.value)}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={s.value}
              onChange={(e) => s.setValue(Number(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>
        ))}
      </div>

      {/* Ownership bar */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Post-Series A ownership
        </p>
        <div className="flex h-10 w-full overflow-hidden border border-slate-200">
          {rows.map((r) => (
            <div
              key={r.label}
              className={`flex items-center justify-center text-[11px] font-medium text-white transition-all duration-300 ${r.shade}`}
              style={{ width: `${r.pct}%` }}
            >
              {r.pct >= 8 && formatPct(r.pct)}
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown table */}
      <div className="border border-slate-200">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 ${r.shade}`} />
              <span className="text-sm text-slate-700">{r.label}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-slate-900">
              {formatPct(r.pct)}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400">
        Assumes 10M authorized shares, standard YC SAFE (post-money cap), and a single
        Series A round at the specified valuation.
      </p>
    </div>
  );
}
