"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { CostTrend } from "@/components/costs/CostTrend";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Invoice {
  id: string;
  client_name: string;
  client_email?: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  description?: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  created_by_agent?: string;
}

interface AgentCost {
  agentId: string;
  name: string;
  role: string;
  spentToday: number;
  spentThisMonth: number;
  dailyBudget: number;
  monthlyBudget: number;
  tasksCompleted: number;
  hoursSaved: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  source: "manual" | "email" | "bank" | "stripe" | "agent";
  recurring: boolean;
  receipt_url?: string;
  vendor?: string;
}

interface Reimbursement {
  id: string;
  person: string;
  description: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  submitted_at: string;
  receipt_url?: string;
}

interface DataSource {
  id: string;
  name: string;
  type: "email" | "bank" | "stripe" | "manual";
  connected: boolean;
  lastSync?: string;
  itemsImported?: number;
}

interface CFOSuggestion {
  id: string;
  type: "save" | "earn" | "warn" | "optimize";
  title: string;
  description: string;
  impact?: string;
  action?: string;
  actionLabel?: string;
  priority: "high" | "medium" | "low";
}

interface CostSummary {
  totalCost: number;
  budgetRemaining: number;
  projectedMonthlyCost: number;
  tokenCount: number;
  requestCount: number;
  tokensSaved: number;
  costSavedByEfficiency: number;
  monthlyBudget: number;
}

interface TrendPoint {
  date: string;
  cost: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusColor(status: string): string {
  switch (status) {
    case "paid": return "bg-emerald-50 text-emerald-700";
    case "sent": return "bg-blue-50 text-blue-700";
    case "overdue": return "bg-red-50 text-red-700";
    case "draft": return "bg-zinc-100 text-zinc-500";
    default: return "bg-zinc-100 text-zinc-500";
  }
}

const ROLE_COLORS: Record<string, string> = {
  operations: "bg-blue-500",
  finance: "bg-emerald-500",
  sales: "bg-amber-500",
  marketing: "bg-purple-500",
  "customer-success": "bg-rose-500",
  product: "bg-cyan-500",
};

// ─── Component ───────────────────────────────────────────────────────────────

function dispatchAppAction(action: string) {
  window.dispatchEvent(new CustomEvent("app-action", { detail: { action } }));
}

interface FinancePageProps {
  onAction?: (action: string) => void;
}

function FinancePage({ onAction }: FinancePageProps) {
  const handleAction = onAction ?? dispatchAppAction;

  // Data state
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [agentCosts, setAgentCosts] = React.useState<AgentCost[]>([]);
  const [costSummary, setCostSummary] = React.useState<CostSummary | null>(null);
  const [trendData, setTrendData] = React.useState<TrendPoint[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [reimbursements, setReimbursements] = React.useState<Reimbursement[]>([]);
  const [dataSources, setDataSources] = React.useState<DataSource[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch all data
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [invoiceRes, costRes, agentRes] = await Promise.all([
          fetch("/api/invoices"),
          fetch("/api/efficiency/cost?view=summary&period=this_month"),
          fetch("/api/efficiency/cost?view=by-agent&period=this_month"),
        ]);

        if (cancelled) return;

        if (invoiceRes.ok) {
          const data = await invoiceRes.json();
          // Mark overdue: sent + past due date
          const now = new Date();
          const processed = (data.invoices ?? data ?? []).map((inv: Invoice) => {
            if (inv.status === "sent" && inv.due_date && new Date(inv.due_date) < now) {
              return { ...inv, status: "overdue" as const };
            }
            return inv;
          });
          setInvoices(processed);
        }

        if (costRes.ok) {
          const data = await costRes.json();
          setCostSummary(data);
        }

        if (agentRes.ok) {
          const data = await agentRes.json();
          const agents = (data.byAgent ?? []).map((a: Record<string, unknown>) => ({
            agentId: a.agentId as string,
            name: a.name as string,
            role: a.role as string,
            spentToday: (a.cost as number) ?? 0,
            spentThisMonth: (a.cost as number) ?? 0,
            dailyBudget: (a.dailyBudget as number) ?? 2,
            monthlyBudget: (a.monthlyBudget as number) ?? 50,
            tasksCompleted: (a.tasks as number) ?? 0,
            hoursSaved: (a.hoursSaved as number) ?? 0,
          }));
          setAgentCosts(agents);
        }
      } catch {
        // Non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Derived metrics
  const revenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const agentSpend = costSummary?.totalCost ?? agentCosts.reduce((s, a) => s + a.spentThisMonth, 0);
  const projectedMonthly = costSummary?.projectedMonthlyCost ?? 0;
  const budgetRemaining = costSummary?.budgetRemaining ?? 0;
  const monthlyBudget = costSummary?.monthlyBudget ?? 500;
  const costSaved = costSummary?.costSavedByEfficiency ?? 0;
  const netProfit = revenue - agentSpend;
  const totalAgentBudget = agentCosts.reduce((s, a) => s + a.monthlyBudget, 0) || monthlyBudget;
  const budgetUsedPct = totalAgentBudget > 0 ? Math.min(100, Math.round((agentSpend / totalAgentBudget) * 100)) : 0;

  const invoiceCount = invoices.length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  // Runrate calculations
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - dayOfMonth;
  const monthProgress = dayOfMonth / daysInMonth;

  const revenueRunrate = monthProgress > 0 ? revenue / monthProgress : 0;
  const annualRevenueRunrate = revenueRunrate * 12;
  const costRunrate = monthProgress > 0 ? agentSpend / monthProgress : 0;
  const annualCostRunrate = costRunrate * 12;
  const profitRunrate = revenueRunrate - costRunrate;
  const annualProfitRunrate = profitRunrate * 12;
  const profitMargin = revenueRunrate > 0 ? (profitRunrate / revenueRunrate) * 100 : 0;

  // Forecast: expected by end of month
  const expectedRevenue = revenueRunrate;
  const expectedCost = costRunrate;
  const expectedProfit = expectedRevenue - expectedCost;
  const pendingIncome = outstanding; // money expected to come in

  // Expenses total
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const recurringExpenses = expenses.filter((e) => e.recurring).reduce((s, e) => s + e.amount, 0);
  const pendingReimbursements = reimbursements.filter((r) => r.status === "pending");
  const pendingReimbursementTotal = pendingReimbursements.reduce((s, r) => s + r.amount, 0);

  // Generate CFO suggestions based on real data
  const cfoSuggestions = React.useMemo(() => {
    const suggestions: CFOSuggestion[] = [];

    if (overdueCount > 0) {
      suggestions.push({
        id: "overdue",
        type: "earn",
        title: `Collect ${formatMoney(overdue)} in overdue invoices`,
        description: `${overdueCount} invoice${overdueCount > 1 ? "s are" : " is"} past due. Send reminders or escalate.`,
        impact: `+${formatMoney(overdue)} cash flow`,
        action: "send_overdue_reminders",
        actionLabel: "Send Reminders",
        priority: "high",
      });
    }

    if (budgetUsedPct > 80) {
      suggestions.push({
        id: "budget-warn",
        type: "warn",
        title: `AI budget at ${budgetUsedPct}% — ${daysRemaining} days left`,
        description: budgetUsedPct >= 95
          ? "You're about to exceed your monthly budget. Consider switching to a savings strategy or pausing non-critical agents."
          : "You're on pace to use your full budget early. Review agent task frequency.",
        impact: formatMoney(totalAgentBudget - agentSpend) + " remaining",
        action: "review_budget",
        actionLabel: "Review Budget",
        priority: budgetUsedPct >= 95 ? "high" : "medium",
      });
    }

    if (costSaved > 0 && costSaved > agentSpend * 0.1) {
      suggestions.push({
        id: "efficiency-win",
        type: "save",
        title: `Efficiency engine saved you ${formatMoney(costSaved)} this month`,
        description: "Smart caching, prompt optimization, and deduplication are working. Consider keeping the balanced strategy.",
        priority: "low",
      });
    }

    const lowROIAgents = agentCosts.filter((a) =>
      a.spentThisMonth > 5 && a.hoursSaved < 1
    );
    if (lowROIAgents.length > 0) {
      suggestions.push({
        id: "low-roi",
        type: "optimize",
        title: `${lowROIAgents.length} agent${lowROIAgents.length > 1 ? "s" : ""} with low ROI`,
        description: `${lowROIAgents.map((a) => a.name).join(", ")} — spending money but saving little time. Consider retraining or reducing their task frequency.`,
        impact: `${formatMoney(lowROIAgents.reduce((s, a) => s + a.spentThisMonth, 0))}/mo at risk`,
        action: "review_agents",
        actionLabel: "Review Agents",
        priority: "medium",
      });
    }

    if (outstanding > revenue * 0.5 && outstanding > 500) {
      suggestions.push({
        id: "cash-flow",
        type: "warn",
        title: "High outstanding-to-revenue ratio",
        description: `${formatMoney(outstanding)} outstanding vs ${formatMoney(revenue)} collected. Consider tightening payment terms or offering early-pay discounts.`,
        priority: "medium",
      });
    }

    if (pendingReimbursementTotal > 0) {
      suggestions.push({
        id: "reimburse",
        type: "warn",
        title: `${formatMoney(pendingReimbursementTotal)} in pending reimbursements`,
        description: `${pendingReimbursements.length} request${pendingReimbursements.length > 1 ? "s" : ""} waiting for approval.`,
        action: "review_reimbursements",
        actionLabel: "Review",
        priority: "medium",
      });
    }

    if (dataSources.every((d) => !d.connected)) {
      suggestions.push({
        id: "connect-sources",
        type: "optimize",
        title: "Connect your accounts for automatic expense tracking",
        description: "Link your email, bank, or Stripe to auto-import receipts, transactions, and invoices. Your AI CFO works better with more data.",
        action: "connect_data_source",
        actionLabel: "Connect Now",
        priority: "high",
      });
    }

    if (profitMargin < 20 && revenue > 0) {
      suggestions.push({
        id: "margin",
        type: "optimize",
        title: `Profit margin is ${profitMargin.toFixed(0)}% — aim for 30%+`,
        description: "Consider raising prices, switching to the savings AI strategy, or reducing non-essential expenses.",
        priority: "medium",
      });
    }

    return suggestions.sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    });
  }, [overdueCount, overdue, budgetUsedPct, daysRemaining, costSaved, agentSpend, agentCosts, outstanding, revenue, pendingReimbursements, pendingReimbursementTotal, dataSources, profitMargin, totalAgentBudget]);

  // Top agents by ROI
  const agentsByROI = [...agentCosts]
    .map((a) => ({ ...a, roi: a.spentThisMonth > 0 ? a.hoursSaved / a.spentThisMonth : 0 }))
    .sort((a, b) => b.roi - a.roi);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-zinc-100" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-lg bg-zinc-100" />)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => <div key={i} className="h-64 rounded-lg bg-zinc-100" />)}
          </div>
        </div>
      </div>
    );
  }

  // ── Section nav ──────────────────────────────────────────────────────────────

  const SECTIONS = [
    { id: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "accounts", label: "Accounts", icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" },
    { id: "expenses", label: "Expenses", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
    { id: "auditing", label: "Auditing", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { id: "tax", label: "Tax Filing", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { id: "controllers", label: "Human Controllers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  ] as const;

  type SectionId = typeof SECTIONS[number]["id"];
  const [activeSection, setActiveSection] = React.useState<SectionId>("overview");

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Finance</h1>
          <p className="text-sm text-zinc-500">Your AI CFO — complete financial control</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            onClick={() => handleAction("new_invoice")}
          >
            + New Invoice
          </button>
        </div>
      </div>

      {/* Section nav */}
      <div className="mt-4 flex items-center gap-1 overflow-x-auto border-b border-zinc-200 pb-px">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-md px-3 py-2 text-xs font-medium transition-colors ${
              activeSection === s.id
                ? "bg-zinc-100 text-zinc-900 border-b-2 border-zinc-900 -mb-px"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d={s.icon} />
            </svg>
            {s.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* OVERVIEW TAB                                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeSection === "overview" && <>

      {/* ── Headline P&L strip ──────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Revenue (MTD)"
          value={formatMoney(revenue)}
          sub={`${paidCount} paid of ${invoiceCount}`}
          trend="up"
        />
        <MetricCard
          label="Outstanding"
          value={formatMoney(outstanding)}
          sub={overdueCount > 0 ? `${overdueCount} overdue` : "All on track"}
          trend={overdueCount > 0 ? "warn" : "neutral"}
        />
        <MetricCard
          label="AI Spend (MTD)"
          value={formatMoney(agentSpend)}
          sub={`${budgetUsedPct}% of budget`}
          trend={budgetUsedPct > 80 ? "warn" : "neutral"}
        />
        <MetricCard
          label="Net Profit"
          value={formatMoney(netProfit)}
          sub={netProfit >= 0 ? "Revenue minus AI costs" : "AI costs exceed revenue"}
          trend={netProfit >= 0 ? "up" : "down"}
        />
      </div>

      {/* ── Budget health bar ───────────────────────────────────────────────── */}
      <div className="mt-4 rounded-lg border border-zinc-200 px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-zinc-700">Monthly AI Budget</span>
          <span className="text-xs font-mono text-zinc-500">
            {formatMoney(agentSpend)} / {formatMoney(totalAgentBudget)}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetUsedPct >= 90 ? "bg-red-500"
              : budgetUsedPct >= 70 ? "bg-amber-500"
              : "bg-emerald-500"
            }`}
            style={{ width: `${budgetUsedPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-400">
          <span>Projected: {formatMoney(projectedMonthly)}/mo</span>
          {costSaved > 0 && <span>Saved {formatMoney(costSaved)} from efficiency</span>}
          <span>{formatMoney(budgetRemaining)} remaining</span>
        </div>
      </div>

      {/* ── Runrate & Forecast ───────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Monthly runrate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Monthly Runrate</h2>
              <span className="text-[9px] text-zinc-400 uppercase tracking-wider">
                Day {dayOfMonth} of {daysInMonth}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <RunrateRow label="Revenue" current={revenue} projected={revenueRunrate} positive />
              <RunrateRow label="AI Costs" current={agentSpend} projected={costRunrate} positive={false} />
              <div className="border-t border-zinc-100 pt-2">
                <RunrateRow label="Net Profit" current={netProfit} projected={profitRunrate} positive={profitRunrate >= 0} bold />
              </div>
              {profitMargin !== 0 && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">Profit margin</span>
                  <span className={`font-mono font-semibold ${profitMargin >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {profitMargin.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            {/* Progress through month */}
            <div className="mt-3">
              <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-zinc-300" style={{ width: `${Math.round(monthProgress * 100)}%` }} />
              </div>
              <p className="mt-1 text-[9px] text-zinc-400 text-right">{daysRemaining} days remaining</p>
            </div>
          </CardContent>
        </Card>

        {/* Annual projection */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Annual Projection</h2>
              <span className="text-[9px] text-zinc-400 uppercase tracking-wider">
                Based on current pace
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Revenue</span>
                <span className="text-xs font-mono font-semibold text-zinc-900">{formatMoney(annualRevenueRunrate)}/yr</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">AI Costs</span>
                <span className="text-xs font-mono text-zinc-700">-{formatMoney(annualCostRunrate)}/yr</span>
              </div>
              <div className="border-t border-zinc-100 pt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">Net Profit</span>
                <span className={`text-sm font-mono font-bold ${annualProfitRunrate >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatMoney(annualProfitRunrate)}/yr
                </span>
              </div>
            </div>

            {/* Pending income callout */}
            {pendingIncome > 0 && (
              <div className="mt-3 rounded-md bg-blue-50 px-3 py-2">
                <p className="text-[10px] font-medium text-blue-700">
                  {formatMoney(pendingIncome)} in outstanding invoices
                </p>
                <p className="text-[9px] text-blue-500">
                  If collected, annual revenue would be {formatMoney(annualRevenueRunrate + pendingIncome * 12)}/yr
                </p>
              </div>
            )}

            {/* Break-even indicator */}
            {agentSpend > 0 && (
              <div className="mt-3 flex items-center justify-between text-[10px]">
                <span className="text-zinc-400">AI cost per $ revenue</span>
                <span className="font-mono text-zinc-700">
                  {revenue > 0 ? `$${(agentSpend / revenue).toFixed(2)}` : "N/A"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Two-column: Invoices + Agent costs ──────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Invoices */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Invoices</h2>
              <button
                onClick={() => handleAction("new_invoice")}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                + New
              </button>
            </div>
            {invoices.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-400">No invoices yet</p>
                <button
                  onClick={() => handleAction("new_invoice")}
                  className="mt-2 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Create your first invoice
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                {invoices.slice(0, 8).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between border-b border-zinc-100 py-2 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-900 truncate">
                          {inv.client_name}
                        </span>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${statusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </div>
                      {inv.description && (
                        <p className="text-[10px] text-zinc-400 truncate">{inv.description}</p>
                      )}
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      <p className="text-xs font-mono font-semibold text-zinc-900">
                        ${inv.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-400">
                        {formatDate(inv.due_date ?? inv.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Invoice summary bar */}
            {invoices.length > 0 && (
              <div className="mt-3 flex items-center gap-3 border-t border-zinc-100 pt-2">
                <SummaryPill label="Paid" value={formatMoney(revenue)} className="text-emerald-700 bg-emerald-50" />
                {outstanding > 0 && <SummaryPill label="Owed" value={formatMoney(outstanding)} className="text-blue-700 bg-blue-50" />}
                {overdue > 0 && <SummaryPill label="Overdue" value={formatMoney(overdue)} className="text-red-700 bg-red-50" />}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent costs */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Agent Costs</h2>
              <span className="text-[10px] font-mono text-zinc-400">
                {agentCosts.length} agents
              </span>
            </div>
            {agentCosts.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">No agent cost data yet</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {agentsByROI.map((agent) => {
                  const pct = agent.monthlyBudget > 0
                    ? Math.min(100, Math.round((agent.spentThisMonth / agent.monthlyBudget) * 100))
                    : 0;
                  const roleColor = ROLE_COLORS[agent.role] ?? "bg-zinc-500";

                  return (
                    <div key={agent.agentId} className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${roleColor} text-white text-[10px] font-bold`}>
                        {agent.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-900 truncate">{agent.name}</span>
                          <span className="text-xs font-mono text-zinc-700">{formatMoney(agent.spentThisMonth)}</span>
                        </div>
                        <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-zinc-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[9px] text-zinc-400">
                          <span>{agent.tasksCompleted} tasks</span>
                          {agent.hoursSaved > 0 && <span>{agent.hoursSaved.toFixed(1)}h saved</span>}
                          <span className="ml-auto">{pct}% of {formatMoney(agent.monthlyBudget)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      </>}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ACCOUNTS TAB (Invoices + Agent Costs + Data Sources)               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeSection === "accounts" && <>

      {/* ── AI CFO Suggestions ──────────────────────────────────────────────── */}
      {cfoSuggestions.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900">
              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-zinc-900">AI CFO Recommendations</h2>
          </div>
          <div className="flex flex-col gap-2">
            {cfoSuggestions.map((s) => (
              <div
                key={s.id}
                className={`rounded-lg border px-4 py-3 ${
                  s.priority === "high" ? "border-amber-200 bg-amber-50/50"
                  : "border-zinc-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    s.type === "earn" ? "bg-emerald-100 text-emerald-600"
                    : s.type === "save" ? "bg-blue-100 text-blue-600"
                    : s.type === "warn" ? "bg-amber-100 text-amber-600"
                    : "bg-zinc-100 text-zinc-600"
                  }`}>
                    {s.type === "earn" && <DollarIcon />}
                    {s.type === "save" && <PiggyIcon />}
                    {s.type === "warn" && <AlertIcon />}
                    {s.type === "optimize" && <WrenchIcon />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900">{s.title}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{s.description}</p>
                    {s.impact && (
                      <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-medium text-zinc-600">
                        Impact: {s.impact}
                      </span>
                    )}
                  </div>
                  {s.actionLabel && (
                    <button
                      onClick={() => handleAction(s.action ?? "")}
                      className="shrink-0 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      {s.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Expenses & Reimbursements ────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Expenses */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Expenses</h2>
              <button
                onClick={() => handleAction("log_expense")}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                + Log Expense
              </button>
            </div>
            {expenses.length === 0 ? (
              <div className="py-6 text-center">
                <svg className="mx-auto h-8 w-8 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
                <p className="mt-2 text-xs text-zinc-400">No expenses tracked yet</p>
                <p className="mt-1 text-[10px] text-zinc-400">Connect your email or bank to auto-import, or log manually</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleAction("connect_email_expenses")}
                    className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Connect Email
                  </button>
                  <button
                    onClick={() => handleAction("connect_bank")}
                    className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Connect Bank
                  </button>
                  <button
                    onClick={() => handleAction("log_expense")}
                    className="rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] text-white hover:bg-zinc-800 transition-colors"
                  >
                    Log Manually
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col">
                  {expenses.slice(0, 8).map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between border-b border-zinc-100 py-2 last:border-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-zinc-900 truncate">{exp.description}</span>
                          <SourceBadge source={exp.source} />
                          {exp.recurring && (
                            <span className="text-[8px] text-zinc-400 bg-zinc-100 rounded px-1 py-0.5">recurring</span>
                          )}
                        </div>
                        {exp.vendor && <p className="text-[10px] text-zinc-400">{exp.vendor}</p>}
                      </div>
                      <span className="ml-3 text-xs font-mono text-zinc-700">-{formatMoney(exp.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-zinc-200 pt-2">
                  <span className="text-[10px] text-zinc-400">
                    {expenses.length} expenses &middot; {formatMoney(recurringExpenses)}/mo recurring
                  </span>
                  <span className="text-xs font-mono font-semibold text-zinc-900">
                    {formatMoney(totalExpenses)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reimbursements */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Reimbursements</h2>
              <button
                onClick={() => handleAction("new_reimbursement")}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                + Request
              </button>
            </div>
            {reimbursements.length === 0 ? (
              <div className="py-6 text-center">
                <svg className="mx-auto h-8 w-8 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="mt-2 text-xs text-zinc-400">No reimbursement requests</p>
                <p className="mt-1 text-[10px] text-zinc-400">Track team expenses and contractor reimbursements</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {reimbursements.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border-b border-zinc-100 py-2 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-900">{r.person}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                          r.status === "paid" ? "bg-emerald-50 text-emerald-700"
                          : r.status === "approved" ? "bg-blue-50 text-blue-700"
                          : r.status === "rejected" ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">{r.description}</p>
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      <p className="text-xs font-mono text-zinc-700">{formatMoney(r.amount)}</p>
                      <p className="text-[10px] text-zinc-400">{formatDate(r.submitted_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Data Sources (Connect email, bank, etc.) ─────────────────────────── */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Data Sources</h2>
              <p className="text-[10px] text-zinc-400">Connect accounts for automatic expense & income tracking</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <DataSourceCard
              icon={<MailIcon />}
              name="Email Receipts"
              description="Auto-scan Gmail/Outlook for receipts & invoices"
              connected={dataSources.some((d) => d.type === "email" && d.connected)}
              lastSync={dataSources.find((d) => d.type === "email")?.lastSync}
              items={dataSources.find((d) => d.type === "email")?.itemsImported}
              onConnect={() => handleAction("connect_email_expenses")}
            />
            <DataSourceCard
              icon={<BankIcon />}
              name="Bank Account"
              description="Import transactions via Plaid or Teller"
              connected={dataSources.some((d) => d.type === "bank" && d.connected)}
              lastSync={dataSources.find((d) => d.type === "bank")?.lastSync}
              items={dataSources.find((d) => d.type === "bank")?.itemsImported}
              onConnect={() => handleAction("connect_bank")}
            />
            <DataSourceCard
              icon={<StripeIcon />}
              name="Stripe"
              description="Auto-track payments, fees, and payouts"
              connected={dataSources.some((d) => d.type === "stripe" && d.connected)}
              lastSync={dataSources.find((d) => d.type === "stripe")?.lastSync}
              items={dataSources.find((d) => d.type === "stripe")?.itemsImported}
              onConnect={() => handleAction("connect_stripe")}
            />
            <DataSourceCard
              icon={<ClipboardIcon />}
              name="Manual Entry"
              description="Log expenses, receipts, and reimbursements"
              connected={true}
              onConnect={() => handleAction("log_expense")}
              alwaysAvailable
            />
          </div>
        </CardContent>
      </Card>

      </>}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* EXPENSES TAB                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeSection === "expenses" && <>
      <div className="mt-6">
        {/* Spending Trend */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Spending Trend</h2>
            <CostTrend data={trendData} budgetLine={totalAgentBudget / 30} />
          </CardContent>
        </Card>

        {/* ROI + Quick stats */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-zinc-700 mb-2">Best ROI Agents</h3>
              {agentsByROI.slice(0, 3).map((a, i) => (
                <div key={a.agentId} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 w-3">{i + 1}.</span>
                    <span className="text-xs text-zinc-900">{a.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">{a.roi.toFixed(1)} hrs/$</span>
                </div>
              ))}
              {agentsByROI.length === 0 && <p className="text-[10px] text-zinc-400">No data yet</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-zinc-700 mb-2">This Month</h3>
              <div className="flex flex-col gap-1.5">
                <QuickStat label="Total requests" value={String(costSummary?.requestCount ?? 0)} />
                <QuickStat label="Tokens used" value={(costSummary?.tokenCount ?? 0).toLocaleString()} />
                <QuickStat label="Tokens saved" value={(costSummary?.tokensSaved ?? 0).toLocaleString()} />
                <QuickStat label="Tasks completed" value={String(agentCosts.reduce((s, a) => s + a.tasksCompleted, 0))} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-zinc-700 mb-2">Time Saved</h3>
              <div className="flex flex-col items-center justify-center py-2">
                <span className="text-2xl font-bold text-zinc-900">{agentCosts.reduce((s, a) => s + a.hoursSaved, 0).toFixed(1)}h</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">estimated hours saved this month</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </>}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* AUDITING TAB                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeSection === "auditing" && <>
      <div className="mt-6 flex flex-col gap-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-zinc-900 mb-1">Audit Trail</h2>
            <p className="text-[11px] text-zinc-500 mb-4">Every financial action by every agent is logged and reviewable.</p>

            <div className="flex flex-col gap-2">
              {[
                { type: "Agent Action", desc: "Every AI decision logged with cost, model, input/output", status: "active" },
                { type: "Invoice Audit", desc: "Creation, edits, sends, and payment events tracked", status: "active" },
                { type: "Budget Changes", desc: "All budget modifications with who/when/why", status: "active" },
                { type: "Expense Verification", desc: "Auto-match receipts to transactions", status: "coming" },
                { type: "Compliance Reports", desc: "Generate SOC2/GDPR-ready audit exports", status: "coming" },
              ].map((item) => (
                <div key={item.type} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-medium text-zinc-900">{item.type}</p>
                    <p className="text-[10px] text-zinc-500">{item.desc}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                    item.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {item.status === "active" ? "Active" : "Coming soon"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-zinc-900 mb-1">Export & Reports</h2>
            <p className="text-[11px] text-zinc-500 mb-4">Download your financial data for external review.</p>
            <div className="flex flex-wrap gap-2">
              {["Audit Log (CSV)", "Agent Costs (CSV)", "Invoices (CSV)", "P&L Statement (PDF)", "Tax Summary (PDF)"].map((label) => (
                <button
                  key={label}
                  onClick={() => handleAction(`export_${label.toLowerCase().replace(/[^a-z]/g, "_")}`)}
                  className="rounded-md border border-zinc-200 px-3 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </>}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAX FILING TAB                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeSection === "tax" && <>
      <div className="mt-6 flex flex-col gap-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-zinc-900 mb-1">Tax Overview</h2>
            <p className="text-[11px] text-zinc-500 mb-4">AI-assisted tax preparation and filing. Requires human approval for all submissions.</p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-[10px] text-zinc-500">Est. Annual Revenue</p>
                <p className="mt-1 text-sm font-mono font-bold text-zinc-900">{formatMoney(annualRevenueRunrate)}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-[10px] text-zinc-500">Est. Deductions</p>
                <p className="mt-1 text-sm font-mono font-bold text-zinc-900">{formatMoney(annualCostRunrate + totalExpenses * 12)}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-[10px] text-zinc-500">Est. Taxable Income</p>
                <p className="mt-1 text-sm font-mono font-bold text-zinc-900">{formatMoney(Math.max(0, annualProfitRunrate - totalExpenses * 12))}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-[10px] text-zinc-500">Est. Tax (25%)</p>
                <p className="mt-1 text-sm font-mono font-bold text-zinc-900">{formatMoney(Math.max(0, (annualProfitRunrate - totalExpenses * 12) * 0.25))}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { label: "Quarterly Estimates (1040-ES)", due: "Apr 15, Jun 15, Sep 15, Jan 15", status: "upcoming" },
                { label: "Annual Return (Schedule C)", due: "Apr 15", status: "not_started" },
                { label: "State Tax Filing", due: "Varies by state", status: "not_started" },
                { label: "1099 Generation", due: "Jan 31 (for contractors)", status: "not_started" },
                { label: "Sales Tax", due: "Monthly/Quarterly", status: "na" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-medium text-zinc-900">{item.label}</p>
                    <p className="text-[10px] text-zinc-500">Due: {item.due}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                    item.status === "upcoming" ? "bg-amber-50 text-amber-700"
                    : item.status === "na" ? "bg-zinc-100 text-zinc-400"
                    : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {item.status === "upcoming" ? "Upcoming" : item.status === "na" ? "N/A" : "Not started"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-800">Tax filing requires human approval</p>
              <p className="text-[10px] text-amber-600 mt-0.5">
                Your AI CFO can prepare returns and estimates, but all filings must be reviewed and approved by you or your accountant before submission.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </>}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* HUMAN CONTROLLERS TAB                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeSection === "controllers" && <>
      <div className="mt-6 flex flex-col gap-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-zinc-900 mb-1">Human Controllers</h2>
            <p className="text-[11px] text-zinc-500 mb-4">
              Add external accountants, bookkeepers, or advisors who can review, approve, and override AI financial decisions.
            </p>

            {/* Existing controllers */}
            <div className="flex flex-col gap-2 mb-4">
              {[
                { role: "Primary Owner", name: "You", access: "Full control", type: "owner" as const },
              ].map((c) => (
                <div key={c.role} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-900">{c.name}</p>
                      <p className="text-[10px] text-zinc-500">{c.role} &middot; {c.access}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-700">Active</span>
                </div>
              ))}
            </div>

            {/* Add controller */}
            <h3 className="text-xs font-semibold text-zinc-700 mb-2">Add a Human Controller</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                {
                  role: "Accountant / CPA",
                  desc: "Review books, approve tax filings, run audits",
                  permissions: ["View all finances", "Approve tax filings", "Generate reports", "Override agent decisions"],
                  icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
                },
                {
                  role: "Bookkeeper",
                  desc: "Categorize expenses, reconcile accounts, manage receipts",
                  permissions: ["View expenses", "Categorize transactions", "Upload receipts", "Run reconciliation"],
                  icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                },
                {
                  role: "Financial Advisor",
                  desc: "Review projections, approve major expenses, strategic planning",
                  permissions: ["View all finances", "Approve budgets >$500", "Review projections", "Advisory notes"],
                  icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
                },
                {
                  role: "Tax Preparer",
                  desc: "Prepare and file tax returns, manage compliance deadlines",
                  permissions: ["View revenue & expenses", "Generate tax forms", "File returns (with approval)", "Manage deadlines"],
                  icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                },
              ].map((ctrl) => (
                <div key={ctrl.role} className="rounded-lg border border-dashed border-zinc-300 p-3 hover:border-zinc-400 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d={ctrl.icon} />
                    </svg>
                    <p className="text-xs font-semibold text-zinc-900">{ctrl.role}</p>
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-2">{ctrl.desc}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {ctrl.permissions.map((p) => (
                      <span key={p} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[8px] text-zinc-500">{p}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAction(`invite_${ctrl.role.toLowerCase().replace(/[^a-z]/g, "_")}`)}
                    className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    Invite {ctrl.role}
                  </button>
                </div>
              ))}
            </div>

            {/* 3rd party integrations */}
            <h3 className="text-xs font-semibold text-zinc-700 mt-6 mb-2">Connect to Accounting Software</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { name: "QuickBooks", status: "available" },
                { name: "Xero", status: "available" },
                { name: "FreshBooks", status: "available" },
                { name: "Wave", status: "available" },
                { name: "Bench", status: "coming" },
                { name: "Pilot", status: "coming" },
                { name: "Finta", status: "coming" },
                { name: "Mercury", status: "coming" },
              ].map((sw) => (
                <button
                  key={sw.name}
                  onClick={() => handleAction(`connect_${sw.name.toLowerCase()}`)}
                  disabled={sw.status === "coming"}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    sw.status === "coming"
                      ? "border-zinc-100 text-zinc-400 cursor-not-allowed"
                      : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {sw.name}
                  {sw.status === "coming" && <span className="block text-[8px] text-zinc-400 mt-0.5">coming soon</span>}
                </button>
              ))}
            </div>

            {/* Approval rules */}
            <h3 className="text-xs font-semibold text-zinc-700 mt-6 mb-2">Approval Rules</h3>
            <p className="text-[10px] text-zinc-500 mb-3">Set thresholds for when human review is required.</p>
            <div className="flex flex-col gap-1.5">
              {[
                { rule: "Invoice send", threshold: "Always require approval", gate: "human_gate" },
                { rule: "Expense over $100", threshold: "Requires accountant review", gate: "accountant" },
                { rule: "Tax filing", threshold: "Always require CPA approval", gate: "cpa" },
                { rule: "Budget change", threshold: "Owner approval required", gate: "owner" },
                { rule: "Payment over $500", threshold: "2-person approval", gate: "dual" },
              ].map((r) => (
                <div key={r.rule} className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                  <span className="text-xs text-zinc-900">{r.rule}</span>
                  <span className="text-[10px] text-zinc-500">{r.threshold}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </>}

    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  trend: "up" | "down" | "warn" | "neutral";
}) {
  const trendIcon = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : trend === "warn" ? "text-amber-600" : "text-zinc-400";
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-xl font-bold font-mono text-zinc-900">{value}</p>
        <p className={`mt-0.5 text-[10px] ${trendIcon}`}>{sub}</p>
      </CardContent>
    </Card>
  );
}

function SummaryPill({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${className}`}>
      {label}: {value}
    </span>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono text-zinc-900">{value}</span>
    </div>
  );
}

function RunrateRow({
  label,
  current,
  projected,
  positive,
  bold,
}: {
  label: string;
  current: number;
  projected: number;
  positive: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${bold ? "font-semibold text-zinc-900" : "text-zinc-500"}`}>{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-zinc-400">{formatMoney(current)} so far</span>
        <svg className="h-3 w-3 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <span className={`text-xs font-mono font-semibold ${
          bold
            ? positive ? "text-emerald-600" : "text-red-600"
            : "text-zinc-900"
        }`}>
          {formatMoney(projected)}
        </span>
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const config: Record<string, { label: string; className: string }> = {
    email: { label: "email", className: "bg-purple-50 text-purple-600" },
    bank: { label: "bank", className: "bg-blue-50 text-blue-600" },
    stripe: { label: "stripe", className: "bg-indigo-50 text-indigo-600" },
    agent: { label: "agent", className: "bg-zinc-100 text-zinc-600" },
    manual: { label: "manual", className: "bg-zinc-100 text-zinc-400" },
  };
  const c = config[source] ?? config.manual;
  return (
    <span className={`rounded px-1 py-0.5 text-[8px] font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

function DataSourceCard({
  icon,
  name,
  description,
  connected,
  lastSync,
  items,
  onConnect,
  alwaysAvailable,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  connected: boolean;
  lastSync?: string;
  items?: number;
  onConnect: () => void;
  alwaysAvailable?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 transition-colors ${connected ? "border-emerald-200 bg-emerald-50/30" : "border-zinc-200"}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="text-zinc-400">{icon}</div>
        <span className="text-xs font-medium text-zinc-900">{name}</span>
        {connected && !alwaysAvailable && (
          <span className="ml-auto inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        )}
      </div>
      <p className="text-[10px] text-zinc-400 mb-2">{description}</p>
      {connected && lastSync && (
        <p className="text-[9px] text-zinc-400 mb-1.5">
          Synced {lastSync} &middot; {items ?? 0} items
        </p>
      )}
      <button
        onClick={onConnect}
        className={`w-full rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
          connected && !alwaysAvailable
            ? "border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
            : "bg-zinc-900 text-white hover:bg-zinc-800"
        }`}
      >
        {connected && !alwaysAvailable ? "Settings" : alwaysAvailable ? "Add Entry" : "Connect"}
      </button>
    </div>
  );
}

// Icons for CFO suggestions
function DollarIcon() {
  return <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function PiggyIcon() {
  return <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
}
function AlertIcon() {
  return <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>;
}
function WrenchIcon() {
  return <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}

// Data source icons
function MailIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function BankIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
}
function StripeIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
}
function ClipboardIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
}

export { FinancePage };
