"use client";

import { useState, useEffect, useCallback } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";
import { Button } from "@/components/ui/Button";
import { EXCEL_TEMPLATES, type ExcelTemplate } from "@/lib/templates/generate-excel";

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
          <h3 className="text-xs font-medium text-black/50 uppercase tracking-wide">
            {title}
          </h3>
          <button
            onClick={() => addItem(section)}
            className="text-xs text-black/40 hover:text-black/70"
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
                className="flex-1 text-sm text-black/70 bg-transparent border-b border-transparent hover:border-black/[0.08] focus:border-black/40 focus:outline-none py-1 px-1"
              />
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-black/40">$</span>
                <input
                  type="number"
                  value={item.amount || ""}
                  onChange={(e) => updateItem(section, i, e.target.value)}
                  placeholder="0"
                  className="w-28 border border-black/[0.08] rounded-md pl-5 pr-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <button
                onClick={() => removeItem(section, i)}
                className="text-xs text-black/30 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
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
      <h1 className="text-lg font-semibold text-black">Accounting</h1>
      <p className="mt-1 text-sm text-black/50">
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
                : "bg-white text-black/70 border-black/[0.08] hover:border-black/40"
            }`}
          >
            {t === "pnl" ? "Profit & Loss" : "Balance Sheet"}
          </button>
        ))}
      </div>

      {tab === "pnl" && (
        <div className="mt-4 border border-black/[0.08] rounded-lg p-4 bg-white">
          <Section title="Revenue" section="revenue" items={data.revenue} />

          <div className="mt-3 flex items-center justify-between border-t border-black/[0.04] pt-2">
            <span className="text-sm font-medium text-black">Total Revenue</span>
            <span className="text-sm font-medium text-black">{fmt(totalRevenue)}</span>
          </div>

          <Section title="Cost of Goods Sold" section="cogs" items={data.cogs} />

          <div className="mt-3 flex items-center justify-between border-t border-black/[0.04] pt-2">
            <span className="text-sm font-medium text-black">Total COGS</span>
            <span className="text-sm font-medium text-black">{fmt(totalCogs)}</span>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-black/[0.08] pt-3">
            <span className="text-sm font-semibold text-black">Gross Profit</span>
            <div className="text-right">
              <span className="text-sm font-semibold text-black">{fmt(grossProfit)}</span>
              <span className="text-xs text-black/50 ml-2">
                {pct(grossProfit, totalRevenue)} margin
              </span>
            </div>
          </div>

          <Section title="Operating Expenses" section="opex" items={data.opex} />

          <div className="mt-3 flex items-center justify-between border-t border-black/[0.04] pt-2">
            <span className="text-sm font-medium text-black">Total OpEx</span>
            <span className="text-sm font-medium text-black">{fmt(totalOpex)}</span>
          </div>

          <div className="mt-4 flex items-center justify-between border-t-2 border-black pt-3">
            <span className="text-base font-semibold text-black">Net Income</span>
            <div className="text-right">
              <span
                className={`text-base font-semibold ${
                  netIncome >= 0 ? "text-black" : "text-black/50"
                }`}
              >
                {fmt(netIncome)}
              </span>
              <span className="text-xs text-black/50 ml-2">
                {pct(netIncome, totalRevenue)} margin
              </span>
            </div>
          </div>
        </div>
      )}

      {tab === "balance" && (
        <div className="mt-4 border border-black/[0.08] rounded-lg p-4 bg-white">
          <Section title="Assets" section="assets" items={data.assets} />

          <div className="mt-3 flex items-center justify-between border-t border-black/[0.08] pt-3">
            <span className="text-sm font-semibold text-black">Total Assets</span>
            <span className="text-sm font-semibold text-black">{fmt(totalAssets)}</span>
          </div>

          <Section title="Liabilities" section="liabilities" items={data.liabilities} />

          <div className="mt-3 flex items-center justify-between border-t border-black/[0.08] pt-3">
            <span className="text-sm font-semibold text-black">Total Liabilities</span>
            <span className="text-sm font-semibold text-black">{fmt(totalLiabilities)}</span>
          </div>

          <Section title="Equity" section="equity" items={data.equity} />

          <div className="mt-3 flex items-center justify-between border-t border-black/[0.08] pt-3">
            <span className="text-sm font-semibold text-black">Total Equity</span>
            <span className="text-sm font-semibold text-black">{fmt(totalEquity)}</span>
          </div>

          <div className="mt-4 flex items-center justify-between border-t-2 border-black pt-3">
            <span className="text-base font-semibold text-black">
              Liabilities + Equity
            </span>
            <span className="text-base font-semibold text-black">
              {fmt(totalLiabilities + totalEquity)}
            </span>
          </div>

          {totalAssets !== totalLiabilities + totalEquity && (
            <p className="mt-2 text-xs text-black/50">
              Note: Assets ({fmt(totalAssets)}) do not equal Liabilities + Equity (
              {fmt(totalLiabilities + totalEquity)}). The balance sheet should balance.
            </p>
          )}
        </div>
      )}

      {/* Excel Templates */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-black mb-1">Spreadsheet Templates</h2>
        <p className="text-[13px] text-black/50 mb-4">
          Download pre-formatted Excel templates for accounting and financial tracking.
        </p>
        <div className="flex flex-col gap-3">
          {EXCEL_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="border border-black/[0.08] rounded-md bg-white p-4 hover:border-black/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-black">
                    {template.title}
                  </h3>
                  <p className="mt-1 text-[12px] text-black/50 leading-relaxed">
                    {template.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => template.generate()}
                  className="shrink-0"
                >
                  .xlsx
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
