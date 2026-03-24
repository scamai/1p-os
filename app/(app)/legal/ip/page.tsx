"use client";

import { useState, useEffect } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";
import { RelatedPages } from "@/components/shared/RelatedPages";

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
  filed: "bg-black/[0.04] text-black/60",
  pending: "bg-black/[0.08] text-black/70",
  granted: "bg-black text-white",
  expired: "bg-black/30 text-black/50",
};

const TYPE_STYLES: Record<IPType, string> = {
  trademark: "bg-black text-white",
  patent: "bg-black/60 text-white",
  copyright: "bg-black/30 text-black/80",
  domain: "bg-black/[0.04] text-black/60 border border-black/[0.08]",
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
          <h1 className="font-heading text-[clamp(1.5rem,3vw,1.75rem)] italic font-light tracking-[-0.01em] text-black">IP &amp; Trademarks</h1>
          <p className="mt-2 text-[14px] leading-[1.6] text-black/40">
            Track intellectual property, trademarks, patents, and domains.
          </p>
        </div>
        <button
          onClick={() => setEditing({ id: uid(), ...EMPTY_ITEM })}
          className="text-sm px-3 py-1.5 bg-black text-white rounded hover:bg-black/80"
        >
          Add IP
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(["trademark", "patent", "copyright", "domain"] as IPType[]).map((t) => {
          const count = items.filter((i) => i.type === t).length;
          return (
            <div key={t} className="border border-black/[0.08] rounded-lg p-3 bg-white text-center">
              <p className="text-xs text-black/50 mb-1 capitalize">{t}s</p>
              <p className="text-xl font-bold text-black">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Upcoming renewals */}
      {upcomingRenewals.length > 0 && (
        <div className="border border-black/[0.08] rounded-lg p-4 bg-white mb-6">
          <h2 className="text-sm font-semibold text-black mb-2">
            Upcoming Renewals (next 90 days)
          </h2>
          <ul className="space-y-1.5">
            {upcomingRenewals.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_STYLES[item.type]}`}>
                  {item.type}
                </span>
                <span className="text-black/70 flex-1">{item.name}</span>
                <span className="text-xs text-black/40">{item.renewalDate}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setFilterType("all")}
          className={`text-xs px-2 py-1 rounded ${filterType === "all" ? "bg-black text-white" : "bg-black/[0.04] text-black/60 hover:bg-black/[0.08]"}`}
        >
          All
        </button>
        {(["trademark", "patent", "copyright", "domain"] as IPType[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`text-xs px-2 py-1 rounded capitalize ${filterType === t ? "bg-black text-white" : "bg-black/[0.04] text-black/60 hover:bg-black/[0.08]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-sm font-semibold text-black mb-4">
              {items.find((i) => i.id === editing.id) ? "Edit" : "New"} IP
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-black/50 mb-1">Name</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full text-sm border border-black/[0.08] rounded px-2 py-1.5 text-black focus:outline-none focus:ring-1 focus:ring-black/40"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-black/50 mb-1">Type</label>
                  <select
                    value={editing.type}
                    onChange={(e) => setEditing({ ...editing, type: e.target.value as IPType })}
                    className="w-full text-sm border border-black/[0.08] rounded px-2 py-1.5 text-black focus:outline-none focus:ring-1 focus:ring-black/40"
                  >
                    <option value="trademark">Trademark</option>
                    <option value="patent">Patent</option>
                    <option value="copyright">Copyright</option>
                    <option value="domain">Domain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-black/50 mb-1">Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as IPStatus })}
                    className="w-full text-sm border border-black/[0.08] rounded px-2 py-1.5 text-black focus:outline-none focus:ring-1 focus:ring-black/40"
                  >
                    <option value="filed">Filed</option>
                    <option value="pending">Pending</option>
                    <option value="granted">Granted</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-black/50 mb-1">Filing Date</label>
                  <input
                    type="date"
                    value={editing.filingDate}
                    onChange={(e) => setEditing({ ...editing, filingDate: e.target.value })}
                    className="w-full text-sm border border-black/[0.08] rounded px-2 py-1.5 text-black focus:outline-none focus:ring-1 focus:ring-black/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-black/50 mb-1">Renewal Date</label>
                  <input
                    type="date"
                    value={editing.renewalDate}
                    onChange={(e) => setEditing({ ...editing, renewalDate: e.target.value })}
                    className="w-full text-sm border border-black/[0.08] rounded px-2 py-1.5 text-black focus:outline-none focus:ring-1 focus:ring-black/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-black/50 mb-1">Registration Number</label>
                <input
                  type="text"
                  value={editing.registrationNumber}
                  onChange={(e) => setEditing({ ...editing, registrationNumber: e.target.value })}
                  className="w-full text-sm border border-black/[0.08] rounded px-2 py-1.5 text-black focus:outline-none focus:ring-1 focus:ring-black/40"
                />
              </div>
              <div>
                <label className="block text-xs text-black/50 mb-1">Notes</label>
                <textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  rows={2}
                  className="w-full text-sm border border-black/[0.08] rounded px-2 py-1.5 text-black focus:outline-none focus:ring-1 focus:ring-black/40 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditing(null)} className="text-sm px-3 py-1.5 border border-black/[0.08] rounded text-black/60 hover:bg-black/[0.02]">Cancel</button>
              <button onClick={save} className="text-sm px-3 py-1.5 bg-black text-white rounded hover:bg-black/80">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-black/[0.08] rounded-lg">
          <p className="text-sm text-black/40">
            {items.length === 0 ? "No IP items yet. Add your first one." : "No items match filter."}
          </p>
        </div>
      ) : (
        <div className="border border-black/[0.08] overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-black/[0.02] border-b border-black/[0.08]">
                {["Type", "Name", "Filed", "Status", "Reg #", "Renewal", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-black/50 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} className={`border-b border-black/[0.04] ${i % 2 === 0 ? "bg-white" : "bg-black/[0.02]"}`}>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_STYLES[item.type]}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-black font-medium">{item.name || "Untitled"}</td>
                  <td className="px-3 py-2 text-black/50 text-xs">{item.filingDate}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_STYLES[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-black/60 text-xs">{item.registrationNumber}</td>
                  <td className="px-3 py-2 text-black/50 text-xs">{item.renewalDate}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(item)} className="text-xs text-black/40 hover:text-black/70">Edit</button>
                      <button onClick={() => remove(item.id)} className="text-xs text-black/40 hover:text-black/70">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RelatedPages links={[
        { label: "Incorporation", href: "/company/incorporation", context: "Register IP alongside your company formation" },
        { label: "Legal Templates", href: "/legal/contracts", context: "Generate IP assignment and NDA agreements" },
        { label: "SAFEs", href: "/legal/safes", context: "Include IP provisions in investor agreements" },
      ]} />
    </div>
  );
}
