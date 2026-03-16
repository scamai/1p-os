"use client";

import { useState, useEffect } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

type ItemStatus = "not-started" | "in-progress" | "done" | "overdue";

type ComplianceItem = {
  id: string;
  category: string;
  name: string;
  status: ItemStatus;
  dueDate: string;
  notes: string;
};

const STORAGE_KEY = "1pos-compliance";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const STATUS_STYLES: Record<ItemStatus, string> = {
  "not-started": "bg-zinc-100 text-zinc-600",
  "in-progress": "bg-zinc-900 text-white",
  done: "bg-zinc-300 text-zinc-700",
  overdue: "bg-zinc-800 text-white",
};

const CATEGORIES = ["Corporate", "Employment", "Tax", "Data & Privacy"];

const DEFAULT_ITEMS: ComplianceItem[] = [
  // Corporate
  { id: uid(), category: "Corporate", name: "File Annual Report", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Corporate", name: "Registered Agent in state of incorporation", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Corporate", name: "Maintain corporate minutes / resolutions", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Corporate", name: "Operating Agreement / Bylaws on file", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Corporate", name: "Board consent for major decisions", status: "not-started", dueDate: "", notes: "" },
  // Employment
  { id: uid(), category: "Employment", name: "I-9 forms for all employees", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Employment", name: "W-4 forms for all employees", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Employment", name: "Workers compensation insurance", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Employment", name: "Employee handbook / policies", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Employment", name: "Contractor agreements (1099)", status: "not-started", dueDate: "", notes: "" },
  // Tax
  { id: uid(), category: "Tax", name: "EIN (Employer Identification Number)", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Tax", name: "State tax registration", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Tax", name: "Sales tax registration (if applicable)", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Tax", name: "Quarterly estimated tax payments", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Tax", name: "Annual tax return filed", status: "not-started", dueDate: "", notes: "" },
  // Data & Privacy
  { id: uid(), category: "Data & Privacy", name: "Privacy Policy published", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Data & Privacy", name: "Terms of Service published", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Data & Privacy", name: "Cookie consent banner (if applicable)", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Data & Privacy", name: "GDPR compliance (if serving EU)", status: "not-started", dueDate: "", notes: "" },
  { id: uid(), category: "Data & Privacy", name: "Data processing agreements with vendors", status: "not-started", dueDate: "", notes: "" },
];

export default function Page() {
  const [items, setItems] = useState<ComplianceItem[]>(DEFAULT_ITEMS);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<ComplianceItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<ComplianceItem>({
    id: "",
    category: "Corporate",
    name: "",
    status: "not-started",
    dueDate: "",
    notes: "",
  });

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

  function cycleStatus(id: string) {
    const order: ItemStatus[] = ["not-started", "in-progress", "done", "overdue"];
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: order[(order.indexOf(item.status) + 1) % order.length] }
          : item
      )
    );
  }

  function saveEdit() {
    if (!editing) return;
    setItems((prev) => prev.map((i) => (i.id === editing.id ? editing : i)));
    setEditing(null);
  }

  function addItem() {
    if (!newItem.name.trim()) return;
    setItems((prev) => [...prev, { ...newItem, id: uid(), name: newItem.name.trim() }]);
    setNewItem({ id: "", category: "Corporate", name: "", status: "not-started", dueDate: "", notes: "" });
    setShowAddForm(false);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const filtered = filterCategory === "all" ? items : items.filter((i) => i.category === filterCategory);

  const stats = {
    total: items.length,
    done: items.filter((i) => i.status === "done").length,
    overdue: items.filter((i) => i.status === "overdue").length,
  };

  if (!loaded) return null;

  const groupedByCategory: Record<string, ComplianceItem[]> = {};
  for (const item of filtered) {
    if (!groupedByCategory[item.category]) groupedByCategory[item.category] = [];
    groupedByCategory[item.category].push(item);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Education {...EDUCATION.compliance} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Compliance</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track regulatory and compliance requirements.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-sm px-3 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800"
        >
          Add Item
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-zinc-200 rounded-lg p-3 bg-white text-center">
          <p className="text-xs text-zinc-500 mb-1">Total Items</p>
          <p className="text-xl font-bold text-zinc-900">{stats.total}</p>
        </div>
        <div className="border border-zinc-200 rounded-lg p-3 bg-white text-center">
          <p className="text-xs text-zinc-500 mb-1">Completed</p>
          <p className="text-xl font-bold text-zinc-900">{stats.done}</p>
        </div>
        <div className="border border-zinc-200 rounded-lg p-3 bg-white text-center">
          <p className="text-xs text-zinc-500 mb-1">Overdue</p>
          <p className="text-xl font-bold text-zinc-900">{stats.overdue}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
          <span>Overall Progress</span>
          <span>{stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-100 rounded">
          <div
            className="h-2 bg-zinc-900 rounded transition-all"
            style={{ width: stats.total > 0 ? `${(stats.done / stats.total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <div className="flex gap-1">
          <button
            onClick={() => setFilterCategory("all")}
            className={`text-xs px-2 py-1 rounded ${filterCategory === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`text-xs px-2 py-1 rounded ${filterCategory === cat ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Add form modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Add Compliance Item</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newItem.dueDate}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Notes</label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowAddForm(false)} className="text-sm px-3 py-1.5 border border-zinc-200 rounded text-zinc-600 hover:bg-zinc-50">Cancel</button>
              <button onClick={addItem} className="text-sm px-3 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Edit Item</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Name</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Category</label>
                  <select
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as ItemStatus })}
                    className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editing.dueDate}
                  onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Notes</label>
                <textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  rows={2}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditing(null)} className="text-sm px-3 py-1.5 border border-zinc-200 rounded text-zinc-600 hover:bg-zinc-50">Cancel</button>
              <button onClick={saveEdit} className="text-sm px-3 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist by category */}
      <div className="space-y-4">
        {Object.entries(groupedByCategory).map(([category, categoryItems]) => (
          <div key={category} className="border border-zinc-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900">{category}</h2>
              <span className="text-xs text-zinc-400">
                {categoryItems.filter((i) => i.status === "done").length}/{categoryItems.length} done
              </span>
            </div>
            <ul className="space-y-2">
              {categoryItems.map((item) => (
                <li key={item.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => cycleStatus(item.id)}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${STATUS_STYLES[item.status]}`}
                  >
                    {item.status}
                  </button>
                  <span
                    className={`text-sm flex-1 ${
                      item.status === "done" ? "text-zinc-400 line-through" : "text-zinc-700"
                    }`}
                  >
                    {item.name}
                  </span>
                  {item.dueDate && (
                    <span className="text-[10px] text-zinc-400 shrink-0">{item.dueDate}</span>
                  )}
                  <button
                    onClick={() => setEditing(item)}
                    className="text-xs text-zinc-300 hover:text-zinc-600 opacity-0 group-hover:opacity-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-zinc-300 hover:text-zinc-600 opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
