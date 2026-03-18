"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";

interface Founder {
  name: string;
  idea: number;
  code: number;
  capital: number;
  domain: number;
  fulltime: number;
}

const FACTORS = [
  { key: "idea", label: "Idea / vision", description: "Originated the concept" },
  { key: "code", label: "Technical execution", description: "Building the product" },
  { key: "capital", label: "Capital contributed", description: "Personal money invested" },
  { key: "domain", label: "Domain expertise", description: "Industry knowledge, network" },
  { key: "fulltime", label: "Full-time commitment", description: "Working on this full-time" },
] as const;

function defaultFounder(name: string): Founder {
  return { name, idea: 0, code: 0, capital: 0, domain: 0, fulltime: 0 };
}

function totalScore(f: Founder): number {
  return f.idea + f.code + f.capital + f.domain + f.fulltime;
}

export function EquityCalculator() {
  const [founders, setFounders] = React.useState<Founder[]>([
    defaultFounder("Founder 1"),
    defaultFounder("Founder 2"),
  ]);

  const grandTotal = founders.reduce((sum, f) => sum + totalScore(f), 0);

  function updateFounder(index: number, field: keyof Founder, value: number | string) {
    setFounders((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
  }

  function addFounder() {
    setFounders((prev) => [...prev, defaultFounder(`Founder ${prev.length + 1}`)]);
  }

  function removeFounder(index: number) {
    if (founders.length <= 2) return;
    setFounders((prev) => prev.filter((_, i) => i !== index));
  }

  function getPercentage(f: Founder): number {
    if (grandTotal === 0) return Math.round(100 / founders.length);
    return Math.round((totalScore(f) / grandTotal) * 100);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Co-founder equity calculator</h3>
        <p className="mt-1 text-[13px] text-slate-500">
          Rate each founder&apos;s contribution on a scale of 0-10 for each factor.
        </p>
      </div>

      {/* Factor headers */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Founder
              </th>
              {FACTORS.map((f) => (
                <th
                  key={f.key}
                  className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500"
                  title={f.description}
                >
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-900">
                Equity %
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {founders.map((founder, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={founder.name}
                    onChange={(e) => updateFounder(i, "name", e.target.value)}
                    className="w-full border-0 bg-transparent text-sm font-medium text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1"
                  />
                </td>
                {FACTORS.map((f) => (
                  <td key={f.key} className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={founder[f.key as keyof Omit<Founder, "name">]}
                      onChange={(e) =>
                        updateFounder(
                          i,
                          f.key as keyof Founder,
                          Math.min(10, Math.max(0, parseInt(e.target.value) || 0))
                        )
                      }
                      className="h-8 w-12 border border-slate-200 bg-transparent px-2 text-center text-sm tabular-nums text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1"
                    />
                  </td>
                ))}
                <td className="px-3 py-2 text-center">
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {getPercentage(founder)}%
                  </span>
                </td>
                <td className="px-1 py-2">
                  {founders.length > 2 && (
                    <button
                      onClick={() => removeFounder(i)}
                      className="flex h-6 w-6 items-center justify-center text-slate-400 transition-colors hover:text-slate-700"
                      aria-label="Remove founder"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={addFounder}>
          Add founder
        </Button>
      </div>

      {/* Visual split */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Recommended split
        </p>
        <div className="flex h-8 w-full overflow-hidden border border-slate-200">
          {founders.map((f, i) => {
            const pct = getPercentage(f);
            if (pct === 0) return null;
            const shades = ["bg-slate-900", "bg-slate-600", "bg-slate-400", "bg-slate-300"];
            return (
              <div
                key={i}
                className={`flex items-center justify-center text-[11px] font-medium text-white transition-all duration-300 ${shades[i % shades.length]}`}
                style={{ width: `${pct}%` }}
                title={`${f.name}: ${pct}%`}
              >
                {pct >= 10 && `${pct}%`}
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex gap-4">
          {founders.map((f, i) => (
            <span key={i} className="text-[11px] text-slate-500">
              {f.name}: {getPercentage(f)}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
