"use client";

import * as React from "react";

function formatMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function TAMCalculator() {
  const [totalCustomers, setTotalCustomers] = React.useState(10_000_000);
  const [avgRevenue, setAvgRevenue] = React.useState(1_200);
  const [reachablePct, setReachablePct] = React.useState(15);
  const [capturePct, setCapturePct] = React.useState(3);

  const tam = totalCustomers * avgRevenue;
  const sam = tam * (reachablePct / 100);
  const som = sam * (capturePct / 100);

  const tiers = [
    {
      label: "TAM",
      full: "Total Addressable Market",
      description: "Everyone who could theoretically buy your product",
      value: tam,
      width: 100,
    },
    {
      label: "SAM",
      full: "Serviceable Addressable Market",
      description: "The segment you can actually reach with your product and channels",
      value: sam,
      width: (reachablePct / 100) * 100,
    },
    {
      label: "SOM",
      full: "Serviceable Obtainable Market",
      description: "What you can realistically capture in the next 2-3 years",
      value: som,
      width: (capturePct / 100) * (reachablePct / 100) * 100,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-black">TAM / SAM / SOM calculator</h3>
        <p className="mt-1 text-[13px] text-black/50">
          Size your market. Investors expect these numbers in your pitch deck.
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-black/50">
            Total potential customers
          </label>
          <input
            type="number"
            value={totalCustomers}
            onChange={(e) => setTotalCustomers(Math.max(0, parseInt(e.target.value) || 0))}
            className="h-9 w-full border border-black/[0.08] bg-transparent px-3 text-sm tabular-nums text-black outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-black/50">
            Avg. annual revenue per customer
          </label>
          <input
            type="number"
            value={avgRevenue}
            onChange={(e) => setAvgRevenue(Math.max(0, parseInt(e.target.value) || 0))}
            className="h-9 w-full border border-black/[0.08] bg-transparent px-3 text-sm tabular-nums text-black outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-black/50">
            Reachable segment (SAM %)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={100}
              value={reachablePct}
              onChange={(e) => setReachablePct(parseInt(e.target.value))}
              className="flex-1 accent-black"
            />
            <span className="w-12 text-right text-sm font-semibold tabular-nums text-black">
              {reachablePct}%
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-black/50">
            Realistic capture (SOM %)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={50}
              value={capturePct}
              onChange={(e) => setCapturePct(parseInt(e.target.value))}
              className="flex-1 accent-black"
            />
            <span className="w-12 text-right text-sm font-semibold tabular-nums text-black">
              {capturePct}%
            </span>
          </div>
        </div>
      </div>

      {/* Concentric visualization */}
      <div className="space-y-2">
        {tiers.map((tier) => (
          <div key={tier.label}>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-black">{tier.label}</span>
                <span className="text-[11px] text-black/40">{tier.full}</span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-black">
                {formatMoney(tier.value)}
              </span>
            </div>
            <div className="h-6 w-full border border-black/[0.08]">
              <div
                className="h-full bg-black transition-all duration-300"
                style={{ width: `${Math.max(1, tier.width)}%`, opacity: tier.label === "TAM" ? 0.2 : tier.label === "SAM" ? 0.5 : 1 }}
              />
            </div>
            <p className="mt-0.5 text-[11px] text-black/40">{tier.description}</p>
          </div>
        ))}
      </div>

      {/* Pitch-ready summary */}
      <div className="border border-black/[0.08] p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-black/50 mb-2">
          Pitch-ready summary
        </p>
        <p className="text-sm text-black/70">
          The total addressable market is {formatMoney(tam)}, with a serviceable market
          of {formatMoney(sam)}. We are targeting {formatMoney(som)} in the first 2-3
          years, representing {capturePct}% of our reachable segment.
        </p>
      </div>
    </div>
  );
}
