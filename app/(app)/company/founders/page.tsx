"use client";

import { useState } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";
import { useTableData } from "@/lib/hooks/useTableData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Founder {
  id: string;
  name: string;
  email: string;
  role: string;
  equity_pct: number;
  vesting_months: number;
  cliff_months: number;
  start_date: string;
  notes: string;
}

const ROLES = [
  "CEO",
  "CTO",
  "COO",
  "CFO",
  "CPO",
  "CMO",
  "VP Engineering",
  "VP Product",
  "VP Sales",
  "Other",
];

// ---------------------------------------------------------------------------
// Equity Pie (div-based)
// ---------------------------------------------------------------------------

function EquityPie({ founders }: { founders: Founder[] }) {
  const total = founders.reduce((s, f) => s + f.equity_pct, 0);
  const unallocated = Math.max(0, 100 - total);

  const segments: { label: string; percent: number; shade: string }[] = [];
  const shades = [
    "bg-zinc-900",
    "bg-zinc-700",
    "bg-zinc-500",
    "bg-zinc-400",
    "bg-zinc-300",
    "bg-zinc-200",
  ];

  founders.forEach((f, i) => {
    segments.push({
      label: f.name || "Unnamed",
      percent: f.equity_pct,
      shade: shades[i % shades.length],
    });
  });

  if (unallocated > 0) {
    segments.push({
      label: "Unallocated",
      percent: unallocated,
      shade: "bg-zinc-100",
    });
  }

  // Conic gradient via stacked segments
  let cumulative = 0;
  const gradientParts: string[] = [];
  const colorMap: Record<string, string> = {
    "bg-zinc-900": "#18181b",
    "bg-zinc-700": "#3f3f46",
    "bg-zinc-500": "#71717a",
    "bg-zinc-400": "#a1a1aa",
    "bg-zinc-300": "#d4d4d8",
    "bg-zinc-200": "#e4e4e7",
    "bg-zinc-100": "#f4f4f5",
  };

  segments.forEach((seg) => {
    const start = cumulative;
    const end = cumulative + seg.percent;
    const color = colorMap[seg.shade] || "#e4e4e7";
    gradientParts.push(`${color} ${start}% ${end}%`);
    cumulative = end;
  });

  if (cumulative < 100) {
    gradientParts.push(`#f4f4f5 ${cumulative}% 100%`);
  }

  return (
    <div className="flex items-center gap-6">
      <div
        className="h-32 w-32 shrink-0 rounded-full border border-zinc-200"
        style={{
          background: segments.length > 0
            ? `conic-gradient(${gradientParts.join(", ")})`
            : "#f4f4f5",
        }}
      />
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-sm ${seg.shade} border border-zinc-300`} />
            <span className="text-[12px] text-zinc-700">
              {seg.label}
            </span>
            <span className="text-[12px] font-mono text-zinc-500">
              {seg.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function FoundersPage() {
  const { data: founders, loading, create, update, remove } = useTableData<Founder>('founders');
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("CEO");
  const [formEquity, setFormEquity] = useState("25");
  const [formVesting, setFormVesting] = useState("48");
  const [formCliff, setFormCliff] = useState("12");
  const [formStart, setFormStart] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormRole("CEO");
    setFormEquity("25");
    setFormVesting("48");
    setFormCliff("12");
    setFormStart("");
    setEditing(null);
  };

  const openEdit = (f: Founder) => {
    setFormName(f.name);
    setFormEmail(f.email);
    setFormRole(f.role);
    setFormEquity(String(f.equity_pct));
    setFormVesting(String(f.vesting_months));
    setFormCliff(String(f.cliff_months));
    setFormStart(f.start_date || "");
    setEditing(f.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fields = {
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      equity_pct: parseFloat(formEquity) || 0,
      vesting_months: parseInt(formVesting) || 48,
      cliff_months: parseInt(formCliff) || 12,
      start_date: formStart || undefined,
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

  const totalEquity = founders.reduce((s, f) => s + f.equity_pct, 0);

  if (loading) return null;

  return (
    <div className="mx-auto max-w-[800px]">
      <Education {...EDUCATION.founders} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Founders</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your founding team, equity splits, and vesting schedules.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="h-8 rounded-md bg-zinc-900 px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "Cancel" : "+ Add Founder"}
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-zinc-500 mb-1">
                Full Name
              </label>
              <input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-zinc-500 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="jane@company.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-zinc-500 mb-1">
                Role
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-[13px] text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-zinc-500 mb-1">
                Equity %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                required
                value={formEquity}
                onChange={(e) => setFormEquity(e.target.value)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-[13px] font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-zinc-500 mb-1">
                Vesting (months)
              </label>
              <select
                value={formVesting}
                onChange={(e) => setFormVesting(e.target.value)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-[13px] text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="36">36 months</option>
                <option value="48">48 months</option>
                <option value="60">60 months</option>
                <option value="72">72 months</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-zinc-500 mb-1">
                Cliff (months)
              </label>
              <select
                value={formCliff}
                onChange={(e) => setFormCliff(e.target.value)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-[13px] text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="0">No cliff</option>
                <option value="6">6 months</option>
                <option value="12">12 months (standard)</option>
                <option value="18">18 months</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-zinc-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
              className="h-8 rounded-md border border-zinc-200 px-3 text-[13px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-8 rounded-md bg-zinc-900 px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            >
              {editing ? "Save Changes" : "Add Founder"}
            </button>
          </div>
        </form>
      )}

      {/* Equity Pie */}
      {founders.length > 0 && (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-[13px] font-semibold text-zinc-700 mb-4">
            Equity Split
          </h2>
          <EquityPie founders={founders} />
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[12px] text-zinc-500">
              Total allocated:
            </span>
            <span
              className={`text-[13px] font-mono font-semibold ${
                totalEquity > 100 ? "text-red-600" : "text-zinc-900"
              }`}
            >
              {totalEquity.toFixed(1)}%
            </span>
            {totalEquity > 100 && (
              <span className="text-[11px] text-red-500">
                Over-allocated by {(totalEquity - 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Founders Table */}
      {founders.length > 0 && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Name
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Role
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Equity
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Vesting
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {founders.map((f) => (
                <tr
                  key={f.id}
                  className="hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-zinc-900">
                      {f.name}
                    </p>
                    {f.email && (
                      <p className="text-[11px] text-zinc-400">{f.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                      {f.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[13px] font-mono font-semibold text-zinc-900">
                      {f.equity_pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-zinc-600">
                      {Math.round(f.vesting_months / 12)}yr / {f.cliff_months}mo cliff
                    </span>
                    {f.start_date && (
                      <p className="text-[11px] text-zinc-400">
                        from {f.start_date}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(f)}
                        className="rounded px-2 py-1 text-[12px] text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="rounded px-2 py-1 text-[12px] text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {founders.length === 0 && !showForm && (
        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-500">
            No founders added yet. Click &quot;+ Add Founder&quot; to get started.
          </p>
        </div>
      )}
    </div>
  );
}
