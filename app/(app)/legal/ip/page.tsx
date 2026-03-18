"use client";

import { useState, useEffect } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

type IPType = "trademark" | "patent" | "copyright" | "domain";
type IPStatus = "filed" | "pending" | "granted" | "expired";

type IPItem = {
  id: string;
  type: IPType;
  name: string;
  filingDate: string;
  status: IPStatus;
  registrationNumber: string;
  renewalDate: string;
  notes: string;
};

const STORAGE_KEY = "1pos-ip";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const STATUS_STYLES: Record<IPStatus, string> = {
  filed: "bg-slate-100 text-slate-600",
  pending: "bg-slate-200 text-slate-700",
  granted: "bg-slate-900 text-white",
  expired: "bg-slate-300 text-slate-500",
};

const TYPE_STYLES: Record<IPType, string> = {
  trademark: "bg-slate-900 text-white",
  patent: "bg-slate-600 text-white",
  copyright: "bg-slate-300 text-slate-800",
  domain: "bg-slate-100 text-slate-600 border border-slate-200",
};

const EMPTY_ITEM: Omit<IPItem, "id"> = {
  type: "trademark",
  name: "",
  filingDate: "",
  status: "filed",
  registrationNumber: "",
  renewalDate: "",
  notes: "",
};

export default function Page() {
  const [items, setItems] = useState<IPItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<IPItem | null>(null);
  const [filterType, setFilterType] = useState<IPType | "all">("all");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  function save() {
    if (!editing) return;
    setItems((prev) => {
      const exists = prev.find((i) => i.id === editing.id);
      if (exists) return prev.map((i) => (i.id === editing.id ? editing : i));
      return [...prev, editing];
    });
    setEditing(null);
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const filtered = filterType === "all" ? items : items.filter((i) => i.type === filterType);

  // Items with renewal dates coming up in the next 90 days
  const today = new Date().toISOString().split("T")[0];
  const in90Days = new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];
  const upcomingRenewals = items.filter(
    (i) => i.renewalDate && i.renewalDate >= today && i.renewalDate <= in90Days
  );

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <Education {...EDUCATION.ip} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">IP &amp; Trademarks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track intellectual property, trademarks, patents, and domains.
          </p>
        </div>
        <button
          onClick={() => setEditing({ id: uid(), ...EMPTY_ITEM })}
          className="text-sm px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800"
        >
          Add IP
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(["trademark", "patent", "copyright", "domain"] as IPType[]).map((t) => {
          const count = items.filter((i) => i.type === t).length;
          return (
            <div key={t} className="border border-slate-200 rounded-lg p-3 bg-white text-center">
              <p className="text-xs text-slate-500 mb-1 capitalize">{t}s</p>
              <p className="text-xl font-bold text-slate-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Upcoming renewals */}
      {upcomingRenewals.length > 0 && (
        <div className="border border-slate-200 rounded-lg p-4 bg-white mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Upcoming Renewals (next 90 days)
          </h2>
          <ul className="space-y-1.5">
            {upcomingRenewals.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_STYLES[item.type]}`}>
                  {item.type}
                </span>
                <span className="text-slate-700 flex-1">{item.name}</span>
                <span className="text-xs text-slate-400">{item.renewalDate}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setFilterType("all")}
          className={`text-xs px-2 py-1 rounded ${filterType === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          All
        </button>
        {(["trademark", "patent", "copyright", "domain"] as IPType[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`text-xs px-2 py-1 rounded capitalize ${filterType === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              {items.find((i) => i.id === editing.id) ? "Edit" : "New"} IP
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Name</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                  <select
                    value={editing.type}
                    onChange={(e) => setEditing({ ...editing, type: e.target.value as IPType })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="trademark">Trademark</option>
                    <option value="patent">Patent</option>
                    <option value="copyright">Copyright</option>
                    <option value="domain">Domain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as IPStatus })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="filed">Filed</option>
                    <option value="pending">Pending</option>
                    <option value="granted">Granted</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Filing Date</label>
                  <input
                    type="date"
                    value={editing.filingDate}
                    onChange={(e) => setEditing({ ...editing, filingDate: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Renewal Date</label>
                  <input
                    type="date"
                    value={editing.renewalDate}
                    onChange={(e) => setEditing({ ...editing, renewalDate: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Registration Number</label>
                <input
                  type="text"
                  value={editing.registrationNumber}
                  onChange={(e) => setEditing({ ...editing, registrationNumber: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Notes</label>
                <textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  rows={2}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditing(null)} className="text-sm px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={save} className="text-sm px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-lg">
          <p className="text-sm text-slate-400">
            {items.length === 0 ? "No IP items yet. Add your first one." : "No items match filter."}
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Type", "Name", "Filed", "Status", "Reg #", "Renewal", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_STYLES[item.type]}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-900 font-medium">{item.name || "Untitled"}</td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{item.filingDate}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_STYLES[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 text-xs">{item.registrationNumber}</td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{item.renewalDate}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(item)} className="text-xs text-slate-400 hover:text-slate-700">Edit</button>
                      <button onClick={() => remove(item.id)} className="text-xs text-slate-400 hover:text-slate-700">Del</button>
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
