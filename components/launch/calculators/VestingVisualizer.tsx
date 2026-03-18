"use client";

import * as React from "react";

export function VestingVisualizer() {
  const [totalShares, setTotalShares] = React.useState(2_500_000);
  const [vestingYears, setVestingYears] = React.useState(4);
  const [cliffMonths, setCliffMonths] = React.useState(12);

  const totalMonths = vestingYears * 12;
  const monthlyVest = totalShares / totalMonths;
  const cliffShares = monthlyVest * cliffMonths;

  // Generate vesting schedule data
  const schedule = React.useMemo(() => {
    const points: { month: number; vested: number; label: string }[] = [];
    for (let m = 0; m <= totalMonths; m++) {
      let vested = 0;
      if (m >= cliffMonths) {
        vested = Math.round(monthlyVest * m);
      }
      if (m === 0 || m === cliffMonths || m === totalMonths || m % 12 === 0) {
        points.push({
          month: m,
          vested: Math.min(vested, totalShares),
          label: m === 0 ? "Start" : m === cliffMonths ? "Cliff" : `Year ${m / 12}`,
        });
      }
    }
    return points;
  }, [totalShares, totalMonths, cliffMonths, monthlyVest]);

  function formatShares(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-black">Vesting schedule builder</h3>
        <p className="mt-1 text-[13px] text-black/50">
          Standard: 4-year vesting with 1-year cliff, monthly thereafter.
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-black/50">
            Total shares
          </label>
          <input
            type="number"
            value={totalShares}
            onChange={(e) => setTotalShares(Math.max(1000, parseInt(e.target.value) || 0))}
            className="h-9 w-full border border-black/[0.08] bg-transparent px-3 text-sm tabular-nums text-black outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-black/50">
            Vesting period (years)
          </label>
          <select
            value={vestingYears}
            onChange={(e) => setVestingYears(parseInt(e.target.value))}
            className="h-9 w-full border border-black/[0.08] bg-transparent px-3 text-sm text-black outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
          >
            <option value={3}>3 years</option>
            <option value={4}>4 years</option>
            <option value={5}>5 years</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-black/50">
            Cliff (months)
          </label>
          <select
            value={cliffMonths}
            onChange={(e) => setCliffMonths(parseInt(e.target.value))}
            className="h-9 w-full border border-black/[0.08] bg-transparent px-3 text-sm text-black outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
          >
            <option value={0}>No cliff</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
            <option value={18}>18 months</option>
          </select>
        </div>
      </div>

      {/* Visual timeline */}
      <div className="border border-black/[0.08] p-4">
        <div className="flex items-end gap-1" style={{ height: 120 }}>
          {schedule.map((point, i) => {
            const height = totalShares > 0 ? (point.vested / totalShares) * 100 : 0;
            return (
              <div
                key={i}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="text-[10px] tabular-nums text-black/50">
                  {formatShares(point.vested)}
                </span>
                <div
                  className="w-full bg-black transition-all duration-300"
                  style={{ height: `${Math.max(2, height)}%` }}
                />
                <span className="text-[10px] text-black/40">{point.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key facts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "At cliff", value: formatShares(Math.round(cliffShares)) },
          { label: "Monthly vest", value: formatShares(Math.round(monthlyVest)) },
          { label: "Fully vested", value: `${vestingYears} years` },
          { label: "Total shares", value: formatShares(totalShares) },
        ].map((stat) => (
          <div key={stat.label} className="border border-black/[0.08] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-black/50">
              {stat.label}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-black">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
