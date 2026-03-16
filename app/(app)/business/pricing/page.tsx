"use client";

import { useState, useEffect } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

type Tier = {
  id: string;
  name: string;
  price: number;
  billing: "monthly" | "annual";
  features: string[];
  highlighted: boolean;
};

type SimRow = { tierId: string; customers: number };

const STORAGE_KEY = "1pos-pricing-strategy";

function uid() { return Math.random().toString(36).slice(2, 10); }

const STARTER_TIERS: Tier[] = [
  { id: "free", name: "Free", price: 0, billing: "monthly", features: ["Basic features", "1 project", "Community support"], highlighted: false },
  { id: "pro", name: "Pro", price: 29, billing: "monthly", features: ["Everything in Free", "Unlimited projects", "Priority support", "API access"], highlighted: true },
  { id: "team", name: "Team", price: 79, billing: "monthly", features: ["Everything in Pro", "5 team members", "Admin controls", "SSO", "Dedicated support"], highlighted: false },
];

export default function Page() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [simRows, setSimRows] = useState<SimRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [featureDraft, setFeatureDraft] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTiers(data.tiers || []);
        setSimRows(data.simRows || []);
      } catch { /* ignore */ }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ tiers, simRows }));
  }, [tiers, simRows, loaded]);

  function addTier() {
    setEditingTier({ id: uid(), name: "", price: 0, billing: "monthly", features: [], highlighted: false });
    setFeatureDraft("");
  }

  function loadStarter() {
    setTiers(STARTER_TIERS);
    setSimRows(STARTER_TIERS.map((t) => ({ tierId: t.id, customers: 0 })));
  }

  function saveTier() {
    if (!editingTier) return;
    setTiers((prev) => {
      const exists = prev.find((t) => t.id === editingTier.id);
      if (exists) return prev.map((t) => (t.id === editingTier.id ? editingTier : t));
      return [...prev, editingTier];
    });
    setSimRows((prev) => {
      if (!prev.find((r) => r.tierId === editingTier.id)) return [...prev, { tierId: editingTier.id, customers: 0 }];
      return prev;
    });
    setEditingTier(null);
  }

  function removeTier(id: string) {
    setTiers((prev) => prev.filter((t) => t.id !== id));
    setSimRows((prev) => prev.filter((r) => r.tierId !== id));
  }

  function monthlyPrice(tier: Tier) {
    return tier.billing === "annual" ? tier.price / 12 : tier.price;
  }

  const totalMRR = tiers.reduce((sum, t) => {
    const row = simRows.find((r) => r.tierId === t.id);
    return sum + monthlyPrice(t) * (row?.customers ?? 0);
  }, 0);

  const totalCustomers = simRows.reduce((s, r) => s + r.customers, 0);

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <Education {...EDUCATION.pricing} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Pricing Strategy</h1>
          <p className="mt-1 text-sm text-zinc-500">Define your pricing tiers and simulate revenue.</p>
        </div>
        <div className="flex gap-2">
          {tiers.length === 0 && (
            <button onClick={loadStarter} className="text-[12px] px-3 py-1.5 border border-zinc-200 text-zinc-600 hover:bg-zinc-50">
              Load Example
            </button>
          )}
          <button onClick={addTier} className="text-[12px] px-3 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800">
            Add Tier
          </button>
        </div>
      </div>

      {/* Edit modal */}
      {editingTier && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-md shadow-xl border border-zinc-200">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">
              {tiers.find((t) => t.id === editingTier.id) ? "Edit" : "New"} Tier
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Name</label>
                <input type="text" value={editingTier.name} onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                  className="w-full text-sm border border-zinc-200 px-2 py-1.5 text-zinc-900 focus:outline-none focus:border-zinc-400" placeholder="e.g. Pro, Team, Enterprise" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-zinc-500 mb-1">Price ($)</label>
                  <input type="number" min={0} value={editingTier.price} onChange={(e) => setEditingTier({ ...editingTier, price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm border border-zinc-200 px-2 py-1.5 text-zinc-900 focus:outline-none focus:border-zinc-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-zinc-500 mb-1">Billing</label>
                  <select value={editingTier.billing} onChange={(e) => setEditingTier({ ...editingTier, billing: e.target.value as "monthly" | "annual" })}
                    className="w-full text-sm border border-zinc-200 px-2 py-1.5 text-zinc-900 focus:outline-none focus:border-zinc-400">
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-[12px] text-zinc-600 cursor-pointer">
                <input type="checkbox" checked={editingTier.highlighted} onChange={(e) => setEditingTier({ ...editingTier, highlighted: e.target.checked })} className="accent-zinc-900" />
                Highlight as recommended
              </label>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Features</label>
                <ul className="space-y-1 mb-2">
                  {editingTier.features.map((f, i) => (
                    <li key={i} className="text-[12px] text-zinc-700 flex items-center gap-1 group">
                      <span className="flex-1">{f}</span>
                      <button onClick={() => setEditingTier({ ...editingTier, features: editingTier.features.filter((_, fi) => fi !== i) })}
                        className="text-zinc-300 hover:text-zinc-600 text-[10px]">x</button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-1">
                  <input type="text" value={featureDraft} onChange={(e) => setFeatureDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && featureDraft.trim()) { setEditingTier({ ...editingTier, features: [...editingTier.features, featureDraft.trim()] }); setFeatureDraft(""); } }}
                    placeholder="Add feature..." className="flex-1 text-[12px] border border-zinc-200 px-2 py-1 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditingTier(null)} className="text-[12px] px-3 py-1.5 border border-zinc-200 text-zinc-600 hover:bg-zinc-50">Cancel</button>
              <button onClick={saveTier} className="text-[12px] px-3 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing cards */}
      {tiers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-zinc-200 mb-8">
            {tiers.map((t) => (
              <div key={t.id} className={`p-5 border-r last:border-r-0 border-zinc-200 ${t.highlighted ? "bg-zinc-50 border-t-2 border-t-zinc-900" : "bg-white"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-[14px] font-semibold text-zinc-900">{t.name || "Untitled"}</h3>
                    {t.highlighted && <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Recommended</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingTier(t); setFeatureDraft(""); }} className="text-[11px] text-zinc-400 hover:text-zinc-700">Edit</button>
                    <button onClick={() => removeTier(t.id)} className="text-[11px] text-zinc-400 hover:text-zinc-700">Del</button>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-zinc-900">${t.price}</span>
                  <span className="text-[12px] text-zinc-400">/{t.billing === "annual" ? "yr" : "mo"}</span>
                  {t.billing === "annual" && <p className="text-[11px] text-zinc-400">${(t.price / 12).toFixed(0)}/mo billed annually</p>}
                </div>
                <ul className="space-y-1.5">
                  {t.features.map((f, i) => (
                    <li key={i} className="text-[12px] text-zinc-600 flex items-start gap-2">
                      <span className="text-zinc-400 mt-0.5 shrink-0">-</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Revenue Simulator */}
          <div className="border border-zinc-200 bg-white p-5">
            <h2 className="text-[13px] font-semibold text-zinc-900 mb-4">Revenue Simulator</h2>
            <div className="space-y-3 mb-4">
              {tiers.map((t) => {
                const row = simRows.find((r) => r.tierId === t.id);
                const customers = row?.customers ?? 0;
                const mrr = monthlyPrice(t) * customers;
                return (
                  <div key={t.id} className="flex items-center gap-4">
                    <span className="text-[13px] text-zinc-700 w-28 truncate font-medium">{t.name || "Untitled"}</span>
                    <span className="text-[11px] text-zinc-400 w-16">${monthlyPrice(t).toFixed(0)}/mo</span>
                    <span className="text-[11px] text-zinc-400">x</span>
                    <input
                      type="number" min={0} value={customers}
                      onChange={(e) => setSimRows((prev) => prev.map((r) => r.tierId === t.id ? { ...r, customers: parseInt(e.target.value) || 0 } : r))}
                      className="w-20 text-[13px] border border-zinc-200 px-2 py-1 text-zinc-900 focus:outline-none focus:border-zinc-400 text-center"
                    />
                    <span className="text-[12px] text-zinc-500">=</span>
                    <span className="text-[13px] font-mono text-zinc-900 ml-auto">${mrr.toLocaleString()}/mo</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-zinc-200 pt-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] text-zinc-400">{totalCustomers} total customers</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-zinc-400">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold font-mono text-zinc-900">${totalMRR.toLocaleString()}</p>
                <p className="text-[11px] text-zinc-400">ARR: ${(totalMRR * 12).toLocaleString()}/yr</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 border border-dashed border-zinc-200">
          <p className="text-[13px] text-zinc-400 mb-3">No pricing tiers yet</p>
          <div className="flex justify-center gap-2">
            <button onClick={loadStarter} className="text-[12px] px-3 py-1.5 border border-zinc-200 text-zinc-600 hover:bg-zinc-50">Load Example (Free / Pro / Team)</button>
            <button onClick={addTier} className="text-[12px] px-3 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800">Start From Scratch</button>
          </div>
        </div>
      )}
    </div>
  );
}
