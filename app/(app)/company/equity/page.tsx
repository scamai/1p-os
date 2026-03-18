"use client";

import { useState } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";
import { useTableData } from "@/lib/hooks/useTableData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Shareholder {
  id: string;
  name: string;
  type: "founder" | "investor" | "advisor" | "esop";
  shares: number;
  notes: string;
  price_per_share: number;
}

const SHAREHOLDER_TYPES = [
  { value: "founder", label: "Founder" },
  { value: "investor", label: "Investor" },
  { value: "advisor", label: "Advisor" },
  { value: "esop", label: "ESOP" },
] as const;

// ---------------------------------------------------------------------------
// Type badge styles
// ---------------------------------------------------------------------------

const TYPE_STYLES: Record<string, string> = {
  founder: "border-black/30 bg-black/[0.04] text-black/70",
  investor: "border-black/30 bg-black/[0.02] text-black/60",
  advisor: "border-black/[0.08] bg-white text-black/50",
  esop: "border-black/[0.08] bg-white text-black/40",
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function EquityPage() {
  const { data: shareholders, loading, create, update, remove } = useTableData<Shareholder>('shareholders');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<Shareholder["type"]>("founder");
  const [formShares, setFormShares] = useState("1000000");
  const [formNote, setFormNote] = useState("");

  // Dilution calculator
  const [raiseAmount, setRaiseAmount] = useState("");
  const [preMoneyVal, setPreMoneyVal] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormType("founder");
    setFormShares("1000000");
    setFormNote("");
    setEditing(null);
  };

  const openEdit = (s: Shareholder) => {
    setFormName(s.name);
    setFormType(s.type);
    setFormShares(String(s.shares));
    setFormNote(s.notes || "");
    setEditing(s.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fields = {
      name: formName.trim(),
      type: formType,
      shares: parseInt(formShares) || 0,
      notes: formNote.trim(),
    };

    if (editing) {
      await update(editing, fields);
    } else {
      await create(fields);
    }
    resetForm();
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
  };

  const totalShares = shareholders.reduce((s, sh) => s + sh.shares, 0);

  // Dilution calculation
  const raise = parseFloat(raiseAmount) || 0;
  const preMoney = parseFloat(preMoneyVal) || 0;
  const postMoney = preMoney + raise;
  const dilutionPercent = postMoney > 0 ? (raise / postMoney) * 100 : 0;
  const newInvestorShares =
    totalShares > 0 && preMoney > 0
      ? Math.round((raise / preMoney) * totalShares)
      : 0;
  const newTotalShares = totalShares + newInvestorShares;

  if (loading) return null;

  return (
    <div className="mx-auto max-w-[800px]">
      <Education {...EDUCATION.equity} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-black">
            Cap Table
          </h1>
          <p className="mt-1 text-sm text-black/50">
            Track shareholders, shares outstanding, and model dilution.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="h-8 rounded-md bg-black px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "Cancel" : "+ Add Shareholder"}
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-black/[0.08] bg-white p-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-black/50 mb-1">
                Shareholder Name
              </label>
              <input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-9 w-full rounded-md border border-black/[0.08] bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-black/50 mb-1">
                Type
              </label>
              <select
                value={formType}
                onChange={(e) =>
                  setFormType(e.target.value as Shareholder["type"])
                }
                className="h-9 w-full rounded-md border border-black/[0.08] bg-white px-2 text-[13px] text-black/70 focus:outline-none focus:ring-2 focus:ring-black"
              >
                {SHAREHOLDER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-black/50 mb-1">
                Number of Shares
              </label>
              <input
                type="number"
                min="0"
                required
                value={formShares}
                onChange={(e) => setFormShares(e.target.value)}
                className="h-9 w-full rounded-md border border-black/[0.08] bg-white px-3 text-[13px] font-mono text-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-black/50 mb-1">
                Note (optional)
              </label>
              <input
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                className="h-9 w-full rounded-md border border-black/[0.08] bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g. SAFE, Series A, advisor grant"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="h-8 rounded-md border border-black/[0.08] px-3 text-[13px] font-medium text-black/60 hover:bg-black/[0.02] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-8 rounded-md bg-black px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            >
              {editing ? "Save Changes" : "Add Shareholder"}
            </button>
          </div>
        </form>
      )}

      {/* Summary Cards */}
      {shareholders.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-black/[0.08] bg-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-black/50">
              Total Shares
            </p>
            <p className="mt-1 text-xl font-semibold font-mono text-black">
              {totalShares.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-black/[0.08] bg-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-black/50">
              Shareholders
            </p>
            <p className="mt-1 text-xl font-semibold font-mono text-black">
              {shareholders.length}
            </p>
          </div>
          <div className="rounded-xl border border-black/[0.08] bg-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-black/50">
              ESOP Pool
            </p>
            <p className="mt-1 text-xl font-semibold font-mono text-black">
              {totalShares > 0
                ? (
                    (shareholders
                      .filter((s) => s.type === "esop")
                      .reduce((sum, s) => sum + s.shares, 0) /
                      totalShares) *
                    100
                  ).toFixed(1)
                : "0.0"}
              %
            </p>
          </div>
        </div>
      )}

      {/* Cap Table */}
      {shareholders.length > 0 && (
        <div className="mt-6 rounded-xl border border-black/[0.08] bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.04] bg-black/[0.02]">
                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-black/50">
                  Shareholder
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-black/50">
                  Type
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-black/50">
                  Shares
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-black/50">
                  Ownership
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-black/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {shareholders.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-black/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-black">
                      {s.name}
                    </p>
                    {s.notes && (
                      <p className="text-[11px] text-black/40">{s.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
                        TYPE_STYLES[s.type] || TYPE_STYLES.founder
                      }`}
                    >
                      {s.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[13px] font-mono text-black">
                      {s.shares.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[13px] font-mono font-semibold text-black">
                      {totalShares > 0
                        ? ((s.shares / totalShares) * 100).toFixed(2)
                        : "0.00"}
                      %
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded px-2 py-1 text-[12px] text-black/50 hover:text-black hover:bg-black/[0.04] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="rounded px-2 py-1 text-[12px] text-black/40 hover:text-black hover:bg-black/[0.04] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-black/[0.08] bg-black/[0.02]">
                <td className="px-4 py-2.5 text-[12px] font-semibold text-black/70">
                  Total
                </td>
                <td />
                <td className="px-4 py-2.5 text-right text-[13px] font-mono font-semibold text-black">
                  {totalShares.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right text-[13px] font-mono font-semibold text-black">
                  100.00%
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Ownership Bar */}
      {shareholders.length > 0 && (
        <div className="mt-6 rounded-xl border border-black/[0.08] bg-white p-5">
          <h2 className="text-[13px] font-semibold text-black/70 mb-3">
            Ownership Breakdown
          </h2>
          <div className="h-6 rounded-full bg-black/[0.04] overflow-hidden flex">
            {shareholders.map((s, i) => {
              const pct = totalShares > 0 ? (s.shares / totalShares) * 100 : 0;
              const shades = [
                "bg-black",
                "bg-black/70",
                "bg-black/50",
                "bg-black/40",
                "bg-black/30",
              ];
              return (
                <div
                  key={s.id}
                  className={`${shades[i % shades.length]} transition-all relative group`}
                  style={{ width: `${pct}%` }}
                  title={`${s.name}: ${pct.toFixed(2)}%`}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[10px] text-white shadow-lg">
                      {s.name}: {pct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {shareholders.map((s, i) => {
              const shades = [
                "bg-black",
                "bg-black/70",
                "bg-black/50",
                "bg-black/40",
                "bg-black/30",
              ];
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div
                    className={`h-2.5 w-2.5 rounded-sm ${shades[i % shades.length]}`}
                  />
                  <span className="text-[11px] text-black/60">{s.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dilution Calculator */}
      <div className="mt-8 rounded-xl border border-black/[0.08] bg-white p-5">
        <h2 className="text-[13px] font-semibold text-black/70 mb-1">
          Dilution Calculator
        </h2>
        <p className="text-[12px] text-black/40 mb-4">
          Model how a funding round affects ownership percentages.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-black/50 mb-1">
              Raise Amount ($)
            </label>
            <input
              type="number"
              min="0"
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(e.target.value)}
              placeholder="500000"
              className="h-9 w-full rounded-md border border-black/[0.08] bg-white px-3 text-[13px] font-mono text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-black/50 mb-1">
              Pre-Money Valuation ($)
            </label>
            <input
              type="number"
              min="0"
              value={preMoneyVal}
              onChange={(e) => setPreMoneyVal(e.target.value)}
              placeholder="5000000"
              className="h-9 w-full rounded-md border border-black/[0.08] bg-white px-3 text-[13px] font-mono text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {raise > 0 && preMoney > 0 && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-black/[0.04] bg-black/[0.02] p-3">
                <p className="text-[11px] font-medium text-black/50">
                  Post-Money
                </p>
                <p className="mt-0.5 text-[14px] font-mono font-semibold text-black">
                  ${postMoney.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-black/[0.04] bg-black/[0.02] p-3">
                <p className="text-[11px] font-medium text-black/50">
                  Investor Gets
                </p>
                <p className="mt-0.5 text-[14px] font-mono font-semibold text-black">
                  {dilutionPercent.toFixed(2)}%
                </p>
              </div>
              <div className="rounded-lg border border-black/[0.04] bg-black/[0.02] p-3">
                <p className="text-[11px] font-medium text-black/50">
                  New Shares
                </p>
                <p className="mt-0.5 text-[14px] font-mono font-semibold text-black">
                  {newInvestorShares.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Post-round ownership */}
            {shareholders.length > 0 && (
              <div className="rounded-lg border border-black/[0.04] bg-black/[0.02] p-4">
                <p className="text-[12px] font-medium text-black/60 mb-2">
                  Post-Round Ownership
                </p>
                <div className="space-y-1.5">
                  {shareholders.map((s) => {
                    const postPct =
                      newTotalShares > 0
                        ? (s.shares / newTotalShares) * 100
                        : 0;
                    const prePct =
                      totalShares > 0
                        ? (s.shares / totalShares) * 100
                        : 0;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[12px] text-black/70">
                          {s.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-black/40 line-through">
                            {prePct.toFixed(2)}%
                          </span>
                          <span className="text-[12px] font-mono font-semibold text-black">
                            {postPct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between border-t border-black/[0.08] pt-1.5 mt-1.5">
                    <span className="text-[12px] font-medium text-black/70">
                      New Investor
                    </span>
                    <span className="text-[12px] font-mono font-semibold text-black">
                      {dilutionPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {shareholders.length === 0 && !showForm && (
        <div className="mt-12 text-center">
          <p className="text-sm text-black/50">
            No shareholders yet. Click &quot;+ Add Shareholder&quot; to build
            your cap table.
          </p>
        </div>
      )}
    </div>
  );
}
