"use client";

import { useState, useEffect } from "react";

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
  outputTo?: string; // next agent id
}

// --- Fallback Demo Data ---

const DEPARTMENTS: Department[] = [
  {
    id: "sales",
    name: "Sales",
    icon: "S",
    color: "#3b82f6",
    agents: [
      { id: "a1", name: "Lead Qualifier", role: "Scores and qualifies inbound leads", status: "working", tasksToday: 12, costToday: 0.34 },
      { id: "a2", name: "Proposal Writer", role: "Drafts proposals and quotes", status: "idle", tasksToday: 3, costToday: 0.18 },
    ],
  },
  {
    id: "support",
    name: "Support",
    icon: "H",
    color: "#10b981",
    agents: [
      { id: "a3", name: "Ticket Resolver", role: "Handles customer tickets", status: "working", tasksToday: 18, costToday: 0.22 },
    ],
  },
  {
    id: "content",
    name: "Content",
    icon: "C",
    color: "#8b5cf6",
    agents: [
      { id: "a4", name: "Content Writer", role: "Blog posts, social, newsletter", status: "working", tasksToday: 5, costToday: 0.41 },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    icon: "F",
    color: "#f59e0b",
    agents: [
      { id: "a5", name: "Bookkeeper", role: "Reconciles transactions, tracks expenses", status: "idle", tasksToday: 8, costToday: 0.12 },
      { id: "a6", name: "Invoice Agent", role: "Sends and follows up on invoices", status: "paused", tasksToday: 0, costToday: 0 },
    ],
  },
  {
    id: "ops",
    name: "Operations",
    icon: "O",
    color: "#ef4444",
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
    id: "w3",
    name: "Revenue Reconciliation",
    trigger: "Daily at 6 AM",
    steps: [
      { agentId: "a5", agentName: "Bookkeeper", action: "Pull Stripe payouts", department: "Finance", outputTo: "a6" },
      { agentId: "a6", agentName: "Invoice Agent", action: "Match to invoices", department: "Finance", outputTo: "a7" },
      { agentId: "a7", agentName: "Ops Coordinator", action: "Flag discrepancies", department: "Operations" },
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
  working: "#22c55e",
  idle: "#a1a1aa",
  paused: "#f59e0b",
  needs_input: "#eab308",
  error: "#ef4444",
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  working: "Working",
  idle: "Idle",
  paused: "Paused",
  needs_input: "Needs Input",
  error: "Error",
};

// --- Components ---

function StatusDot({ status }: { status: AgentStatus }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full shrink-0"
      style={{ backgroundColor: STATUS_COLORS[status] }}
      title={STATUS_LABELS[status]}
    />
  );
}

function AgentNode({ agent }: { agent: Agent }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 hover:border-zinc-300 transition-colors">
      <StatusDot status={agent.status} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-zinc-900 truncate">{agent.name}</p>
        <p className="text-[11px] text-zinc-500 truncate">{agent.role}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-[10px] text-zinc-400">
            {agent.tasksToday} tasks
          </span>
          <span className="text-[10px] text-zinc-400">
            ${agent.costToday.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function DepartmentCard({ department }: { department: Department }) {
  const activeCount = department.agents.filter((a) => a.status === "working").length;
  const totalTasks = department.agents.reduce((sum, a) => sum + a.tasksToday, 0);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50">
      {/* Department header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-200">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-semibold text-white"
          style={{ backgroundColor: department.color }}
        >
          {department.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-zinc-900">{department.name}</p>
          <p className="text-[10px] text-zinc-500">
            {activeCount}/{department.agents.length} active · {totalTasks} tasks today
          </p>
        </div>
      </div>

      {/* Agents */}
      <div className="p-3 space-y-2">
        {department.agents.map((agent) => (
          <AgentNode key={agent.id} agent={agent} />
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
  const totalTasks = departments.reduce(
    (sum, d) => sum + d.agents.reduce((s, a) => s + a.tasksToday, 0),
    0
  );
  const totalCost = departments.reduce(
    (sum, d) => sum + d.agents.reduce((s, a) => s + a.costToday, 0),
    0
  );

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div>
          <p className="text-[11px] text-zinc-500">Departments</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">{departments.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Total Agents</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">{totalAgents}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Active Now</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">{activeAgents}/{totalAgents}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Today&apos;s Cost</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">${totalCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Founder node */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 rounded-lg border-2 border-zinc-900 bg-zinc-900 px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[13px] font-semibold text-white">You — Founder</span>
        </div>
      </div>

      {/* Connector line */}
      <div className="flex justify-center mb-4">
        <div className="w-px h-8 bg-zinc-300" />
      </div>

      {/* Horizontal connector */}
      <div className="relative mb-4">
        <div className="absolute left-[10%] right-[10%] top-0 h-px bg-zinc-300" />
        {/* Vertical drops */}
        <div className="flex justify-between px-[10%]">
          {departments.map((_, i) => (
            <div key={i} className="w-px h-4 bg-zinc-300" />
          ))}
        </div>
      </div>

      {/* Department cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <DepartmentCard key={dept.id} department={dept} />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 flex items-center gap-4 text-[11px] text-zinc-500">
        <span className="font-medium text-zinc-700">Status:</span>
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

function WorkflowCard({ workflow, departments }: { workflow: Workflow; departments: Department[] }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <p className="text-[13px] font-semibold text-zinc-900">{workflow.name}</p>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Trigger: {workflow.trigger}
        </p>
      </div>

      {/* Steps */}
      <div className="p-4">
        {workflow.steps.map((step, i) => {
          const dept = departments.find((d) => d.id === step.department.toLowerCase() || d.name === step.department);
          const deptColor = dept?.color ?? "#71717a";
          const isLast = i === workflow.steps.length - 1;

          return (
            <div key={step.agentId + i} className="flex gap-3">
              {/* Vertical timeline */}
              <div className="flex flex-col items-center">
                <div
                  className="h-3 w-3 rounded-full border-2 shrink-0"
                  style={{ borderColor: deptColor, backgroundColor: i === 0 ? deptColor : "white" }}
                />
                {!isLast && <div className="w-px flex-1 bg-zinc-200 my-1" />}
              </div>

              {/* Step content */}
              <div className={`pb-${isLast ? "0" : "4"} min-w-0 flex-1`}>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-zinc-900">{step.agentName}</span>
                  <span
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: deptColor + "18", color: deptColor }}
                  >
                    {step.department}
                  </span>
                </div>
                <p className="text-[12px] text-zinc-500 mt-0.5">{step.action}</p>
                {!isLast && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-400">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                    passes to next
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkflowView({ departments, workflows }: { departments: Department[]; workflows: Workflow[] }) {
  const crossDeptFlows = workflows.filter((w) => {
    const depts = new Set(w.steps.map((s) => s.department));
    return depts.size > 1;
  });

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div>
          <p className="text-[11px] text-zinc-500">Active Workflows</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">{workflows.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Cross-Department</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">{crossDeptFlows.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Total Steps</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">
            {workflows.reduce((sum, w) => sum + w.steps.length, 0)}
          </p>
        </div>
      </div>

      {/* Agent interaction matrix */}
      <div className="mb-8">
        <h3 className="text-xs font-medium text-zinc-500 mb-3">Agent Connections</h3>
        <AgentFlowDiagram departments={departments} workflows={workflows} />
      </div>

      {/* Workflow cards */}
      <h3 className="text-xs font-medium text-zinc-500 mb-3">Workflow Details</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {workflows.map((wf) => (
          <WorkflowCard key={wf.id} workflow={wf} departments={departments} />
        ))}
      </div>
    </div>
  );
}

function AgentFlowDiagram({ departments, workflows }: { departments: Department[]; workflows: Workflow[] }) {
  // Build unique agents and their connections from workflows
  const agentMap = new Map<string, { name: string; department: string }>();
  const connections: { from: string; to: string; workflow: string }[] = [];

  for (const wf of workflows) {
    for (const step of wf.steps) {
      agentMap.set(step.agentId, { name: step.agentName, department: step.department });
      if (step.outputTo) {
        connections.push({ from: step.agentId, to: step.outputTo, workflow: wf.name });
      }
    }
  }

  const agents = Array.from(agentMap.entries());

  // Group agents by department for layout
  const deptGroups = new Map<string, { id: string; name: string }[]>();
  for (const [id, info] of agents) {
    const group = deptGroups.get(info.department) ?? [];
    group.push({ id, name: info.name });
    deptGroups.set(info.department, group);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
      {/* Department groups as rows */}
      <div className="space-y-3">
        {Array.from(deptGroups.entries()).map(([dept, deptAgents]) => {
          const deptData = departments.find((d) => d.name === dept);
          const color = deptData?.color ?? "#71717a";

          return (
            <div key={dept} className="flex items-center gap-3">
              {/* Department label */}
              <div className="w-24 shrink-0">
                <span
                  className="text-[11px] font-semibold px-2 py-1 rounded"
                  style={{ backgroundColor: color + "15", color }}
                >
                  {dept}
                </span>
              </div>

              {/* Agent nodes */}
              <div className="flex items-center gap-2 flex-wrap">
                {deptAgents.map((agent) => {
                  const outgoing = connections.filter((c) => c.from === agent.id);
                  const incoming = connections.filter((c) => c.to === agent.id);

                  return (
                    <div
                      key={agent.id}
                      className="group relative flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 hover:border-zinc-400 transition-colors cursor-default"
                    >
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[12px] text-zinc-800">{agent.name}</span>

                      {/* Connection count badges */}
                      {(outgoing.length > 0 || incoming.length > 0) && (
                        <span className="text-[9px] text-zinc-400 ml-1">
                          {incoming.length > 0 && `${incoming.length}↓`}
                          {outgoing.length > 0 && `${outgoing.length}→`}
                        </span>
                      )}

                      {/* Tooltip on hover */}
                      {(outgoing.length > 0 || incoming.length > 0) && (
                        <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block w-52 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
                          {incoming.length > 0 && (
                            <div className="mb-1">
                              <p className="text-[9px] font-medium text-zinc-500 uppercase">Receives from</p>
                              {incoming.map((c, i) => {
                                const fromAgent = agentMap.get(c.from);
                                return (
                                  <p key={i} className="text-[11px] text-zinc-700">
                                    {fromAgent?.name} <span className="text-zinc-400">({c.workflow})</span>
                                  </p>
                                );
                              })}
                            </div>
                          )}
                          {outgoing.length > 0 && (
                            <div>
                              <p className="text-[9px] font-medium text-zinc-500 uppercase">Sends to</p>
                              {outgoing.map((c, i) => {
                                const toAgent = agentMap.get(c.to);
                                return (
                                  <p key={i} className="text-[11px] text-zinc-700">
                                    {toAgent?.name} <span className="text-zinc-400">({c.workflow})</span>
                                  </p>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection lines summary */}
      <div className="mt-4 pt-3 border-t border-zinc-200">
        <p className="text-[10px] text-zinc-500 mb-2">Data flows ({connections.length} connections)</p>
        <div className="flex flex-wrap gap-2">
          {connections.map((c, i) => {
            const from = agentMap.get(c.from);
            const to = agentMap.get(c.to);
            return (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] text-zinc-600 bg-white border border-zinc-200 rounded px-2 py-0.5">
                {from?.name}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
                {to?.name}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Main View ---

type Tab = "structure" | "workflows";

interface OperationsData {
  departments: Department[];
  workflows: Workflow[];
}

export function OperationsView() {
  const [tab, setTab] = useState<Tab>("structure");
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

  // Use API data if available, otherwise fallback to demo
  const departments = data?.departments ?? DEPARTMENTS;
  const workflows = data?.workflows?.length ? data.workflows : WORKFLOWS;

  return (
    <div className="mx-auto max-w-[960px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Operations</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Company structure and AI workflow visualization.
          </p>
        </div>
        {!data && !loading && (
          <span className="text-[10px] text-zinc-400 border border-zinc-200 rounded px-2 py-1">
            Demo data
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-1 border-b border-zinc-200">
        <button
          onClick={() => setTab("structure")}
          className={`px-3 py-2 text-[13px] font-medium transition-colors relative ${
            tab === "structure"
              ? "text-zinc-900"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Org Structure
          {tab === "structure" && (
            <span className="absolute bottom-0 left-0 right-0 h-px bg-zinc-900" />
          )}
        </button>
        <button
          onClick={() => setTab("workflows")}
          className={`px-3 py-2 text-[13px] font-medium transition-colors relative ${
            tab === "workflows"
              ? "text-zinc-900"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Workflows
          {tab === "workflows" && (
            <span className="absolute bottom-0 left-0 right-0 h-px bg-zinc-900" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          </div>
        ) : (
          <>
            {tab === "structure" && <OrgStructureView departments={departments} />}
            {tab === "workflows" && <WorkflowView departments={departments} workflows={workflows} />}
          </>
        )}
      </div>
    </div>
  );
}
