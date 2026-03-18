"use client";

import { useState } from "react";
import { useTableData } from "@/lib/hooks/useTableData";
import { Education, EDUCATION } from "@/components/shared/Education";

type SafeStatus = "signed" | "pending";

type Safe = {
  id: string;
  investor_name: string;
  amount: number;
  valuation_cap: number;
  discount_pct: number;
  date: string;
  status: SafeStatus;
};

export default function Page() {
  const { data: safes, loading, create, update, remove } = useTableData<Safe>("safes");
  const [editing, setEditing] = useState<Safe | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [totalShares, setTotalShares] = useState(10000000);

  async function save() {
    if (!editing) return;
    if (isNew) {
      const { id: _id, ...rest } = editing;
      await create(rest);
    } else {
      const { id: _id, ...rest } = editing;
      await update(editing.id, rest);
    }
    setEditing(null);
    setIsNew(false);
  }

  async function handleRemove(id: string) {
    await remove(id);
  }

  function startNew() {
    setEditing({ id: "", investor_name: "", amount: 0, valuation_cap: 0, discount_pct: 0, date: "", status: "pending" });
    setIsNew(true);
  }

  const totalOutstanding = safes
    .filter((s) => s.status === "signed")
    .reduce((sum, s) => sum + s.amount, 0);

  const totalAll = safes.reduce((sum, s) => sum + s.amount, 0);

  function capTableRows() {
    const rows: { name: string; shares: number; pct: number }[] = [];
    let totalNewShares = 0;

    for (const s of safes.filter((s) => s.status === "signed")) {
      if (s.valuation_cap > 0) {
        const pricePerShare = s.valuation_cap / totalShares;
        const newShares = s.amount / pricePerShare;
        totalNewShares += newShares;
        rows.push({ name: s.investor_name, shares: newShares, pct: 0 });
      }
    }

    const grandTotal = totalShares + totalNewShares;
    const founderPct = (totalShares / grandTotal) * 100;

    return {
      investors: rows.map((r) => ({ ...r, pct: (r.shares / grandTotal) * 100 })),
      founderPct,
      founderShares: totalShares,
      grandTotal,
    };
  }

  const capTable = capTableRows();

  if (loading) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <Education {...EDUCATION.safes} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">SAFEs</h1>
          <p className="mt-1 text-sm text-slate-500">Track SAFE agreements and estimate dilution.</p>
        </div>
        <button
          onClick={startNew}
          className="text-sm px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800"
        >
          Add SAFE
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-slate-200 rounded-lg p-3 bg-white text-center">
          <p className="text-xs text-slate-500 mb-1">Total SAFEs</p>
          <p className="text-xl font-bold text-slate-900">{safes.length}</p>
        </div>
        <div className="border border-slate-200 rounded-lg p-3 bg-white text-center">
          <p className="text-xs text-slate-500 mb-1">Total Outstanding (Signed)</p>
          <p className="text-xl font-bold text-slate-900">${totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="border border-slate-200 rounded-lg p-3 bg-white text-center">
          <p className="text-xs text-slate-500 mb-1">Total All</p>
          <p className="text-xl font-bold text-slate-900">${totalAll.toLocaleString()}</p>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              {isNew ? "New" : "Edit"} SAFE
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Investor Name</label>
                <input
                  type="text"
                  value={editing.investor_name}
                  onChange={(e) => setEditing({ ...editing, investor_name: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={editing.amount}
                    onChange={(e) => setEditing({ ...editing, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Valuation Cap ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={editing.valuation_cap}
                    onChange={(e) => setEditing({ ...editing, valuation_cap: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Discount %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editing.discount_pct}
                    onChange={(e) => setEditing({ ...editing, discount_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={editing.date}
                    onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as SafeStatus })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="pending">Pending</option>
                    <option value="signed">Signed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="text-sm px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={save} className="text-sm px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* SAFE list */}
      {safes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-lg mb-6">
          <p className="text-sm text-slate-400">No SAFEs yet. Add your first one.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Investor", "Amount", "Val. Cap", "Discount", "Date", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {safes.map((s, i) => (
                <tr key={s.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                  <td className="px-3 py-2 text-slate-900 font-medium">{s.investor_name || "Unnamed"}</td>
                  <td className="px-3 py-2 text-slate-700">${s.amount.toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-700">${s.valuation_cap.toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-700">{s.discount_pct}%</td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{s.date}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${s.status === "signed" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(s); setIsNew(false); }} className="text-xs text-slate-400 hover:text-slate-700">Edit</button>
                      <button onClick={() => handleRemove(s.id)} className="text-xs text-slate-400 hover:text-slate-700">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pro-forma Cap Table */}
      <div className="border border-slate-200 rounded-lg p-4 bg-white">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Pro-Forma Cap Table (Estimate)</h2>
        <div className="mb-3">
          <label className="block text-xs text-slate-500 mb-1">Founder Shares (pre-SAFE)</label>
          <input
            type="number"
            min={1}
            value={totalShares}
            onChange={(e) => setTotalShares(parseInt(e.target.value) || 1)}
            className="w-48 text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Holder</th>
              <th className="text-right px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Shares</th>
              <th className="text-right px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ownership</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="px-2 py-2 text-slate-900 font-medium">Founder(s)</td>
              <td className="px-2 py-2 text-slate-700 text-right">{capTable.founderShares.toLocaleString()}</td>
              <td className="px-2 py-2 text-slate-700 text-right">{capTable.founderPct.toFixed(2)}%</td>
            </tr>
            {capTable.investors.map((inv, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-2 py-2 text-slate-700">{inv.name}</td>
                <td className="px-2 py-2 text-slate-700 text-right">{Math.round(inv.shares).toLocaleString()}</td>
                <td className="px-2 py-2 text-slate-700 text-right">{inv.pct.toFixed(2)}%</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-medium">
              <td className="px-2 py-2 text-slate-900">Total</td>
              <td className="px-2 py-2 text-slate-900 text-right">{Math.round(capTable.grandTotal).toLocaleString()}</td>
              <td className="px-2 py-2 text-slate-900 text-right">100.00%</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[11px] text-slate-400 mt-2">
          This is a simplified estimate. Actual conversion depends on priced round terms. Does not account for discount conversion or option pool.
        </p>
      </div>
    </div>
  );
}
