"use client";

import { useState } from "react";
import { useTableData } from "@/lib/hooks/useTableData";
import { Education, EDUCATION } from "@/components/shared/Education";

type ContractType = "NDA" | "MSA" | "SOW" | "Employment" | "Other";
type ContractStatus = "draft" | "sent" | "signed" | "expired";

type Contract = {
  id: string;
  name: string;
  counterparty: string;
  type: ContractType;
  status: ContractStatus;
  start_date: string;
  end_date: string;
  value: number;
  notes: string;
};

const STATUS_STYLES: Record<ContractStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-slate-200 text-slate-700",
  signed: "bg-slate-900 text-white",
  expired: "bg-slate-300 text-slate-500",
};

const TYPE_STYLES: Record<ContractType, string> = {
  NDA: "bg-slate-100 text-slate-600",
  MSA: "bg-slate-200 text-slate-700",
  SOW: "bg-slate-300 text-slate-800",
  Employment: "bg-slate-900 text-white",
  Other: "bg-slate-50 text-slate-500 border border-slate-200",
};

const EMPTY_CONTRACT: Omit<Contract, "id"> = {
  name: "",
  counterparty: "",
  type: "NDA",
  status: "draft",
  start_date: "",
  end_date: "",
  value: 0,
  notes: "",
};

export default function Page() {
  const { data: contracts, loading, create, update, remove } = useTableData<Contract>("contracts");
  const [editing, setEditing] = useState<Contract | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ContractStatus | "all">("all");
  const [filterType, setFilterType] = useState<ContractType | "all">("all");

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
    setEditing({ id: "", ...EMPTY_CONTRACT });
    setIsNew(true);
  }

  const filtered = contracts.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterType !== "all" && c.type !== filterType) return false;
    return true;
  });

  const totalValue = filtered.reduce((s, c) => s + c.value, 0);

  if (loading) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <Education {...EDUCATION.contracts} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Contracts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track agreements, NDAs, and service contracts.
          </p>
        </div>
        <button
          onClick={startNew}
          className="text-sm px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800"
        >
          Add Contract
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ContractStatus | "all")}
            className="text-sm border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="signed">Signed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ContractType | "all")}
            className="text-sm border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="all">All</option>
            <option value="NDA">NDA</option>
            <option value="MSA">MSA</option>
            <option value="SOW">SOW</option>
            <option value="Employment">Employment</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="ml-auto self-end text-xs text-slate-400">
          {filtered.length} contract{filtered.length !== 1 ? "s" : ""} | Total value: $
          {totalValue.toLocaleString()}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              {isNew ? "New" : "Edit"} Contract
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Contract Name</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Counterparty</label>
                <input
                  type="text"
                  value={editing.counterparty}
                  onChange={(e) => setEditing({ ...editing, counterparty: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                  <select
                    value={editing.type}
                    onChange={(e) => setEditing({ ...editing, type: e.target.value as ContractType })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="NDA">NDA</option>
                    <option value="MSA">MSA</option>
                    <option value="SOW">SOW</option>
                    <option value="Employment">Employment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as ContractStatus })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="signed">Signed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editing.start_date}
                    onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editing.end_date}
                    onChange={(e) => setEditing({ ...editing, end_date: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Value ($)</label>
                <input
                  type="number"
                  min={0}
                  value={editing.value}
                  onChange={(e) => setEditing({ ...editing, value: parseFloat(e.target.value) || 0 })}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setEditing(null); setIsNew(false); }}
                className="text-sm px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="text-sm px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-lg">
          <p className="text-sm text-slate-400">
            {contracts.length === 0
              ? "No contracts yet. Add your first one."
              : "No contracts match filters."}
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Name", "Counterparty", "Type", "Status", "Dates", "Value", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                >
                  <td className="px-3 py-2 text-slate-900 font-medium">{c.name || "Untitled"}</td>
                  <td className="px-3 py-2 text-slate-700">{c.counterparty}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_STYLES[c.type]}`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_STYLES[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {c.start_date && <span>{c.start_date}</span>}
                    {c.start_date && c.end_date && <span> - </span>}
                    {c.end_date && <span>{c.end_date}</span>}
                  </td>
                  <td className="px-3 py-2 text-slate-700">${c.value.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditing(c); setIsNew(false); }}
                        className="text-xs text-slate-400 hover:text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(c.id)}
                        className="text-xs text-slate-400 hover:text-slate-700"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
