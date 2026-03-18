"use client";

import { useState } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";
import { useTableData } from "@/lib/hooks/useTableData";

type Tier = {
  id: string;
  name: string;
  price: number;
  billing: "monthly" | "annual";
  features: string[];
  sort_order: number;
};

type SimRow = { tierId: string; customers: number };

const STARTER_TIERS: Omit<Tier, "id">[] = [
  { name: "Free", price: 0, billing: "monthly", features: ["Basic features", "1 project", "Community support"], sort_order: 0 },
  { name: "Pro", price: 29, billing: "monthly", features: ["Everything in Free", "Unlimited projects", "Priority support", "API access"], sort_order: 1 },
  { name: "Team", price: 79, billing: "monthly", features: ["Everything in Pro", "5 team members", "Admin controls", "SSO", "Dedicated support"], sort_order: 2 },
];

export default function Page() {
  const { data: tiers, loading, create, update, remove } = useTableData<Tier>(
    "pricing_tiers",
    { orderBy: "sort_order", ascending: true }
  );
  const [simRows, setSimRows] = useState<SimRow[]>([]);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [featureDraft, setFeatureDraft] = useState("");

  // Keep simRows in sync when tiers load/change
  // simRows is local-only (revenue simulator is ephemeral)

  function addTier() {
    setEditingTier({ id: "", name: "", price: 0, billing: "monthly", features: [], sort_order: tiers.length });
    setFeatureDraft("");
  }

  async function loadStarter() {
    for (const t of STARTER_TIERS) {
      const created = await create(t);
      if (created) {
        setSimRows((prev) => [...prev, { tierId: created.id, customers: 0 }]);
      }
    }
  }

  async function saveTier() {
    if (!editingTier) return;
    if (editingTier.id && tiers.find((t) => t.id === editingTier.id)) {
      // Update existing
      const { id, ...updates } = editingTier;
      await update(id, updates);
    } else {
      // Create new
      const { id, ...rest } = editingTier;
      const created = await create(rest);
      if (created) {
        setSimRows((prev) => [...prev, { tierId: created.id, customers: 0 }]);
      }
    }
    setEditingTier(null);
  }

  async function removeTier(id: string) {
    await remove(id);
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

  if (loading) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <Education {...EDUCATION.pricing} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Pricing Strategy</h1>
          <p className="mt-1 text-sm text-slate-500">Define your pricing tiers and simulate revenue.</p>
        </div>
        <div className="flex gap-2">
          {tiers.length === 0 && (
            <button onClick={loadStarter} className="text-[12px] px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50">
              Load Example
            </button>
          )}
          <button onClick={addTier} className="text-[12px] px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800">
            Add Tier
          </button>
        </div>
      </div>

      {/* Edit modal */}
      {editingTier && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-md shadow-xl border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              {editingTier.id && tiers.find((t) => t.id === editingTier.id) ? "Edit" : "New"} Tier
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Name</label>
                <input type="text" value={editingTier.name} onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                  className="w-full text-sm border border-slate-200 px-2 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400" placeholder="e.g. Pro, Team, Enterprise" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-slate-500 mb-1">Price ($)</label>
                  <input type="number" min={0} value={editingTier.price} onChange={(e) => setEditingTier({ ...editingTier, price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm border border-slate-200 px-2 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-slate-500 mb-1">Billing</label>
                  <select value={editingTier.billing} onChange={(e) => setEditingTier({ ...editingTier, billing: e.target.value as "monthly" | "annual" })}
                    className="w-full text-sm border border-slate-200 px-2 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400">
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Features</label>
                <ul className="space-y-1 mb-2">
                  {editingTier.features.map((f, i) => (
                    <li key={i} className="text-[12px] text-slate-700 flex items-center gap-1 group">
                      <span className="flex-1">{f}</span>
                      <button onClick={() => setEditingTier({ ...editingTier, features: editingTier.features.filter((_, fi) => fi !== i) })}
                        className="text-slate-300 hover:text-slate-600 text-[10px]">x</button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-1">
                  <input type="text" value={featureDraft} onChange={(e) => setFeatureDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && featureDraft.trim()) { setEditingTier({ ...editingTier, features: [...editingTier.features, featureDraft.trim()] }); setFeatureDraft(""); } }}
                    placeholder="Add feature..." className="flex-1 text-[12px] border border-slate-200 px-2 py-1 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditingTier(null)} className="text-[12px] px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={saveTier} className="text-[12px] px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing cards */}
      {tiers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-slate-200 mb-8">
            {tiers.map((t) => (
              <div key={t.id} className={`p-5 border-r last:border-r-0 border-slate-200 bg-white`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-[14px] font-semibold text-slate-900">{t.name || "Untitled"}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingTier(t); setFeatureDraft(""); }} className="text-[11px] text-slate-400 hover:text-slate-700">Edit</button>
                    <button onClick={() => removeTier(t.id)} className="text-[11px] text-slate-400 hover:text-slate-700">Del</button>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-slate-900">${t.price}</span>
                  <span className="text-[12px] text-slate-400">/{t.billing === "annual" ? "yr" : "mo"}</span>
                  {t.billing === "annual" && <p className="text-[11px] text-slate-400">${(t.price / 12).toFixed(0)}/mo billed annually</p>}
                </div>
                <ul className="space-y-1.5">
                  {t.features.map((f, i) => (
                    <li key={i} className="text-[12px] text-slate-600 flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5 shrink-0">-</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Revenue Simulator */}
          <div className="border border-slate-200 bg-white p-5">
            <h2 className="text-[13px] font-semibold text-slate-900 mb-4">Revenue Simulator</h2>
            <div className="space-y-3 mb-4">
              {tiers.map((t) => {
                const row = simRows.find((r) => r.tierId === t.id);
                const customers = row?.customers ?? 0;
                const mrr = monthlyPrice(t) * customers;
                return (
                  <div key={t.id} className="flex items-center gap-4">
                    <span className="text-[13px] text-slate-700 w-28 truncate font-medium">{t.name || "Untitled"}</span>
                    <span className="text-[11px] text-slate-400 w-16">${monthlyPrice(t).toFixed(0)}/mo</span>
                    <span className="text-[11px] text-slate-400">x</span>
                    <input
                      type="number" min={0} value={customers}
                      onChange={(e) => setSimRows((prev) => {
                        const exists = prev.find((r) => r.tierId === t.id);
                        if (exists) return prev.map((r) => r.tierId === t.id ? { ...r, customers: parseInt(e.target.value) || 0 } : r);
                        return [...prev, { tierId: t.id, customers: parseInt(e.target.value) || 0 }];
                      })}
                      className="w-20 text-[13px] border border-slate-200 px-2 py-1 text-slate-900 focus:outline-none focus:border-slate-400 text-center"
                    />
                    <span className="text-[12px] text-slate-500">=</span>
                    <span className="text-[13px] font-mono text-slate-900 ml-auto">${mrr.toLocaleString()}/mo</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-200 pt-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] text-slate-400">{totalCustomers} total customers</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold font-mono text-slate-900">${totalMRR.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400">ARR: ${(totalMRR * 12).toLocaleString()}/yr</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 border border-dashed border-slate-200">
          <p className="text-[13px] text-slate-400 mb-3">No pricing tiers yet</p>
          <div className="flex justify-center gap-2">
            <button onClick={loadStarter} className="text-[12px] px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50">Load Example (Free / Pro / Team)</button>
            <button onClick={addTier} className="text-[12px] px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800">Start From Scratch</button>
          </div>
        </div>
      )}
    </div>
  );
}
