"use client";

import * as React from "react";
import { DecisionFeed, type DecisionItem } from "@/components/company/DecisionFeed";

interface AgentActivity {
  agent: string;
  action: string;
  time: string;
}

const RECENT_ACTIVITY: AgentActivity[] = [
  { agent: "Sales Agent", action: "Qualified 2 new leads from inbound form", time: "12 min ago" },
  { agent: "Support Agent", action: "Resolved 3 tickets — avg response 4 min", time: "28 min ago" },
  { agent: "Content Agent", action: "Published weekly newsletter to 2,400 subscribers", time: "1 hr ago" },
  { agent: "Ops Agent", action: "Reconciled Stripe payouts for March 1–12", time: "2 hr ago" },
];

const DECISIONS: DecisionItem[] = [
  {
    id: "d1",
    type: "approval" as const,
    title: "Send proposal to Globex ($5,000)",
    description: "Sales Agent drafted a proposal based on the discovery call. Ready for your review before sending.",
    urgency: "high" as const,
    options: [
      { label: "Approve & Send", value: "approve" },
      { label: "Review First", value: "edit" },
      { label: "Decline", value: "reject" },
    ],
  },
  {
    id: "d2",
    type: "alert" as const,
    title: "Content Agent nearing budget limit",
    description: "At 85% of $50/mo budget with 18 days left. Currently generating social content.",
    urgency: "medium" as const,
    options: [
      { label: "Increase to $75", value: "increase" },
      { label: "Pause Agent", value: "pause" },
      { label: "OK, Let It Run", value: "dismiss" },
    ],
  },
  {
    id: "d3",
    type: "approval" as const,
    title: "Refund request from Initech ($120)",
    description: "Support Agent flagged this — customer claims service issue. Refund is within policy.",
    urgency: "low" as const,
    options: [
      { label: "Approve Refund", value: "approve" },
      { label: "Investigate", value: "review" },
      { label: "Deny", value: "hold" },
    ],
  },
];

function HQPage() {
  const [decisions, setDecisions] = React.useState<DecisionItem[]>(DECISIONS);

  const handleAction = async (cardId: string, _action: string) => {
    setDecisions((prev) =>
      prev.map((d) => (d.id === cardId ? { ...d, done: true } : d))
    );
  };

  const pendingCount = decisions.filter((d) => !d.done).length;
  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-[640px]">
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">{greeting}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {pendingCount > 0
            ? `${pendingCount} decision${pendingCount > 1 ? "s" : ""} need your attention.`
            : "All clear. Your agents are handling everything."}
        </p>
      </div>

      {/* Key numbers */}
      <div className="mt-8 grid grid-cols-3 gap-8">
        <div>
          <p className="text-[11px] text-zinc-500">Agents Active</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-zinc-900">3/4</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Tasks Today</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-zinc-900">54</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Spent Today</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-zinc-900">$1.03</p>
        </div>
      </div>

      {/* Recent agent activity */}
      <div className="mt-10">
        <h2 className="text-xs font-medium text-zinc-500">Recent Activity</h2>
        <div className="mt-3 flex flex-col">
          {RECENT_ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5">
              <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
              <div className="flex-1">
                <p className="text-[13px] text-zinc-700">
                  <span className="font-medium text-zinc-900">{a.agent}</span> {a.action}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-zinc-400">{a.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decisions */}
      <div className="mt-10">
        <DecisionFeed cards={decisions} onAction={handleAction} />
      </div>
    </div>
  );
}

export { HQPage };
