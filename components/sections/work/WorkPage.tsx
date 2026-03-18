"use client";

import * as React from "react";
import { TabBar } from "@/components/shared/TabBar";

const TABS = ["Active", "Queue", "Completed"] as const;
type WorkTab = (typeof TABS)[number];

interface Task {
  id: string;
  title: string;
  agent: string;
  status: "running" | "queued" | "done" | "blocked";
  started: string;
  cost: number;
  description: string;
}

const TASKS: Task[] = [
  // Running
  { id: "1", title: "Follow up with Globex lead", agent: "Sales Agent", status: "running", started: "10 min ago", cost: 0.08, description: "Sending personalized follow-up based on discovery call notes" },
  { id: "2", title: "Resolve ticket #847", agent: "Support Agent", status: "running", started: "3 min ago", cost: 0.02, description: "Customer asking about API rate limits — checking docs" },
  { id: "3", title: "Draft blog post on AI automation", agent: "Content Agent", status: "running", started: "25 min ago", cost: 0.12, description: "Writing 1,500 word post based on outline you approved" },
  // Queued
  { id: "4", title: "Reconcile March Stripe payouts", agent: "Ops Agent", status: "queued", started: "Waiting", cost: 0, description: "Will match Stripe payouts to invoices in your ledger" },
  { id: "5", title: "Send weekly newsletter", agent: "Content Agent", status: "queued", started: "Scheduled 5pm", cost: 0, description: "Newsletter draft is ready, waiting for scheduled send time" },
  { id: "6", title: "Qualify 3 new inbound leads", agent: "Sales Agent", status: "blocked", started: "Waiting", cost: 0, description: "Needs access to CRM — requires your approval" },
  // Done today
  { id: "7", title: "Resolved 4 support tickets", agent: "Support Agent", status: "done", started: "2 hr ago", cost: 0.15, description: "Average response time: 4 minutes. All customers satisfied." },
  { id: "8", title: "Published social media posts", agent: "Content Agent", status: "done", started: "3 hr ago", cost: 0.06, description: "3 posts across Twitter and LinkedIn. 2 already have engagement." },
  { id: "9", title: "Updated CRM pipeline", agent: "Sales Agent", status: "done", started: "1 hr ago", cost: 0.04, description: "Moved 2 leads to qualified, 1 to closed-won." },
  { id: "10", title: "Filed expense report", agent: "Ops Agent", status: "done", started: "4 hr ago", cost: 0.03, description: "Categorized 8 transactions from last week." },
];

function TaskRow({ task }: { task: Task }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <>
      <div
        className="flex items-center justify-between border-b border-black/[0.04] py-3 cursor-pointer transition-colors hover:bg-black/[0.02] last:border-0"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {task.status === "running" && (
            <div className="h-2 w-2 animate-pulse rounded-full bg-black" />
          )}
          {task.status === "queued" && (
            <div className="h-2 w-2 rounded-full bg-black/30" />
          )}
          {task.status === "blocked" && (
            <div className="h-2 w-2 rounded-full bg-black/50" />
          )}
          {task.status === "done" && (
            <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/[0.08]">
              <svg className="h-2 w-2 text-black/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div>
            <p className={`text-[13px] ${task.status === "done" ? "text-black/50" : "text-black"}`}>
              {task.title}
            </p>
            <p className="text-[11px] text-black/40">
              {task.agent} · {task.started}
            </p>
          </div>
        </div>
        {task.cost > 0 && (
          <span className="font-mono text-[11px] text-black/40">
            ${task.cost.toFixed(2)}
          </span>
        )}
      </div>

      {expanded && (
        <div className="border-b border-black/[0.04] bg-black/[0.02] px-4 py-3">
          <p className="text-[12px] text-black/60">{task.description}</p>
          {task.status === "blocked" && (
            <button
              className="mt-2 text-[12px] font-medium text-black hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Approve Access
            </button>
          )}
        </div>
      )}
    </>
  );
}

function dispatchAppAction(action: string) {
  window.dispatchEvent(new CustomEvent("app-action", { detail: { action } }));
}

interface WorkPageProps {
  onAction?: (action: string) => void;
}

function WorkPage({ onAction }: WorkPageProps) {
  const [activeTab, setActiveTab] = React.useState<WorkTab>("Active");
  const handleAction = onAction ?? dispatchAppAction;

  const active = TASKS.filter(t => t.status === "running");
  const queued = TASKS.filter(t => t.status === "queued" || t.status === "blocked");
  const done = TASKS.filter(t => t.status === "done");

  const displayed = activeTab === "Active" ? active : activeTab === "Queue" ? queued : done;

  const totalCostToday = TASKS.reduce((s, t) => s + t.cost, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-black">Work</h1>
        <button
          className="text-[13px] text-black/50 transition-colors hover:text-black"
          onClick={() => handleAction("new_project")}
        >
          + New Task
        </button>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-4 gap-6">
        <div>
          <p className="text-[11px] text-black/50">Running</p>
          <p className="mt-1 font-mono text-lg font-semibold text-black">{active.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-black/50">Queued</p>
          <p className="mt-1 font-mono text-lg font-semibold text-black">{queued.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-black/50">Done Today</p>
          <p className="mt-1 font-mono text-lg font-semibold text-black">{done.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-black/50">Cost Today</p>
          <p className="mt-1 font-mono text-lg font-semibold text-black">${totalCostToday.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-6">
        <TabBar
          tabs={TABS as unknown as string[]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as WorkTab)}
        />
      </div>
      <div className="mt-6">
        {displayed.length > 0 ? (
          displayed.map((task) => <TaskRow key={task.id} task={task} />)
        ) : (
          <div className="py-8 text-center text-[13px] text-black/50">
            No tasks in this category.
          </div>
        )}
      </div>
    </div>
  );
}

export { WorkPage };
