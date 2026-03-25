"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// --- Types ---

type AgentStatus = "working" | "idle" | "paused" | "needs_input" | "error";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  tasksToday: number;
  costToday: number;
}

interface Department {
  id: string;
  name: string;
  icon: string;
  agents: Agent[];
  color: string;
}

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  agentId: string;
  agentName: string;
  action: string;
  department: string;
  outputTo?: string;
}

// --- Fallback Demo Data ---

const DEPARTMENTS: Department[] = [
  {
    id: "sales",
    name: "Sales",
    icon: "S",
    color: "#0F172A",
    agents: [
      { id: "a1", name: "Lead Qualifier", role: "Scores and qualifies inbound leads", status: "working", tasksToday: 12, costToday: 0.34 },
      { id: "a2", name: "Proposal Writer", role: "Drafts proposals and quotes", status: "idle", tasksToday: 3, costToday: 0.18 },
    ],
  },
  {
    id: "support",
    name: "Support",
    icon: "H",
    color: "#3f3f46",
    agents: [
      { id: "a3", name: "Ticket Resolver", role: "Handles customer tickets", status: "working", tasksToday: 18, costToday: 0.22 },
    ],
  },
  {
    id: "content",
    name: "Content",
    icon: "C",
    color: "#52525b",
    agents: [
      { id: "a4", name: "Content Writer", role: "Blog posts, social, newsletter", status: "working", tasksToday: 5, costToday: 0.41 },
    ],
  },
  {
    id: "ops",
    name: "Operations",
    icon: "O",
    color: "#94A3B8",
    agents: [
      { id: "a7", name: "Ops Coordinator", role: "Orchestrates cross-team workflows", status: "working", tasksToday: 24, costToday: 0.15 },
    ],
  },
];

const WORKFLOWS: Workflow[] = [
  {
    id: "w1",
    name: "Inbound Lead → Proposal",
    trigger: "New form submission",
    steps: [
      { agentId: "a1", agentName: "Lead Qualifier", action: "Score & qualify lead", department: "Sales", outputTo: "a2" },
      { agentId: "a2", agentName: "Proposal Writer", action: "Draft proposal", department: "Sales", outputTo: "a7" },
      { agentId: "a7", agentName: "Ops Coordinator", action: "Route for approval", department: "Operations" },
    ],
  },
  {
    id: "w2",
    name: "Support → Content Loop",
    trigger: "Recurring (weekly)",
    steps: [
      { agentId: "a3", agentName: "Ticket Resolver", action: "Summarize top issues", department: "Support", outputTo: "a4" },
      { agentId: "a4", agentName: "Content Writer", action: "Write FAQ / help article", department: "Content" },
    ],
  },
  {
    id: "w4",
    name: "Content Calendar",
    trigger: "Monday 9 AM",
    steps: [
      { agentId: "a4", agentName: "Content Writer", action: "Draft weekly content plan", department: "Content", outputTo: "a7" },
      { agentId: "a7", agentName: "Ops Coordinator", action: "Schedule & distribute", department: "Operations" },
    ],
  },
];

// --- Status helpers ---

const STATUS_COLORS: Record<AgentStatus, string> = {
  working: "#0F172A",
  idle: "#94A3B8",
  paused: "#71717a",
  needs_input: "#52525b",
  error: "#3f3f46",
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  working: "Working",
  idle: "Idle",
  paused: "Paused",
  needs_input: "Needs Input",
  error: "Error",
};

// --- Org Structure Components (kept as-is) ---

function StatusDot({ status }: { status: AgentStatus }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full shrink-0"
      style={{ backgroundColor: STATUS_COLORS[status] }}
      title={STATUS_LABELS[status]}
    />
  );
}

function AgentNodeCard({ agent }: { agent: Agent }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2.5 hover:border-black/30 transition-colors">
      <StatusDot status={agent.status} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-black truncate">{agent.name}</p>
        <p className="text-[11px] text-black/50 truncate">{agent.role}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-[10px] text-black/40">{agent.tasksToday} tasks</span>
          <span className="text-[10px] text-black/40">${agent.costToday.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function DepartmentCard({ department }: { department: Department }) {
  const activeCount = department.agents.filter((a) => a.status === "working").length;
  const totalTasks = department.agents.reduce((sum, a) => sum + a.tasksToday, 0);

  return (
    <div className="rounded-xl border border-black/[0.08] bg-black/[0.02]/50">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-black/[0.08]">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-semibold text-white"
          style={{ backgroundColor: department.color }}
        >
          {department.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-black">{department.name}</p>
          <p className="text-[10px] text-black/50">
            {activeCount}/{department.agents.length} active · {totalTasks} tasks today
          </p>
        </div>
      </div>
      <div className="p-3 space-y-2">
        {department.agents.map((agent) => (
          <AgentNodeCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function OrgStructureView({ departments }: { departments: Department[] }) {
  const totalAgents = departments.reduce((sum, d) => sum + d.agents.length, 0);
  const activeAgents = departments.reduce(
    (sum, d) => sum + d.agents.filter((a) => a.status === "working").length,
    0
  );
  const totalCost = departments.reduce(
    (sum, d) => sum + d.agents.reduce((s, a) => s + a.costToday, 0),
    0
  );

  return (
    <div>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div>
          <p className="text-[11px] text-black/50">Departments</p>
          <p className="mt-1 font-mono text-xl font-semibold text-black">{departments.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-black/50">Total Agents</p>
          <p className="mt-1 font-mono text-xl font-semibold text-black">{totalAgents}</p>
        </div>
        <div>
          <p className="text-[11px] text-black/50">Active Now</p>
          <p className="mt-1 font-mono text-xl font-semibold text-black">{activeAgents}/{totalAgents}</p>
        </div>
        <div>
          <p className="text-[11px] text-black/50">Today&apos;s Cost</p>
          <p className="mt-1 font-mono text-xl font-semibold text-black">${totalCost.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 rounded-lg border-2 border-black bg-black px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-black/40" />
          <span className="text-[13px] font-semibold text-white">You — Founder</span>
        </div>
      </div>
      <div className="flex justify-center mb-4">
        <div className="w-px h-8 bg-black/30" />
      </div>
      <div className="relative mb-4">
        <div className="absolute left-[10%] right-[10%] top-0 h-px bg-black/30" />
        <div className="flex justify-between px-[10%]">
          {departments.map((_, i) => (
            <div key={i} className="w-px h-4 bg-black/30" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <DepartmentCard key={dept.id} department={dept} />
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4 text-[11px] text-black/50">
        <span className="font-medium text-black/70">Status:</span>
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <span key={status} className="flex items-center gap-1.5">
            <StatusDot status={status as AgentStatus} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- React Flow Canvas (loaded client-side only) ---

const WorkflowCanvas = dynamic(
  () => import("./WorkflowCanvas").then((m) => ({ default: m.WorkflowCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] rounded-xl border border-black/[0.08] bg-black/[0.02]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
      </div>
    ),
  }
);

// --- Main View ---

type Tab = "structure" | "workflows";

interface OperationsData {
  departments: Department[];
  workflows: Workflow[];
}

export function OperationsView() {
  const [tab, setTab] = useState<Tab>("workflows");
  const [data, setData] = useState<OperationsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/core/operations")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.departments?.length) {
          setData(d);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const departments = data?.departments ?? DEPARTMENTS;
  const workflows = data?.workflows?.length ? data.workflows : WORKFLOWS;

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-black">Operations</h1>
          <p className="mt-1 text-sm text-black/50">
            Drag-and-drop workflow builder. Connect agents into automated pipelines.
          </p>
        </div>
        {!data && !loading && (
          <span className="text-[10px] text-black/40 border border-black/[0.08] rounded px-2 py-1">
            Demo data
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-1 border-b border-black/[0.08]">
        <button
          onClick={() => setTab("workflows")}
          className={`px-3 py-2 text-[13px] font-medium transition-colors relative ${
            tab === "workflows" ? "text-black" : "text-black/50 hover:text-black/70"
          }`}
        >
          Workflow Builder
          {tab === "workflows" && (
            <span className="absolute bottom-0 left-0 right-0 h-px bg-black" />
          )}
        </button>
        <button
          onClick={() => setTab("structure")}
          className={`px-3 py-2 text-[13px] font-medium transition-colors relative ${
            tab === "structure" ? "text-black" : "text-black/50 hover:text-black/70"
          }`}
        >
          Org Structure
          {tab === "structure" && (
            <span className="absolute bottom-0 left-0 right-0 h-px bg-black" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          </div>
        ) : (
          <>
            {tab === "workflows" && (
              <WorkflowCanvas departments={departments} workflows={workflows} />
            )}
            {tab === "structure" && <OrgStructureView departments={departments} />}
          </>
        )}
      </div>
    </div>
  );
}
