"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionType = "task" | "decision" | "email" | "cost" | "error";
type EntryStatus = "success" | "error" | "escalation";
type DateRange = "today" | "yesterday" | "last7" | "last30" | "custom";

interface AuditEntry {
  id: string;
  timestamp: string;
  agentName: string;
  agentStatus: "active" | "idle" | "paused" | "error";
  actionType: ActionType;
  description: string;
  linkedGoal: string | null;
  cost: number;
  model: string;
  status: EntryStatus;
  // expanded detail
  inputSummary: string;
  outputSummary: string;
  tokensUsed: number;
  contextAccessed: string[];
}

// ---------------------------------------------------------------------------
// Mock data generator
// ---------------------------------------------------------------------------

function daysAgo(n: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const MOCK_ENTRIES: AuditEntry[] = [
  // Today
  { id: "ae-01", timestamp: daysAgo(0, 9, 15), agentName: "Sales Agent", agentStatus: "active", actionType: "task", description: "Qualified 4 inbound leads from landing page form", linkedGoal: "Acquire first 50 paying customers", cost: 0.12, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "4 new form submissions from landing page", outputSummary: "Scored leads: 2 high-intent, 1 medium, 1 low. High-intent leads added to outreach queue.", tokensUsed: 2840, contextAccessed: ["leads_table", "scoring_rubric", "company_profile"] },
  { id: "ae-02", timestamp: daysAgo(0, 9, 2), agentName: "CEO", agentStatus: "active", actionType: "decision", description: "Escalated: Approve partnership proposal from Globex ($5,000 deal)", linkedGoal: "Build a profitable SaaS reaching $10k MRR", cost: 0.04, model: "claude-sonnet-4-20250514", status: "escalation", inputSummary: "Partnership proposal from Globex Corp, $5,000 annual deal", outputSummary: "Flagged for human review: deal value exceeds auto-approval threshold ($1,000)", tokensUsed: 1520, contextAccessed: ["proposals", "approval_policy", "deal_history"] },
  { id: "ae-03", timestamp: daysAgo(0, 8, 45), agentName: "Support Agent", agentStatus: "idle", actionType: "email", description: "Sent resolution email to customer re: billing discrepancy", linkedGoal: "Reduce churn below 5%", cost: 0.03, model: "claude-haiku-4-20250514", status: "success", inputSummary: "Customer ticket #1042: billing charged twice for March", outputSummary: "Confirmed duplicate charge, issued refund confirmation email with receipt", tokensUsed: 890, contextAccessed: ["tickets", "billing_records", "email_templates"] },
  { id: "ae-04", timestamp: daysAgo(0, 8, 30), agentName: "Finance Agent", agentStatus: "active", actionType: "cost", description: "Reconciled Stripe payouts for March 1-14", linkedGoal: "Keep burn rate under $500/mo", cost: 0.18, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "14 days of Stripe payout data, 23 transactions", outputSummary: "All transactions matched. Total revenue: $3,420. Net after fees: $3,287.40", tokensUsed: 3100, contextAccessed: ["stripe_payouts", "accounting_ledger", "reconciliation_rules"] },
  { id: "ae-05", timestamp: daysAgo(0, 8, 12), agentName: "Content Agent", agentStatus: "paused", actionType: "error", description: "Failed to publish blog post — API rate limit exceeded", linkedGoal: null, cost: 0.02, model: "claude-haiku-4-20250514", status: "error", inputSummary: "Draft blog post: '5 Ways AI Saves Solo Founders Time'", outputSummary: "Error: WordPress API returned 429 Too Many Requests. Post saved as draft.", tokensUsed: 450, contextAccessed: ["blog_drafts", "wordpress_api"] },
  { id: "ae-06", timestamp: daysAgo(0, 7, 55), agentName: "Admin Agent", agentStatus: "active", actionType: "task", description: "Updated team availability calendar for next week", linkedGoal: null, cost: 0.01, model: "claude-haiku-4-20250514", status: "success", inputSummary: "Weekly schedule sync request", outputSummary: "Calendar updated: 3 meetings scheduled, 2 blocks reserved for deep work", tokensUsed: 620, contextAccessed: ["calendar_api", "team_schedule"] },

  // Yesterday
  { id: "ae-07", timestamp: daysAgo(1, 17, 30), agentName: "Sales Agent", agentStatus: "active", actionType: "email", description: "Sent cold outreach email batch #3 to 15 prospects", linkedGoal: "Run outbound email campaign to 200 prospects", cost: 0.22, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "15 prospects from LinkedIn scrape batch #3", outputSummary: "15 personalized emails sent. Avg personalization score: 8.2/10", tokensUsed: 4200, contextAccessed: ["prospect_list", "email_sequences", "company_research"] },
  { id: "ae-08", timestamp: daysAgo(1, 16, 45), agentName: "Finance Agent", agentStatus: "active", actionType: "task", description: "Generated invoice #INV-2024-031 for Initech ($2,400)", linkedGoal: "Keep burn rate under $500/mo", cost: 0.08, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "Monthly retainer invoice for Initech, March billing cycle", outputSummary: "Invoice generated and queued for delivery. Payment terms: Net 15", tokensUsed: 1680, contextAccessed: ["clients", "invoicing_templates", "billing_schedule"] },
  { id: "ae-09", timestamp: daysAgo(1, 15, 20), agentName: "CEO", agentStatus: "active", actionType: "decision", description: "Approved: Increase Support Agent daily budget to $3", linkedGoal: null, cost: 0.03, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "Support Agent requested budget increase due to ticket surge", outputSummary: "Approved: daily budget $2 -> $3. Monthly cap remains $50", tokensUsed: 980, contextAccessed: ["agent_budgets", "spending_history", "safety_config"] },
  { id: "ae-10", timestamp: daysAgo(1, 14, 10), agentName: "Support Agent", agentStatus: "idle", actionType: "task", description: "Resolved 5 support tickets (avg response time: 3.2 min)", linkedGoal: "Reduce churn below 5%", cost: 0.15, model: "claude-haiku-4-20250514", status: "success", inputSummary: "5 open tickets: 2 billing, 2 feature requests, 1 bug report", outputSummary: "All resolved. 2 billing issues credited, 2 feature requests logged, 1 bug escalated to dev", tokensUsed: 2100, contextAccessed: ["tickets", "knowledge_base", "product_docs"] },
  { id: "ae-11", timestamp: daysAgo(1, 12, 0), agentName: "Content Agent", agentStatus: "paused", actionType: "task", description: "Drafted 3 social media posts for the week", linkedGoal: null, cost: 0.09, model: "claude-haiku-4-20250514", status: "success", inputSummary: "Weekly social content calendar: 3 posts needed", outputSummary: "3 posts drafted: 1 product tip, 1 customer story, 1 industry insight. Queued for review.", tokensUsed: 1450, contextAccessed: ["content_calendar", "brand_guidelines", "analytics"] },
  { id: "ae-12", timestamp: daysAgo(1, 10, 30), agentName: "Sales Agent", agentStatus: "active", actionType: "error", description: "CRM sync failed — Salesforce connection timeout", linkedGoal: null, cost: 0.01, model: "claude-haiku-4-20250514", status: "error", inputSummary: "Scheduled CRM sync: 12 new contacts to push", outputSummary: "Error: Salesforce API timeout after 30s. 0/12 contacts synced. Retry scheduled.", tokensUsed: 320, contextAccessed: ["crm_api", "contact_queue"] },

  // 2 days ago
  { id: "ae-13", timestamp: daysAgo(2, 16, 0), agentName: "CEO", agentStatus: "active", actionType: "task", description: "Decomposed Q2 strategy into 6 tactical goals", linkedGoal: "Build a profitable SaaS reaching $10k MRR", cost: 0.06, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "Q2 strategic plan review", outputSummary: "Created 6 tactical goals: 2 sales, 2 product, 1 marketing, 1 finance", tokensUsed: 2200, contextAccessed: ["goals_tree", "business_context", "okrs"] },
  { id: "ae-14", timestamp: daysAgo(2, 14, 30), agentName: "Finance Agent", agentStatus: "active", actionType: "email", description: "Sent payment reminder to 3 overdue accounts", linkedGoal: "Keep burn rate under $500/mo", cost: 0.06, model: "claude-haiku-4-20250514", status: "success", inputSummary: "3 accounts with invoices past due >7 days", outputSummary: "Payment reminder emails sent to: Initech (14d overdue), Globex (10d), Umbrella (8d)", tokensUsed: 1100, contextAccessed: ["invoices", "clients", "email_templates"] },
  { id: "ae-15", timestamp: daysAgo(2, 11, 15), agentName: "Admin Agent", agentStatus: "active", actionType: "task", description: "Organized shared drive — archived 42 old files", linkedGoal: null, cost: 0.04, model: "claude-haiku-4-20250514", status: "success", inputSummary: "Monthly file cleanup routine", outputSummary: "Archived 42 files older than 90 days. Freed 2.3 GB storage.", tokensUsed: 780, contextAccessed: ["file_system", "archive_policy"] },
  { id: "ae-16", timestamp: daysAgo(2, 9, 45), agentName: "Support Agent", agentStatus: "idle", actionType: "decision", description: "Escalated: Refund request from Initech ($120) exceeds auto-approve limit", linkedGoal: "Reduce churn below 5%", cost: 0.02, model: "claude-haiku-4-20250514", status: "escalation", inputSummary: "Customer refund request: Initech, $120, reason: service outage", outputSummary: "Refund amount exceeds $50 auto-approve threshold. Requires human decision.", tokensUsed: 640, contextAccessed: ["refund_policy", "customer_history", "approval_thresholds"] },

  // 3 days ago
  { id: "ae-17", timestamp: daysAgo(3, 15, 0), agentName: "Sales Agent", agentStatus: "active", actionType: "task", description: "Built prospect list: 50 companies from LinkedIn Sales Navigator", linkedGoal: "Run outbound email campaign to 200 prospects", cost: 0.35, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "ICP criteria: B2B SaaS, 10-50 employees, Series A", outputSummary: "50 companies identified. 38 with verified email contacts. Added to outreach pipeline.", tokensUsed: 5600, contextAccessed: ["linkedin_api", "icp_definition", "prospect_db"] },
  { id: "ae-18", timestamp: daysAgo(3, 13, 20), agentName: "Content Agent", agentStatus: "paused", actionType: "task", description: "Wrote blog post draft: 'Why Solo Founders Need AI Teams'", linkedGoal: null, cost: 0.14, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "Content brief: thought leadership on AI-native businesses", outputSummary: "1,200-word draft completed. SEO score: 82/100. Queued for founder review.", tokensUsed: 3800, contextAccessed: ["content_brief", "seo_keywords", "brand_voice"] },
  { id: "ae-19", timestamp: daysAgo(3, 11, 0), agentName: "Finance Agent", agentStatus: "active", actionType: "cost", description: "Monthly cost report: total AI spend $47.23 (94% of $50 budget)", linkedGoal: "Keep burn rate under $500/mo", cost: 0.05, model: "claude-haiku-4-20250514", status: "success", inputSummary: "Generate monthly cost summary for all agents", outputSummary: "Total: $47.23. Breakdown: Sales $18.40, Support $12.10, Content $8.90, Finance $5.63, CEO $2.20", tokensUsed: 1200, contextAccessed: ["cost_tracker", "agent_budgets", "spending_ledger"] },
  { id: "ae-20", timestamp: daysAgo(3, 9, 30), agentName: "CEO", agentStatus: "active", actionType: "error", description: "Context window exceeded during strategy analysis — task split required", linkedGoal: "Build a profitable SaaS reaching $10k MRR", cost: 0.08, model: "claude-sonnet-4-20250514", status: "error", inputSummary: "Full business context analysis for quarterly review", outputSummary: "Error: Input exceeded 180k tokens. Task auto-split into 3 sub-analyses.", tokensUsed: 180000, contextAccessed: ["full_business_context", "quarterly_data"] },

  // 4 days ago
  { id: "ae-21", timestamp: daysAgo(4, 16, 45), agentName: "Sales Agent", agentStatus: "active", actionType: "email", description: "Sent follow-up emails to 8 prospects from batch #2", linkedGoal: "Run outbound email campaign to 200 prospects", cost: 0.16, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "8 prospects who opened initial email but didn't reply", outputSummary: "8 personalized follow-ups sent. 3 included case study attachment.", tokensUsed: 2800, contextAccessed: ["email_tracking", "prospect_list", "case_studies"] },
  { id: "ae-22", timestamp: daysAgo(4, 14, 0), agentName: "Admin Agent", agentStatus: "active", actionType: "task", description: "Compiled weekly metrics dashboard for founder review", linkedGoal: null, cost: 0.07, model: "claude-haiku-4-20250514", status: "success", inputSummary: "Weekly metrics aggregation request", outputSummary: "Dashboard updated: revenue +12%, support tickets -8%, leads +22%, costs stable", tokensUsed: 1450, contextAccessed: ["analytics", "metrics_db", "dashboard_config"] },
  { id: "ae-23", timestamp: daysAgo(4, 11, 30), agentName: "Support Agent", agentStatus: "idle", actionType: "task", description: "Updated knowledge base with 5 new FAQ entries", linkedGoal: "Reduce churn below 5%", cost: 0.04, model: "claude-haiku-4-20250514", status: "success", inputSummary: "5 recurring questions identified from last 30 tickets", outputSummary: "5 FAQ entries created covering: pricing, integrations, data export, SSO, API limits", tokensUsed: 920, contextAccessed: ["tickets", "knowledge_base", "product_docs"] },

  // 5 days ago
  { id: "ae-24", timestamp: daysAgo(5, 15, 30), agentName: "Finance Agent", agentStatus: "active", actionType: "task", description: "Processed 3 vendor invoices for payment scheduling", linkedGoal: "Keep burn rate under $500/mo", cost: 0.06, model: "claude-haiku-4-20250514", status: "success", inputSummary: "3 incoming vendor invoices: hosting, email service, analytics tool", outputSummary: "Scheduled: Vercel $20 (due 3/20), Resend $15 (due 3/22), Mixpanel $49 (due 3/25)", tokensUsed: 1050, contextAccessed: ["vendor_invoices", "payment_schedule", "budget_tracker"] },
  { id: "ae-25", timestamp: daysAgo(5, 13, 0), agentName: "CEO", agentStatus: "active", actionType: "decision", description: "Approved: Launch beta access for 10 waitlist users", linkedGoal: "Acquire first 50 paying customers", cost: 0.05, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "Beta launch readiness assessment", outputSummary: "Approved 10-user beta. Selected users based on engagement score. Onboarding emails queued.", tokensUsed: 1800, contextAccessed: ["waitlist", "product_readiness", "onboarding_flow"] },
  { id: "ae-26", timestamp: daysAgo(5, 10, 15), agentName: "Content Agent", agentStatus: "paused", actionType: "email", description: "Sent weekly newsletter to 342 subscribers", linkedGoal: null, cost: 0.11, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "Weekly newsletter: product updates + industry news", outputSummary: "Newsletter sent to 342 subscribers. Subject: 'This Week in AI-Native Business'", tokensUsed: 2200, contextAccessed: ["newsletter_template", "subscriber_list", "content_queue"] },

  // 6 days ago
  { id: "ae-27", timestamp: daysAgo(6, 16, 0), agentName: "Sales Agent", agentStatus: "active", actionType: "task", description: "Researched and scored 20 inbound leads from Product Hunt launch", linkedGoal: "Acquire first 50 paying customers", cost: 0.28, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "20 signups from Product Hunt launch day", outputSummary: "Scored: 8 high-intent, 7 medium, 5 low. Top 8 added to priority outreach.", tokensUsed: 4500, contextAccessed: ["signups", "scoring_rubric", "product_hunt_data"] },
  { id: "ae-28", timestamp: daysAgo(6, 14, 30), agentName: "Admin Agent", agentStatus: "active", actionType: "error", description: "Failed to sync Google Calendar — OAuth token expired", linkedGoal: null, cost: 0.01, model: "claude-haiku-4-20250514", status: "error", inputSummary: "Scheduled calendar sync", outputSummary: "Error: OAuth refresh token invalid. User re-authentication required.", tokensUsed: 280, contextAccessed: ["google_calendar_api", "oauth_tokens"] },
  { id: "ae-29", timestamp: daysAgo(6, 12, 0), agentName: "Support Agent", agentStatus: "idle", actionType: "task", description: "Triaged 8 incoming tickets — 2 urgent, 4 normal, 2 low", linkedGoal: "Reduce churn below 5%", cost: 0.06, model: "claude-haiku-4-20250514", status: "success", inputSummary: "8 new support tickets received overnight", outputSummary: "Triaged and prioritized. 2 urgent (billing): auto-resolved. 4 normal: queued. 2 low: deferred.", tokensUsed: 1320, contextAccessed: ["tickets", "triage_rules", "sla_config"] },
  { id: "ae-30", timestamp: daysAgo(6, 10, 0), agentName: "Finance Agent", agentStatus: "active", actionType: "decision", description: "Escalated: Unexpected charge of $89 from AWS detected", linkedGoal: "Keep burn rate under $500/mo", cost: 0.03, model: "claude-haiku-4-20250514", status: "escalation", inputSummary: "Anomaly detected in cloud spending: AWS charge $89 vs expected $12", outputSummary: "Flagged for review: AWS charge 7.4x higher than baseline. Possible runaway Lambda.", tokensUsed: 740, contextAccessed: ["cloud_spending", "budget_alerts", "aws_billing"] },
  { id: "ae-31", timestamp: daysAgo(6, 8, 30), agentName: "CEO", agentStatus: "active", actionType: "task", description: "Generated morning brief — 4 decisions pending, 2 alerts", linkedGoal: null, cost: 0.04, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "Daily morning brief generation", outputSummary: "Brief: 4 pending decisions, 2 budget alerts, revenue up 8% WoW, 3 tasks completed overnight", tokensUsed: 1600, contextAccessed: ["decisions", "alerts", "metrics", "task_log"] },
  { id: "ae-32", timestamp: daysAgo(0, 10, 5), agentName: "Finance Agent", agentStatus: "active", actionType: "email", description: "Sent invoice #INV-2024-032 to Globex Corp ($3,200)", linkedGoal: "Keep burn rate under $500/mo", cost: 0.05, model: "claude-haiku-4-20250514", status: "success", inputSummary: "Globex Corp monthly retainer, March cycle", outputSummary: "Invoice generated and emailed. Amount: $3,200. Payment terms: Net 30.", tokensUsed: 980, contextAccessed: ["clients", "invoicing", "email_service"] },
  { id: "ae-33", timestamp: daysAgo(1, 9, 0), agentName: "CEO", agentStatus: "active", actionType: "task", description: "Reviewed and approved weekly OKR progress report", linkedGoal: "Build a profitable SaaS reaching $10k MRR", cost: 0.06, model: "claude-sonnet-4-20250514", status: "success", inputSummary: "Weekly OKR progress check", outputSummary: "3/5 OKRs on track, 1 at risk (outbound pipeline), 1 ahead (support SLA). Report shared.", tokensUsed: 2100, contextAccessed: ["okrs", "metrics", "goal_progress"] },
  { id: "ae-34", timestamp: daysAgo(2, 8, 0), agentName: "Sales Agent", agentStatus: "active", actionType: "decision", description: "Escalated: Prospect Umbrella Corp requesting custom pricing", linkedGoal: "Acquire first 50 paying customers", cost: 0.04, model: "claude-sonnet-4-20250514", status: "escalation", inputSummary: "Umbrella Corp wants 40% discount for 2-year commitment", outputSummary: "Custom pricing request exceeds discount authority (max 20%). Needs founder approval.", tokensUsed: 1100, contextAccessed: ["pricing_policy", "deal_history", "discount_rules"] },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AGENTS = [...new Set(MOCK_ENTRIES.map((e) => e.agentName))].sort();
const ACTION_TYPES: ActionType[] = ["task", "decision", "email", "cost", "error"];
const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const dayMs = 86400000;

  if (diff < dayMs && d.getDate() === now.getDate()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getDateRangeStart(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "last7": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "last30": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    default:
      return null;
  }
}

function statusDotColor(status: "active" | "idle" | "paused" | "error"): string {
  switch (status) {
    case "active":
      return "bg-black";
    case "idle":
      return "bg-black/30";
    case "paused":
      return "bg-black/40";
    case "error":
      return "bg-black/60";
  }
}

function statusBadgeVariant(status: EntryStatus): "success" | "destructive" | "warning" {
  switch (status) {
    case "success":
      return "success";
    case "error":
      return "destructive";
    case "escalation":
      return "warning";
  }
}

function statusLabel(status: EntryStatus): string {
  switch (status) {
    case "success":
      return "Success";
    case "error":
      return "Error";
    case "escalation":
      return "Escalation";
  }
}

function statusRowBorder(status: EntryStatus): string {
  switch (status) {
    case "success":
      return "border-l-emerald-500";
    case "error":
      return "border-l-red-500";
    case "escalation":
      return "border-l-amber-500";
  }
}

function generateCSV(entries: AuditEntry[]): string {
  const header = "Timestamp,Agent,Action Type,Description,Linked Goal,Cost (USD),Model,Status,Tokens Used\n";
  const rows = entries.map((e) =>
    [
      e.timestamp,
      `"${e.agentName}"`,
      e.actionType,
      `"${e.description.replace(/"/g, '""')}"`,
      e.linkedGoal ? `"${e.linkedGoal.replace(/"/g, '""')}"` : "",
      e.cost.toFixed(4),
      e.model,
      e.status,
      e.tokensUsed,
    ].join(",")
  );
  return header + rows.join("\n");
}

function downloadCSV(entries: AuditEntry[]) {
  const csv = generateCSV(entries);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SelectDropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-black/[0.08] bg-transparent px-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black/30"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ExpandedDetail({ entry }: { entry: AuditEntry }) {
  return (
    <div className="border-t border-black/[0.04] bg-black/[0.02]/50 px-4 py-3 text-xs text-black/60">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 font-medium text-black">Input</p>
          <p>{entry.inputSummary}</p>
        </div>
        <div>
          <p className="mb-1 font-medium text-black">Output</p>
          <p>{entry.outputSummary}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        <div>
          <span className="font-medium text-black">Tokens: </span>
          {entry.tokensUsed.toLocaleString()}
        </div>
        <div>
          <span className="font-medium text-black">Context: </span>
          {entry.contextAccessed.join(", ")}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function HistoryPage() {
  const [agentFilter, setAgentFilter] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange>("last7");
  const [search, setSearch] = React.useState("");
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);

  // Filtering
  const filtered = React.useMemo(() => {
    return MOCK_ENTRIES.filter((e) => {
      if (agentFilter && e.agentName !== agentFilter) return false;
      if (actionFilter && e.actionType !== actionFilter) return false;

      const rangeStart = getDateRangeStart(dateRange);
      if (rangeStart && new Date(e.timestamp) < rangeStart) return false;

      if (search) {
        const q = search.toLowerCase();
        const haystack = `${e.agentName} ${e.description} ${e.linkedGoal ?? ""} ${e.model}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [agentFilter, actionFilter, dateRange, search]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [agentFilter, actionFilter, dateRange, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Group by date
  const grouped = React.useMemo(() => {
    const groups: { label: string; entries: AuditEntry[] }[] = [];
    let currentLabel = "";
    for (const entry of paginated) {
      const label = formatDate(entry.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, entries: [] });
      }
      groups[groups.length - 1].entries.push(entry);
    }
    return groups;
  }, [paginated]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-black">Activity History</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadCSV(filtered)}
        >
          <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <SelectDropdown
          value={agentFilter}
          onChange={setAgentFilter}
          options={AGENTS.map((a) => ({ value: a, label: a }))}
          placeholder="All Agents"
        />
        <SelectDropdown
          value={actionFilter}
          onChange={setActionFilter}
          options={ACTION_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
          placeholder="All Actions"
        />
        <SelectDropdown
          value={dateRange}
          onChange={(v) => setDateRange(v as DateRange)}
          options={[
            { value: "today", label: "Today" },
            { value: "yesterday", label: "Yesterday" },
            { value: "last7", label: "Last 7 days" },
            { value: "last30", label: "Last 30 days" },
          ]}
          placeholder="All time"
        />
        <div className="flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions, agents, goals..."
            className="h-9 w-full min-w-[200px] rounded-md border border-black/[0.08] bg-transparent px-3 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-1 focus:ring-black/30"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="mb-3 text-xs text-black/50">
        {filtered.length} {filtered.length === 1 ? "entry" : "entries"} found
      </p>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-black/50">No audit entries match your filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-black/40">
                {group.label}
              </h2>
              <div className="overflow-hidden rounded-lg border border-black/[0.08] bg-white">
                {group.entries.map((entry, idx) => (
                  <div key={entry.id}>
                    {idx > 0 && <div className="border-t border-black/[0.04]" />}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(entry.id)}
                      className={`w-full border-l-2 px-4 py-3 text-left transition-colors hover:bg-black/[0.02]/80 ${statusRowBorder(entry.status)}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Time */}
                        <span className="mt-0.5 w-16 shrink-0 text-xs text-black/40">
                          {formatTime(entry.timestamp)}
                        </span>

                        {/* Agent */}
                        <div className="flex w-28 shrink-0 items-center gap-1.5">
                          <span
                            className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusDotColor(entry.agentStatus)}`}
                            title={entry.agentStatus}
                          />
                          <span className="truncate text-xs font-medium text-black">
                            {entry.agentName}
                          </span>
                        </div>

                        {/* Description */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-black">{entry.description}</p>
                          {entry.linkedGoal && (
                            <p className="mt-0.5 truncate text-xs text-black/40">
                              Goal: {entry.linkedGoal}
                            </p>
                          )}
                        </div>

                        {/* Meta */}
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant={statusBadgeVariant(entry.status)}>
                            {statusLabel(entry.status)}
                          </Badge>
                          <span className="w-14 text-right text-xs text-black/50">
                            ${entry.cost.toFixed(2)}
                          </span>
                          <span className="hidden w-20 truncate text-right text-xs text-black/40 sm:inline">
                            {entry.model.replace("claude-", "").replace("-20250514", "")}
                          </span>
                          <svg
                            className={`h-4 w-4 text-black/40 transition-transform ${expandedIds.has(entry.id) ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    {expandedIds.has(entry.id) && <ExpandedDetail entry={entry} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination + Export */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadCSV(filtered)}
        >
          Export CSV
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-black/50">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export { HistoryPage };
export type { AuditEntry };
