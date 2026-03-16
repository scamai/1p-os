"use client";

import { useState, useEffect, useRef } from "react";
import { useTableData } from "@/lib/hooks/useTableData";
import { Education, EDUCATION } from "@/components/shared/Education";

type ItemStatus = "not-started" | "in-progress" | "done" | "overdue";

type ComplianceItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  status: ItemStatus;
  due_date: string;
  last_reviewed: string;
};

const STATUS_STYLES: Record<ItemStatus, string> = {
  "not-started": "bg-zinc-100 text-zinc-600",
  "in-progress": "bg-zinc-900 text-white",
  done: "bg-zinc-300 text-zinc-700",
  overdue: "bg-zinc-800 text-white",
};

const CATEGORIES = ["Corporate", "Employment", "Tax", "Data & Privacy"];

const DEFAULT_ITEMS: Omit<ComplianceItem, "id">[] = [
  // Corporate
  { category: "Corporate", title: "File Annual Report", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Corporate", title: "Registered Agent in state of incorporation", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Corporate", title: "Maintain corporate minutes / resolutions", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Corporate", title: "Operating Agreement / Bylaws on file", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Corporate", title: "Board consent for major decisions", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  // Employment
  { category: "Employment", title: "I-9 forms for all employees", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Employment", title: "W-4 forms for all employees", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Employment", title: "Workers compensation insurance", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Employment", title: "Employee handbook / policies", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Employment", title: "Contractor agreements (1099)", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  // Tax
  { category: "Tax", title: "EIN (Employer Identification Number)", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Tax", title: "State tax registration", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Tax", title: "Sales tax registration (if applicable)", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Tax", title: "Quarterly estimated tax payments", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Tax", title: "Annual tax return filed", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  // Data & Privacy
  { category: "Data & Privacy", title: "Privacy Policy published", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Data & Privacy", title: "Terms of Service published", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Data & Privacy", title: "Cookie consent banner (if applicable)", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Data & Privacy", title: "GDPR compliance (if serving EU)", description: "", status: "not-started", due_date: "", last_reviewed: "" },
  { category: "Data & Privacy", title: "Data processing agreements with vendors", description: "", status: "not-started", due_date: "", last_reviewed: "" },
];

export default function Page() {
  const { data: items, loading, create, update, remove } = useTableData<ComplianceItem>("compliance_items");
  const [editing, setEditing] = useState<ComplianceItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Omit<ComplianceItem, "id">>({
    category: "Corporate",
    title: "",
    description: "",
    status: "not-started",
    due_date: "",
    last_reviewed: "",
  });
  const seededRef = useRef(false);

  // Seed default items if table is empty
  useEffect(() => {
    if (!loading && items.length === 0 && !seededRef.current) {
      seededRef.current = true;
      (async () => {
        for (const item of DEFAULT_ITEMS) {
          await create(item);
        }
      })();
    }
  }, [loading, items.length, create]);

  async function cycleStatus(id: string) {
    const order: ItemStatus[] = ["not-started", "in-progress", "done", "overdue"];
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const nextStatus = order[(order.indexOf(item.status) + 1) % order.length];
    await update(id, { status: nextStatus } as Partial<ComplianceItem>);
  }

  async function saveEdit() {
    if (!editing) return;
    const { id: _id, ...rest } = editing;
    await update(editing.id, rest);
    setEditing(null);
  }

  async function addItem() {
    if (!newItem.title.trim()) return;
    await create({ ...newItem, title: newItem.title.trim() });
    setNewItem({ category: "Corporate", title: "", description: "", status: "not-started", due_date: "", last_reviewed: "" });
    setShowAddForm(false);
  }

  async function removeItem(id: string) {
    await remove(id);
  }

  const filtered = filterCategory === "all" ? items : items.filter((i) => i.category === filterCategory);

  const stats = {
    total: items.length,
    done: items.filter((i) => i.status === "done").length,
    overdue: items.filter((i) => i.status === "overdue").length,
  };

  if (loading) return null;

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
                  value={newItem.title}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, title: e.target.value }))}
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
                    value={newItem.due_date}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, due_date: e.target.value }))}
                    className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Notes</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
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
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
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
                  value={editing.due_date}
                  onChange={(e) => setEditing({ ...editing, due_date: e.target.value })}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Notes</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
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
                    {item.title}
                  </span>
                  {item.due_date && (
                    <span className="text-[10px] text-zinc-400 shrink-0">{item.due_date}</span>
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
