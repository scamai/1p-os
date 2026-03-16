"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DecisionFeed, type DecisionItem } from "@/components/company/DecisionFeed";
import { MorningBriefCard } from "@/components/company/MorningBriefCard";
import { ActivityFeed } from "@/components/company/ActivityFeed";
import { AgentHandoffs } from "@/components/company/AgentHandoffs";
import { MOCK_HANDOFFS, type AgentHandoff } from "@/lib/agents/collaboration";

// ── Types ──

interface GoalNode {
  id: string;
  title: string;
  level: "mission" | "strategic" | "tactical" | "task";
  status: "active" | "completed" | "cancelled" | "blocked";
  assigned_agent_id: string | null;
  children: GoalNode[];
}

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "paused" | "error";
  taskCount: number;
  costToday: number;
}

interface CEOBrief {
  tasksCompleted: number;
  decisionsPending: number;
  costToday: number;
  agentsActive: number;
  summary: string;
  lastUpdated: string;
}

// ── Mock Data (DEV_BYPASS) ──

const MOCK_BRIEF: CEOBrief = {
  tasksCompleted: 7,
  decisionsPending: 3,
  costToday: 1.47,
  agentsActive: 3,
  summary:
    "Sales Agent qualified 2 new leads and drafted a proposal for Globex ($5k). Finance Agent reconciled March payouts — everything matched. Support Agent resolved 3 tickets with 4-min avg response. Content Agent is paused (nearing budget). CEO decomposed Q2 growth strategy into 4 tactical goals.",
  lastUpdated: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
};

const MOCK_AGENTS: AgentInfo[] = [
  { id: "a1", name: "CEO", role: "Strategy", status: "active", taskCount: 2, costToday: 0.31 },
  { id: "a2", name: "Sales Agent", role: "Sales", status: "active", taskCount: 3, costToday: 0.52 },
  { id: "a3", name: "Finance Agent", role: "Finance", status: "active", taskCount: 1, costToday: 0.18 },
  { id: "a4", name: "Support Agent", role: "Support", status: "idle", taskCount: 0, costToday: 0.22 },
  { id: "a5", name: "Content Agent", role: "Content", status: "paused", taskCount: 0, costToday: 0.24 },
];

const MOCK_GOALS: GoalNode[] = [
  {
    id: "g-mission",
    title: "Build a profitable SaaS reaching $10k MRR",
    level: "mission",
    status: "active",
    assigned_agent_id: null,
    children: [
      {
        id: "g-s1",
        title: "Acquire first 50 paying customers",
        level: "strategic",
        status: "active",
        assigned_agent_id: null,
        children: [
          {
            id: "g-t1",
            title: "Set up inbound lead capture on landing page",
            level: "tactical",
            status: "completed",
            assigned_agent_id: "a2",
            children: [
              { id: "g-task1", title: "Design lead form", level: "task", status: "completed", assigned_agent_id: "a2", children: [] },
              { id: "g-task2", title: "Connect form to CRM", level: "task", status: "completed", assigned_agent_id: "a2", children: [] },
            ],
          },
          {
            id: "g-t2",
            title: "Run outbound email campaign to 200 prospects",
            level: "tactical",
            status: "active",
            assigned_agent_id: "a2",
            children: [
              { id: "g-task3", title: "Build prospect list from LinkedIn", level: "task", status: "completed", assigned_agent_id: "a2", children: [] },
              { id: "g-task4", title: "Draft cold email sequence (3 emails)", level: "task", status: "active", assigned_agent_id: "a2", children: [] },
              { id: "g-task5", title: "Send first batch (50 prospects)", level: "task", status: "blocked", assigned_agent_id: "a2", children: [] },
            ],
          },
          {
            id: "g-t3",
            title: "Create demo video for website",
            level: "tactical",
            status: "active",
            assigned_agent_id: "a5",
            children: [],
          },
        ],
      },
      {
        id: "g-s2",
        title: "Reduce churn below 5%",
        level: "strategic",
        status: "active",
        assigned_agent_id: null,
        children: [
          {
            id: "g-t4",
            title: "Set up automated onboarding emails",
            level: "tactical",
            status: "active",
            assigned_agent_id: "a4",
            children: [],
          },
        ],
      },
      {
        id: "g-s3",
        title: "Keep burn rate under $500/mo",
        level: "strategic",
        status: "active",
        assigned_agent_id: "a3",
        children: [
          {
            id: "g-t5",
            title: "Audit current spending and create budget",
            level: "tactical",
            status: "completed",
            assigned_agent_id: "a3",
            children: [],
          },
        ],
      },
    ],
  },
];

const MOCK_DECISIONS: DecisionItem[] = [
  {
    id: "d1",
    type: "approval",
    title: "Send proposal to Globex ($5,000)",
    description:
      "Sales Agent drafted a proposal based on the discovery call. Ready for review before sending.",
    urgency: "high",
    options: [
      { label: "Approve & Send", value: "approve" },
      { label: "Review First", value: "edit" },
      { label: "Decline", value: "reject" },
    ],
  },
  {
    id: "d2",
    type: "alert",
    title: "Content Agent nearing budget limit",
    description:
      "At 85% of $50/mo budget with 18 days left. Currently generating social content.",
    urgency: "medium",
    options: [
      { label: "Increase to $75", value: "increase" },
      { label: "Pause Agent", value: "pause" },
      { label: "OK, Let It Run", value: "dismiss" },
    ],
  },
  {
    id: "d3",
    type: "approval",
    title: "Refund request from Initech ($120)",
    description:
      "Support Agent flagged this — customer claims service issue. Refund is within policy.",
    urgency: "low",
    options: [
      { label: "Approve Refund", value: "approve" },
      { label: "Investigate", value: "review" },
      { label: "Deny", value: "hold" },
    ],
  },
];

// ── Helpers ──

const STATUS_ICON: Record<GoalNode["status"], { char: string; color: string }> = {
  active: { char: "\u25CB", color: "text-zinc-500" },
  completed: { char: "\u2713", color: "text-zinc-900" },
  cancelled: { char: "\u2715", color: "text-zinc-300" },
  blocked: { char: "\u25A0", color: "text-zinc-400" },
};

const LEVEL_LABEL: Record<GoalNode["level"], string> = {
  mission: "Mission",
  strategic: "Strategy",
  tactical: "Tactic",
  task: "Task",
};

const LEVEL_INDENT: Record<GoalNode["level"], string> = {
  mission: "pl-0",
  strategic: "pl-4",
  tactical: "pl-8",
  task: "pl-12",
};

const AGENT_DOT: Record<AgentInfo["status"], string> = {
  active: "bg-emerald-500",
  idle: "bg-zinc-300",
  paused: "bg-amber-400",
  error: "bg-red-500",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}

// ── Sub-components ──

function MissionEditor({
  mission,
  onSave,
}: {
  mission: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(mission);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    const trimmed = value.trim();
    if (trimmed) onSave(trimmed);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group w-full text-left"
      >
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Mission
        </p>
        <p className="mt-1 text-[15px] font-medium text-zinc-900 group-hover:text-zinc-600">
          {mission}
          <span className="ml-2 text-[11px] text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100">
            edit
          </span>
        </p>
      </button>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
        Mission
      </p>
      <div className="mt-1 flex gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setValue(mission);
              setEditing(false);
            }
          }}
          className="flex-1 border-b border-zinc-300 bg-transparent text-[15px] font-medium text-zinc-900 outline-none focus:border-zinc-900"
        />
        <button
          onClick={save}
          className="text-[12px] font-medium text-zinc-900 hover:text-zinc-600"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function BriefSection({ brief }: { brief: CEOBrief }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          CEO Brief
        </p>
        <span className="text-[11px] text-zinc-300">
          {timeAgo(brief.lastUpdated)}
        </span>
      </div>

      {/* Key numbers */}
      <div className="mt-3 grid grid-cols-4 gap-4">
        <div>
          <p className="text-[11px] text-zinc-400">Done today</p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-zinc-900">
            {brief.tasksCompleted}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-400">Pending</p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-zinc-900">
            {brief.decisionsPending}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-400">Cost today</p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-zinc-900">
            {formatUSD(brief.costToday)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-400">Agents</p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-zinc-900">
            {brief.agentsActive}
          </p>
        </div>
      </div>

      {/* Narrative */}
      <p className="mt-3 text-[13px] leading-relaxed text-zinc-600">
        {brief.summary}
      </p>
    </div>
  );
}

function GoalRow({
  node,
  onDecompose,
  decomposing,
}: {
  node: GoalNode;
  onDecompose: (id: string) => void;
  decomposing: string | null;
}) {
  const [expanded, setExpanded] = React.useState(
    node.level === "mission" || node.level === "strategic"
  );
  const hasChildren = node.children.length > 0;
  const canDecompose = node.level !== "task" && node.children.length === 0;
  const icon = STATUS_ICON[node.status];
  const isDecomposing = decomposing === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 ${LEVEL_INDENT[node.level]}`}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-4 w-4 shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-600"
          >
            <svg
              className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Status icon */}
        <span className={`text-[13px] ${icon.color}`}>{icon.char}</span>

        {/* Title */}
        <span
          className={`flex-1 text-[13px] ${
            node.status === "completed"
              ? "text-zinc-400 line-through"
              : node.status === "blocked"
                ? "text-zinc-500"
                : "text-zinc-800"
          }`}
        >
          {node.title}
        </span>

        {/* Level badge */}
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-zinc-300">
          {LEVEL_LABEL[node.level]}
        </span>

        {/* Decompose button */}
        {canDecompose && (
          <button
            onClick={() => onDecompose(node.id)}
            disabled={isDecomposing}
            className="shrink-0 rounded border border-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 disabled:opacity-50"
          >
            {isDecomposing ? "..." : "Decompose"}
          </button>
        )}
      </div>

      {/* Children */}
      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <GoalRow
            key={child.id}
            node={child}
            onDecompose={onDecompose}
            decomposing={decomposing}
          />
        ))}
    </div>
  );
}

function GoalTree({
  goals,
  onDecompose,
  decomposing,
}: {
  goals: GoalNode[];
  onDecompose: (id: string) => void;
  decomposing: string | null;
}) {
  if (goals.length === 0) {
    return (
      <p className="py-4 text-[13px] text-zinc-400">
        No goals yet. Set your mission above.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {goals.map((node) => (
        <GoalRow
          key={node.id}
          node={node}
          onDecompose={onDecompose}
          decomposing={decomposing}
        />
      ))}
    </div>
  );
}

function TeamStrip({ agents }: { agents: AgentInfo[] }) {
  const router = useRouter();

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {agents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => router.push("/team")}
          className="flex shrink-0 flex-col items-center gap-1.5 rounded-lg border border-zinc-100 px-3 py-2.5 transition-colors hover:border-zinc-300"
        >
          {/* Avatar circle with status dot */}
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600">
              {agent.name.charAt(0)}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${AGENT_DOT[agent.status]}`}
            />
          </div>
          <span className="text-[11px] font-medium text-zinc-700">
            {agent.name.replace(" Agent", "")}
          </span>
          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
            <span className="font-mono">{agent.taskCount} tasks</span>
            <span className="font-mono">{formatUSD(agent.costToday)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function SpendBar({
  spent,
  budget,
}: {
  spent: number;
  budget: number;
}) {
  const pct = Math.min((spent / budget) * 100, 100);
  const barColor = pct > 80 ? "bg-amber-500" : "bg-zinc-900";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Spend
        </p>
        <span className="font-mono text-[12px] text-zinc-500">
          {formatUSD(spent)} / {formatUSD(budget)} daily
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-right font-mono text-[11px] text-zinc-400">
        {pct.toFixed(0)}% used
      </p>
    </div>
  );
}

// ── Section wrapper ──

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mt-8 ${className}`}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
      {children}
    </p>
  );
}

// ── Main Page ──

const MISSION_KEY = "1pos_mission";
const DEFAULT_MISSION = "Build a profitable SaaS reaching $10k MRR";

function HQPage() {
  const router = useRouter();

  // Mission (localStorage in dev bypass)
  const [mission, setMission] = React.useState(DEFAULT_MISSION);
  React.useEffect(() => {
    const stored = localStorage.getItem(MISSION_KEY);
    if (stored) setMission(stored);
  }, []);
  const saveMission = (v: string) => {
    setMission(v);
    localStorage.setItem(MISSION_KEY, v);
  };

  // Decisions
  const [decisions, setDecisions] = React.useState<DecisionItem[]>(MOCK_DECISIONS);
  const handleAction = async (cardId: string, action: string) => {
    try {
      await fetch(`/api/decisions/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } catch {
      // DEV_BYPASS: API may not exist, just update locally
    }
    setDecisions((prev) =>
      prev.map((d) => (d.id === cardId ? { ...d, done: true } : d))
    );
  };

  // Goals
  const [goals, setGoals] = React.useState<GoalNode[]>(MOCK_GOALS);
  const [decomposing, setDecomposing] = React.useState<string | null>(null);

  // Load real goals if available
  React.useEffect(() => {
    fetch("/api/orchestration/goals?format=tree")
      .then((r) => r.json())
      .then((data) => {
        if (data.goals?.length > 0) setGoals(data.goals);
      })
      .catch(() => {
        // Stick with mock goals
      });
  }, []);

  const handleDecompose = async (goalId: string) => {
    setDecomposing(goalId);
    try {
      const res = await fetch(`/api/orchestration/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decompose" }),
      });
      if (res.ok) {
        // Reload goals
        const treeRes = await fetch("/api/orchestration/goals?format=tree");
        const data = await treeRes.json();
        if (data.goals?.length > 0) setGoals(data.goals);
      }
    } catch {
      // DEV_BYPASS: may fail, that's ok
    } finally {
      setDecomposing(null);
    }
  };

  // Agents
  const [agents] = React.useState<AgentInfo[]>(MOCK_AGENTS);

  // Handoffs
  const [handoffs] = React.useState<AgentHandoff[]>(
    MOCK_HANDOFFS.filter((h) => h.status !== "completed")
  );

  // Spend
  const spentToday = agents.reduce((s, a) => s + a.costToday, 0);
  const dailyBudget = 20; // global daily budget from CLAUDE.md

  // Greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const pendingCount = decisions.filter((d) => !d.done).length;

  return (
    <div className="mx-auto max-w-[640px] pb-16">
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">{greeting}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {pendingCount > 0
            ? `${pendingCount} decision${pendingCount > 1 ? "s" : ""} need${pendingCount === 1 ? "s" : ""} your attention.`
            : "All clear. Your agents are handling everything."}
        </p>
      </div>

      {/* 1. Mission */}
      <Section>
        <MissionEditor mission={mission} onSave={saveMission} />
      </Section>

      {/* 2. Morning Brief */}
      <Section>
        <MorningBriefCard />
      </Section>

      {/* 3. Activity Feed */}
      <Section>
        <ActivityFeed />
      </Section>

      {/* 4. Decisions */}
      <Section>
        <SectionLabel>Decisions</SectionLabel>
        <DecisionFeed cards={decisions} onAction={handleAction} />
      </Section>

      {/* 4. Goals */}
      <Section>
        <SectionLabel>Goals</SectionLabel>
        <GoalTree
          goals={goals}
          onDecompose={handleDecompose}
          decomposing={decomposing}
        />
      </Section>

      {/* 5. Team Strip */}
      <Section>
        <SectionLabel>Team</SectionLabel>
        <TeamStrip agents={agents} />
      </Section>

      {/* 6. Agent Handoffs */}
      <Section>
        <SectionLabel>
          Agent Handoffs{" "}
          <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-zinc-100 px-1.5 text-[11px] font-semibold tabular-nums text-zinc-600">
            {handoffs.length}
          </span>
        </SectionLabel>
        <AgentHandoffs handoffs={handoffs} />
      </Section>

      {/* 7. Spend */}
      <Section>
        <SpendBar spent={spentToday} budget={dailyBudget} />
      </Section>
    </div>
  );
}

export { HQPage };
