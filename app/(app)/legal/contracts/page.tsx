"use client";

import { useState, useEffect } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

type ContractType = "NDA" | "MSA" | "SOW" | "Employment" | "Other";
type ContractStatus = "draft" | "sent" | "signed" | "expired";

type Contract = {
  id: string;
  name: string;
  counterparty: string;
  type: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  value: number;
};

const STORAGE_KEY = "1pos-contracts";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const STATUS_STYLES: Record<ContractStatus, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  sent: "bg-zinc-200 text-zinc-700",
  signed: "bg-zinc-900 text-white",
  expired: "bg-zinc-300 text-zinc-500",
};

const TYPE_STYLES: Record<ContractType, string> = {
  NDA: "bg-zinc-100 text-zinc-600",
  MSA: "bg-zinc-200 text-zinc-700",
  SOW: "bg-zinc-300 text-zinc-800",
  Employment: "bg-zinc-900 text-white",
  Other: "bg-zinc-50 text-zinc-500 border border-zinc-200",
};

const EMPTY_CONTRACT: Omit<Contract, "id"> = {
  name: "",
  counterparty: "",
  type: "NDA",
  status: "draft",
  startDate: "",
  endDate: "",
  value: 0,
};

export default function Page() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [filterStatus, setFilterStatus] = useState<ContractStatus | "all">("all");
  const [filterType, setFilterType] = useState<ContractType | "all">("all");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setContracts(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
  }, [contracts, loaded]);

  function save() {
    if (!editing) return;
    setContracts((prev) => {
      const exists = prev.find((c) => c.id === editing.id);
      if (exists) return prev.map((c) => (c.id === editing.id ? editing : c));
      return [...prev, editing];
    });
    setEditing(null);
  }

  function remove(id: string) {
    setContracts((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = contracts.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterType !== "all" && c.type !== filterType) return false;
    return true;
  });

  const totalValue = filtered.reduce((s, c) => s + c.value, 0);

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <Education {...EDUCATION.contracts} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Contracts</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track agreements, NDAs, and service contracts.
          </p>
        </div>
        <button
          onClick={() => setEditing({ id: uid(), ...EMPTY_CONTRACT })}
          className="text-sm px-3 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800"
        >
          Add Contract
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ContractStatus | "all")}
            className="text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="signed">Signed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ContractType | "all")}
            className="text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="all">All</option>
            <option value="NDA">NDA</option>
            <option value="MSA">MSA</option>
            <option value="SOW">SOW</option>
            <option value="Employment">Employment</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="ml-auto self-end text-xs text-zinc-400">
          {filtered.length} contract{filtered.length !== 1 ? "s" : ""} | Total value: $
          {totalValue.toLocaleString()}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">
              {contracts.find((c) => c.id === editing.id) ? "Edit" : "New"} Contract
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Contract Name</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Counterparty</label>
                <input
                  type="text"
                  value={editing.counterparty}
                  onChange={(e) => setEditing({ ...editing, counterparty: e.target.value })}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Type</label>
                  <select
                    value={editing.type}
                    onChange={(e) => setEditing({ ...editing, type: e.target.value as ContractType })}
                    className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    <option value="NDA">NDA</option>
                    <option value="MSA">MSA</option>
                    <option value="SOW">SOW</option>
                    <option value="Employment">Employment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as ContractStatus })}
                    className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
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
                  <label className="block text-xs text-zinc-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editing.startDate}
                    onChange={(e) => setEditing({ ...editing, startDate: e.target.value })}
                    className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editing.endDate}
                    onChange={(e) => setEditing({ ...editing, endDate: e.target.value })}
                    className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Value ($)</label>
                <input
                  type="number"
                  min={0}
                  value={editing.value}
                  onChange={(e) => setEditing({ ...editing, value: parseFloat(e.target.value) || 0 })}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditing(null)}
                className="text-sm px-3 py-1.5 border border-zinc-200 rounded text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="text-sm px-3 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 rounded-lg">
          <p className="text-sm text-zinc-400">
            {contracts.length === 0
              ? "No contracts yet. Add your first one."
              : "No contracts match filters."}
          </p>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                {["Name", "Counterparty", "Type", "Status", "Dates", "Value", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
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
                  className={`border-b border-zinc-100 ${i % 2 === 0 ? "bg-white" : "bg-zinc-50"}`}
                >
                  <td className="px-3 py-2 text-zinc-900 font-medium">{c.name || "Untitled"}</td>
                  <td className="px-3 py-2 text-zinc-700">{c.counterparty}</td>
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
                  <td className="px-3 py-2 text-xs text-zinc-500">
                    {c.startDate && <span>{c.startDate}</span>}
                    {c.startDate && c.endDate && <span> - </span>}
                    {c.endDate && <span>{c.endDate}</span>}
                  </td>
                  <td className="px-3 py-2 text-zinc-700">${c.value.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditing(c)}
                        className="text-xs text-zinc-400 hover:text-zinc-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(c.id)}
                        className="text-xs text-zinc-400 hover:text-zinc-700"
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
