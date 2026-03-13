"use client";

import * as React from "react";
import { TabBar } from "@/components/shared/TabBar";

const TABS = ["Overview", "Invoices", "Expenses", "Agent Costs"] as const;
type FinanceTab = (typeof TABS)[number];

const INVOICES = [
  { id: "1", client: "Acme Corp", amount: 4500, status: "Paid", date: "Mar 1", note: "Monthly retainer" },
  { id: "2", client: "Globex Inc", amount: 2800, status: "Outstanding", date: "Mar 15", note: "Proposal sent by Sales Agent" },
  { id: "3", client: "Initech", amount: 1200, status: "Overdue", date: "Feb 28", note: "Follow-up sent automatically" },
  { id: "4", client: "Umbrella LLC", amount: 6000, status: "Draft", date: "Apr 1", note: "Drafted by Sales Agent — needs review" },
];

const EXPENSES = [
  { id: "1", description: "Claude API (all agents)", amount: 42.50, date: "Mar 12", recurring: true },
  { id: "2", description: "Vercel Pro hosting", amount: 20.00, date: "Mar 1", recurring: true },
  { id: "3", description: "Domain renewal (1pos.ai)", amount: 14.99, date: "Mar 5", recurring: false },
  { id: "4", description: "Stripe fees", amount: 32.40, date: "Mar 12", recurring: true },
];

const AGENT_COSTS = [
  { name: "Sales Agent", today: 0.45, month: 18.40, limit: 50, tasks: 12 },
  { name: "Support Agent", today: 0.32, month: 12.20, limit: 50, tasks: 28 },
  { name: "Content Agent", today: 0.18, month: 42.50, limit: 50, tasks: 8 },
  { name: "Ops Agent", today: 0.08, month: 3.40, limit: 50, tasks: 6 },
];

function OverviewTab() {
  const totalRevenue = INVOICES.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const outstanding = INVOICES.filter(i => i.status === "Outstanding" || i.status === "Overdue").reduce((s, i) => s + i.amount, 0);
  const totalExpenses = EXPENSES.reduce((s, e) => s + e.amount, 0);
  const totalAgentCost = AGENT_COSTS.reduce((s, a) => s + a.month, 0);

  const metrics = [
    { label: "Revenue (MTD)", value: `$${totalRevenue.toLocaleString()}` },
    { label: "Outstanding", value: `$${outstanding.toLocaleString()}` },
    { label: "Expenses (MTD)", value: `$${totalExpenses.toFixed(2)}` },
    { label: "Agent Costs (MTD)", value: `$${totalAgentCost.toFixed(2)}` },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="text-[11px] text-zinc-500">{m.label}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Profit summary */}
      <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Net Profit (MTD)</span>
          <span className="font-mono text-sm font-semibold text-zinc-900">
            ${(totalRevenue - totalExpenses - totalAgentCost).toFixed(2)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-400">
          Revenue minus expenses and agent costs
        </p>
      </div>
    </div>
  );
}

function InvoicesTab({ onAction }: { onAction: (action: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button
          className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900"
          onClick={() => onAction("new_invoice")}
        >
          + New Invoice
        </button>
      </div>
      <div className="flex flex-col">
        {INVOICES.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-0"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-zinc-900">{inv.client}</p>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  inv.status === "Paid" ? "bg-zinc-100 text-zinc-600" :
                  inv.status === "Overdue" ? "bg-zinc-200 text-zinc-700" :
                  inv.status === "Draft" ? "bg-zinc-50 text-zinc-400" :
                  "bg-zinc-100 text-zinc-500"
                }`}>
                  {inv.status}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-400">{inv.note}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[13px] text-zinc-900">${inv.amount.toLocaleString()}</p>
              <p className="font-mono text-[11px] text-zinc-400">{inv.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpensesTab({ onAction }: { onAction: (action: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button
          className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900"
          onClick={() => onAction("new_expense")}
        >
          + Log Expense
        </button>
      </div>
      <div className="flex flex-col">
        {EXPENSES.map((exp) => (
          <div
            key={exp.id}
            className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-0"
          >
            <div>
              <p className="text-[13px] text-zinc-900">{exp.description}</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                {exp.date}{exp.recurring ? " · Recurring" : ""}
              </p>
            </div>
            <p className="font-mono text-[13px] text-zinc-900">
              ${exp.amount.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
        <span className="text-xs text-zinc-500">Total</span>
        <span className="font-mono text-sm font-medium text-zinc-900">
          ${EXPENSES.reduce((s, e) => s + e.amount, 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function AgentCostsTab() {
  const totalMonth = AGENT_COSTS.reduce((s, a) => s + a.month, 0);
  const totalLimit = AGENT_COSTS.reduce((s, a) => s + a.limit, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Global budget bar */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-zinc-500">Global Budget</p>
          <p className="font-mono text-[11px] text-zinc-500">
            ${totalMonth.toFixed(2)} / ${totalLimit}/mo
          </p>
        </div>
        <div className="mt-2 h-[2px] overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all"
            style={{ width: `${Math.round((totalMonth / totalLimit) * 100)}%` }}
          />
        </div>
      </div>

      {/* Per-agent breakdown */}
      <div className="flex flex-col gap-4">
        {AGENT_COSTS.map((a) => {
          const pct = Math.round((a.month / a.limit) * 100);
          return (
            <div key={a.name} className="rounded-lg border border-zinc-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-zinc-900">{a.name}</p>
                <p className="font-mono text-[11px] text-zinc-500">{pct}% used</p>
              </div>
              <div className="mt-2 h-[2px] overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-900/60 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center gap-4 text-[11px] text-zinc-400">
                <span>${a.today.toFixed(2)} today</span>
                <span>${a.month.toFixed(2)} / ${a.limit} mo</span>
                <span>{a.tasks} tasks</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function dispatchAppAction(action: string) {
  window.dispatchEvent(new CustomEvent("app-action", { detail: { action } }));
}

interface FinancePageProps {
  onAction?: (action: string) => void;
}

function FinancePage({ onAction }: FinancePageProps) {
  const [activeTab, setActiveTab] = React.useState<FinanceTab>("Overview");
  const handleAction = onAction ?? dispatchAppAction;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-lg font-semibold text-zinc-900">Finance</h1>
      <div className="mt-6">
        <TabBar
          tabs={TABS as unknown as string[]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as FinanceTab)}
        />
      </div>
      <div className="mt-8">
        {activeTab === "Overview" && <OverviewTab />}
        {activeTab === "Invoices" && <InvoicesTab onAction={handleAction} />}
        {activeTab === "Expenses" && <ExpensesTab onAction={handleAction} />}
        {activeTab === "Agent Costs" && <AgentCostsTab />}
      </div>
    </div>
  );
}

export { FinancePage };
