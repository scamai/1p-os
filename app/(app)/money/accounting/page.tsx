"use client";

import { useState, useEffect } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

interface LineItem {
  label: string;
  amount: number;
}

interface AccountingData {
  revenue: LineItem[];
  cogs: LineItem[];
  opex: LineItem[];
  assets: LineItem[];
  liabilities: LineItem[];
  equity: LineItem[];
}

const DEFAULT_DATA: AccountingData = {
  revenue: [
    { label: "Product Revenue", amount: 0 },
    { label: "Service Revenue", amount: 0 },
    { label: "Other Income", amount: 0 },
  ],
  cogs: [
    { label: "Hosting / Infrastructure", amount: 0 },
    { label: "API Costs", amount: 0 },
    { label: "Payment Processing Fees", amount: 0 },
  ],
  opex: [
    { label: "Salaries & Contractors", amount: 0 },
    { label: "Software & Tools", amount: 0 },
    { label: "Marketing", amount: 0 },
    { label: "Office & Workspace", amount: 0 },
    { label: "Legal & Accounting", amount: 0 },
    { label: "Insurance", amount: 0 },
    { label: "Travel", amount: 0 },
    { label: "Other Operating Expenses", amount: 0 },
  ],
  assets: [
    { label: "Cash & Bank Accounts", amount: 0 },
    { label: "Accounts Receivable", amount: 0 },
    { label: "Prepaid Expenses", amount: 0 },
    { label: "Equipment", amount: 0 },
    { label: "Other Assets", amount: 0 },
  ],
  liabilities: [
    { label: "Accounts Payable", amount: 0 },
    { label: "Credit Card Balances", amount: 0 },
    { label: "Loans & Notes Payable", amount: 0 },
    { label: "Accrued Expenses", amount: 0 },
    { label: "Deferred Revenue", amount: 0 },
  ],
  equity: [
    { label: "Paid-in Capital", amount: 0 },
    { label: "Retained Earnings", amount: 0 },
  ],
};

function sum(items: LineItem[]) {
  return items.reduce((s, i) => s + i.amount, 0);
}

function fmt(n: number) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString()}`;
}

function pct(part: number, whole: number) {
  if (whole === 0) return "—";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

export default function Page() {
  const [data, setData] = useState<AccountingData>(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"pnl" | "balance">("pnl");

  useEffect(() => {
    const saved = localStorage.getItem("1pos_accounting");
    if (saved) setData(JSON.parse(saved));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("1pos_accounting", JSON.stringify(data));
  }, [data, loaded]);

  function updateItem(
    section: keyof AccountingData,
    index: number,
    value: string
  ) {
    const updated = { ...data };
    updated[section] = [...updated[section]];
    updated[section][index] = {
      ...updated[section][index],
      amount: parseFloat(value) || 0,
    };
    setData(updated);
  }

  function addItem(section: keyof AccountingData) {
    const updated = { ...data };
    updated[section] = [...updated[section], { label: "New Item", amount: 0 }];
    setData(updated);
  }

  function renameItem(section: keyof AccountingData, index: number, label: string) {
    const updated = { ...data };
    updated[section] = [...updated[section]];
    updated[section][index] = { ...updated[section][index], label };
    setData(updated);
  }

  function removeItem(section: keyof AccountingData, index: number) {
    const updated = { ...data };
    updated[section] = updated[section].filter((_, i) => i !== index);
    setData(updated);
  }

  // P&L calculations
  const totalRevenue = sum(data.revenue);
  const totalCogs = sum(data.cogs);
  const grossProfit = totalRevenue - totalCogs;
  const totalOpex = sum(data.opex);
  const netIncome = grossProfit - totalOpex;

  // Balance sheet
  const totalAssets = sum(data.assets);
  const totalLiabilities = sum(data.liabilities);
  const totalEquity = sum(data.equity);

  if (!loaded) return null;

  function Section({
    title,
    section,
    items,
  }: {
    title: string;
    section: keyof AccountingData;
    items: LineItem[];
  }) {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {title}
          </h3>
          <button
            onClick={() => addItem(section)}
            className="text-xs text-slate-400 hover:text-slate-700"
          >
            + Add
          </button>
        </div>
        <div className="space-y-1">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 group"
            >
              <input
                value={item.label}
                onChange={(e) => renameItem(section, i, e.target.value)}
                className="flex-1 text-sm text-slate-700 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-400 focus:outline-none py-1 px-1"
              />
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                <input
                  type="number"
                  value={item.amount || ""}
                  onChange={(e) => updateItem(section, i, e.target.value)}
                  placeholder="0"
                  className="w-28 border border-slate-200 rounded-md pl-5 pr-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <button
                onClick={() => removeItem(section, i)}
                className="text-xs text-slate-300 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <Education {...EDUCATION.accounting} />
      <h1 className="text-lg font-semibold text-slate-900">Accounting</h1>
      <p className="mt-1 text-sm text-slate-500">
        Simple P&L and balance sheet for your business.
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        {(["pnl", "balance"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-md border transition-colors ${
              tab === t
                ? "bg-black text-white border-black"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
            }`}
          >
            {t === "pnl" ? "Profit & Loss" : "Balance Sheet"}
          </button>
        ))}
      </div>

      {tab === "pnl" && (
        <div className="mt-4 border border-slate-200 rounded-lg p-4 bg-white">
          <Section title="Revenue" section="revenue" items={data.revenue} />

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-sm font-medium text-slate-900">Total Revenue</span>
            <span className="text-sm font-medium text-slate-900">{fmt(totalRevenue)}</span>
          </div>

          <Section title="Cost of Goods Sold" section="cogs" items={data.cogs} />

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-sm font-medium text-slate-900">Total COGS</span>
            <span className="text-sm font-medium text-slate-900">{fmt(totalCogs)}</span>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-sm font-semibold text-slate-900">Gross Profit</span>
            <div className="text-right">
              <span className="text-sm font-semibold text-slate-900">{fmt(grossProfit)}</span>
              <span className="text-xs text-slate-500 ml-2">
                {pct(grossProfit, totalRevenue)} margin
              </span>
            </div>
          </div>

          <Section title="Operating Expenses" section="opex" items={data.opex} />

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-sm font-medium text-slate-900">Total OpEx</span>
            <span className="text-sm font-medium text-slate-900">{fmt(totalOpex)}</span>
          </div>

          <div className="mt-4 flex items-center justify-between border-t-2 border-slate-900 pt-3">
            <span className="text-base font-semibold text-slate-900">Net Income</span>
            <div className="text-right">
              <span
                className={`text-base font-semibold ${
                  netIncome >= 0 ? "text-slate-900" : "text-slate-500"
                }`}
              >
                {fmt(netIncome)}
              </span>
              <span className="text-xs text-slate-500 ml-2">
                {pct(netIncome, totalRevenue)} margin
              </span>
            </div>
          </div>
        </div>
      )}

      {tab === "balance" && (
        <div className="mt-4 border border-slate-200 rounded-lg p-4 bg-white">
          <Section title="Assets" section="assets" items={data.assets} />

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-sm font-semibold text-slate-900">Total Assets</span>
            <span className="text-sm font-semibold text-slate-900">{fmt(totalAssets)}</span>
          </div>

          <Section title="Liabilities" section="liabilities" items={data.liabilities} />

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-sm font-semibold text-slate-900">Total Liabilities</span>
            <span className="text-sm font-semibold text-slate-900">{fmt(totalLiabilities)}</span>
          </div>

          <Section title="Equity" section="equity" items={data.equity} />

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-sm font-semibold text-slate-900">Total Equity</span>
            <span className="text-sm font-semibold text-slate-900">{fmt(totalEquity)}</span>
          </div>

          <div className="mt-4 flex items-center justify-between border-t-2 border-slate-900 pt-3">
            <span className="text-base font-semibold text-slate-900">
              Liabilities + Equity
            </span>
            <span className="text-base font-semibold text-slate-900">
              {fmt(totalLiabilities + totalEquity)}
            </span>
          </div>

          {totalAssets !== totalLiabilities + totalEquity && (
            <p className="mt-2 text-xs text-slate-500">
              Note: Assets ({fmt(totalAssets)}) do not equal Liabilities + Equity (
              {fmt(totalLiabilities + totalEquity)}). The balance sheet should balance.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
