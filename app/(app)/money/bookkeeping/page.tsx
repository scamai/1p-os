"use client";

import { useState, useEffect, useMemo } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: "revenue" | "expense";
  account: string;
}

const ACCOUNTS = ["Checking", "Savings", "Credit Card", "Cash", "Other"];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Page() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState<"all" | "revenue" | "expense">("all");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Form state
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10));
  const [fDesc, setFDesc] = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fCat, setFCat] = useState<"revenue" | "expense">("expense");
  const [fAccount, setFAccount] = useState("Checking");

  useEffect(() => {
    const saved = localStorage.getItem("1pos_bookkeeping");
    if (saved) setTransactions(JSON.parse(saved));
    setLoaded(true);
  }, []);

  function save(updated: Transaction[]) {
    setTransactions(updated);
    localStorage.setItem("1pos_bookkeeping", JSON.stringify(updated));
  }

  function addTransaction() {
    if (!fDesc || !fAmount) return;
    const t: Transaction = {
      id: genId(),
      date: fDate,
      description: fDesc,
      amount: parseFloat(fAmount) || 0,
      category: fCat,
      account: fAccount,
    };
    const updated = [t, ...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    save(updated);
    setFDesc("");
    setFAmount("");
    setShowForm(false);
  }

  function deleteTransaction(id: string) {
    save(transactions.filter((t) => t.id !== id));
  }

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterCat !== "all" && t.category !== filterCat) return false;
      if (filterStart && t.date < filterStart) return false;
      if (filterEnd && t.date > filterEnd) return false;
      return true;
    });
  }, [transactions, filterCat, filterStart, filterEnd]);

  // Running balance
  const balancedRows = useMemo(() => {
    let balance = 0;
    // Calculate balance from oldest to newest, display newest first
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const withBalance = sorted.map((t) => {
      balance += t.category === "revenue" ? t.amount : -t.amount;
      return { ...t, balance };
    });
    return withBalance.reverse();
  }, [filtered]);

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const map = new Map<string, { revenue: number; expenses: number }>();
    filtered.forEach((t) => {
      const key = t.date.slice(0, 7); // YYYY-MM
      const existing = map.get(key) ?? { revenue: 0, expenses: 0 };
      if (t.category === "revenue") existing.revenue += t.amount;
      else existing.expenses += t.amount;
      map.set(key, existing);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, data]) => ({ month, ...data }));
  }, [filtered]);

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-[640px]">
      <Education {...EDUCATION.bookkeeping} />
      <h1 className="text-lg font-semibold text-zinc-900">Bookkeeping</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Log transactions, track balances, and view monthly summaries.
      </p>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800"
        >
          + Add Transaction
        </button>
        <span className="text-sm text-zinc-500">
          {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mt-4 border border-zinc-200 rounded-lg p-4 bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Date</label>
              <input
                type="date"
                value={fDate}
                onChange={(e) => setFDate(e.target.value)}
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Category</label>
              <select
                value={fCat}
                onChange={(e) => setFCat(e.target.value as "revenue" | "expense")}
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
              >
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Description</label>
              <input
                value={fDesc}
                onChange={(e) => setFDesc(e.target.value)}
                placeholder="What was this for?"
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Amount ($)</label>
              <input
                type="number"
                value={fAmount}
                onChange={(e) => setFAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Account</label>
              <select
                value={fAccount}
                onChange={(e) => setFAccount(e.target.value)}
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
              >
                {ACCOUNTS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addTransaction}
              className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800"
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as "all" | "revenue" | "expense")}
          className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="all">All Categories</option>
          <option value="revenue">Revenue</option>
          <option value="expense">Expenses</option>
        </select>
        <input
          type="date"
          value={filterStart}
          onChange={(e) => setFilterStart(e.target.value)}
          placeholder="From"
          className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black"
        />
        <input
          type="date"
          value={filterEnd}
          onChange={(e) => setFilterEnd(e.target.value)}
          placeholder="To"
          className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black"
        />
        {(filterCat !== "all" || filterStart || filterEnd) && (
          <button
            onClick={() => {
              setFilterCat("all");
              setFilterStart("");
              setFilterEnd("");
            }}
            className="text-xs text-zinc-500 hover:text-zinc-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Monthly Summary */}
      {monthlySummary.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-zinc-900 mb-3">Monthly Summary</h2>
          <div className="space-y-2">
            {monthlySummary.map((s) => (
              <div
                key={s.month}
                className="border border-zinc-200 rounded-lg p-3 bg-white flex items-center justify-between"
              >
                <span className="text-sm text-zinc-700">
                  {new Date(s.month + "-01").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-zinc-900">+${s.revenue.toLocaleString()}</span>
                  <span className="text-sm text-zinc-500">-${s.expenses.toLocaleString()}</span>
                  <span
                    className={`text-sm font-medium ${
                      s.revenue - s.expenses >= 0 ? "text-zinc-900" : "text-zinc-500"
                    }`}
                  >
                    ${(s.revenue - s.expenses).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="mt-6">
        <h2 className="text-sm font-medium text-zinc-900 mb-3">Transactions</h2>
        {balancedRows.length === 0 && (
          <p className="text-sm text-zinc-400 py-8 text-center">
            No transactions yet. Add your first one above.
          </p>
        )}
        <div className="space-y-1">
          {balancedRows.map((t) => (
            <div
              key={t.id}
              className="border border-zinc-200 rounded-lg p-3 bg-white flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 truncate">
                    {t.description}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      t.category === "revenue"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {t.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-400">{t.date}</span>
                  <span className="text-xs text-zinc-400">{t.account}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-medium ${
                    t.category === "revenue" ? "text-zinc-900" : "text-zinc-500"
                  }`}
                >
                  {t.category === "revenue" ? "+" : "-"}${t.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-400">
                  Bal: ${t.balance.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => deleteTransaction(t.id)}
                className="text-xs text-zinc-300 hover:text-red-600 shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
