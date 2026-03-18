"use client";

import { useState, useMemo } from "react";
import { useTableData } from "@/lib/hooks/useTableData";
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

export default function Page() {
  const { data: transactions, loading, create, remove } = useTableData<Transaction>("transactions");
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState<"all" | "revenue" | "expense">("all");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  // Form state
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10));
  const [fDesc, setFDesc] = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fCat, setFCat] = useState<"revenue" | "expense">("expense");
  const [fAccount, setFAccount] = useState("Checking");

  async function addTransaction() {
    if (!fDesc || !fAmount) return;
    await create({
      date: fDate,
      description: fDesc,
      amount: parseFloat(fAmount) || 0,
      category: fCat,
      account: fAccount,
    } as Partial<Transaction>);
    setFDesc("");
    setFAmount("");
    setShowForm(false);
  }

  async function deleteTransaction(id: string) {
    await remove(id);
  }

  const sorted = useMemo(() => {
    return [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions]);

  const filtered = useMemo(() => {
    return sorted.filter((t) => {
      if (filterCat !== "all" && t.category !== filterCat) return false;
      if (filterStart && t.date < filterStart) return false;
      if (filterEnd && t.date > filterEnd) return false;
      return true;
    });
  }, [sorted, filterCat, filterStart, filterEnd]);

  // Running balance
  const balancedRows = useMemo(() => {
    let balance = 0;
    // Calculate balance from oldest to newest, display newest first
    const chronological = [...filtered].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const withBalance = chronological.map((t) => {
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

  if (loading) return null;

  return (
    <div className="mx-auto max-w-[640px]">
      <Education {...EDUCATION.bookkeeping} />
      <h1 className="text-lg font-semibold text-black">Bookkeeping</h1>
      <p className="mt-1 text-sm text-black/50">
        Log transactions, track balances, and view monthly summaries.
      </p>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-black/80"
        >
          + Add Transaction
        </button>
        <span className="text-sm text-black/50">
          {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mt-4 border border-black/[0.08] rounded-lg p-4 bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-black/50 mb-1">Date</label>
              <input
                type="date"
                value={fDate}
                onChange={(e) => setFDate(e.target.value)}
                className="w-full border border-black/[0.08] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs text-black/50 mb-1">Category</label>
              <select
                value={fCat}
                onChange={(e) => setFCat(e.target.value as "revenue" | "expense")}
                className="w-full border border-black/[0.08] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
              >
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-black/50 mb-1">Description</label>
              <input
                value={fDesc}
                onChange={(e) => setFDesc(e.target.value)}
                placeholder="What was this for?"
                className="w-full border border-black/[0.08] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs text-black/50 mb-1">Amount ($)</label>
              <input
                type="number"
                value={fAmount}
                onChange={(e) => setFAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-black/[0.08] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs text-black/50 mb-1">Account</label>
              <select
                value={fAccount}
                onChange={(e) => setFAccount(e.target.value)}
                className="w-full border border-black/[0.08] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
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
              className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-black/80"
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-black/60 hover:text-black"
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
          className="border border-black/[0.08] rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
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
          className="border border-black/[0.08] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black"
        />
        <input
          type="date"
          value={filterEnd}
          onChange={(e) => setFilterEnd(e.target.value)}
          placeholder="To"
          className="border border-black/[0.08] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black"
        />
        {(filterCat !== "all" || filterStart || filterEnd) && (
          <button
            onClick={() => {
              setFilterCat("all");
              setFilterStart("");
              setFilterEnd("");
            }}
            className="text-xs text-black/50 hover:text-black/70"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Monthly Summary */}
      {monthlySummary.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-black mb-3">Monthly Summary</h2>
          <div className="space-y-2">
            {monthlySummary.map((s) => (
              <div
                key={s.month}
                className="border border-black/[0.08] rounded-lg p-3 bg-white flex items-center justify-between"
              >
                <span className="text-sm text-black/70">
                  {new Date(s.month + "-01").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-black">+${s.revenue.toLocaleString()}</span>
                  <span className="text-sm text-black/50">-${s.expenses.toLocaleString()}</span>
                  <span
                    className={`text-sm font-medium ${
                      s.revenue - s.expenses >= 0 ? "text-black" : "text-black/50"
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
        <h2 className="text-sm font-medium text-black mb-3">Transactions</h2>
        {balancedRows.length === 0 && (
          <p className="text-sm text-black/40 py-8 text-center">
            No transactions yet. Add your first one above.
          </p>
        )}
        <div className="space-y-1">
          {balancedRows.map((t) => (
            <div
              key={t.id}
              className="border border-black/[0.08] rounded-lg p-3 bg-white flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-black truncate">
                    {t.description}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      t.category === "revenue"
                        ? "bg-black text-white"
                        : "bg-black/[0.04] text-black/60"
                    }`}
                  >
                    {t.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-black/40">{t.date}</span>
                  <span className="text-xs text-black/40">{t.account}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-medium ${
                    t.category === "revenue" ? "text-black" : "text-black/50"
                  }`}
                >
                  {t.category === "revenue" ? "+" : "-"}${t.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-black/40">
                  Bal: ${t.balance.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => deleteTransaction(t.id)}
                className="text-xs text-black/30 hover:text-black shrink-0"
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
