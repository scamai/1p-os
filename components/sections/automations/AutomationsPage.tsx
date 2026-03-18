"use client";

import * as React from "react";
import { AISummary } from "@/components/shared/AISummary";
import { TabBar } from "@/components/shared/TabBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Job {
  id: string;
  name: string;
  schedule_kind: "cron" | "interval" | "once";
  schedule_expr: string | null;
  schedule_interval_ms: number | null;
  schedule_once_at: string | null;
  schedule_tz: string;
  agent_id: string | null;
  payload_message: string;
  payload_model: string | null;
  delivery_mode: string;
  status: "active" | "paused" | "error";
  last_run_at: string | null;
  last_status: string | null;
  next_run_at: string | null;
  consecutive_errors: number;
  created_at: string;
}

interface Trigger {
  id: string;
  name: string;
  event: string;
  condition: string | null;
  action_agent_id: string | null;
  action_message: string;
  status: "active" | "paused";
  last_fired_at: string | null;
  fire_count: number;
  created_at: string;
}

interface Run {
  id: string;
  job_id: string | null;
  trigger_id: string | null;
  agent_id: string | null;
  run_type: "schedule" | "trigger" | "manual";
  status: "ok" | "error" | "skipped";
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
}

// ─── Event options ───────────────────────────────────────────────────────────

const EVENT_OPTIONS = [
  { value: "invoice.overdue", label: "Invoice overdue" },
  { value: "invoice.paid", label: "Invoice paid" },
  { value: "lead.new", label: "New lead" },
  { value: "lead.qualified", label: "Lead qualified" },
  { value: "budget.exceeded", label: "Budget exceeded" },
  { value: "budget.warning", label: "Budget warning (80%)" },
  { value: "agent.error", label: "Agent error" },
  { value: "agent.paused", label: "Agent paused" },
  { value: "contract.expiring", label: "Contract expiring" },
  { value: "payment.received", label: "Payment received" },
  { value: "email.received", label: "Email received" },
  { value: "slack.message", label: "Slack message" },
  { value: "custom", label: "Custom event..." },
];

const TABS = ["Schedules", "Triggers", "History"] as const;
type AutomationTab = (typeof TABS)[number];

// ─── Component ───────────────────────────────────────────────────────────────

function AutomationsPage() {
  const [activeTab, setActiveTab] = React.useState<AutomationTab>("Schedules");
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [triggers, setTriggers] = React.useState<Trigger[]>([]);
  const [runs, setRuns] = React.useState<Run[]>([]);
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modals
  const [showJobModal, setShowJobModal] = React.useState(false);
  const [showTriggerModal, setShowTriggerModal] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ id: string; type: "job" | "trigger"; name: string } | null>(null);

  const fetchAll = React.useCallback(async () => {
    try {
      const res = await fetch("/api/automations");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? []);
        setTriggers(data.triggers ?? []);
        setRuns(data.runs ?? []);
        setAgents(data.agents ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleStatus = async (id: string, itemType: "job" | "trigger", currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    await fetch("/api/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, itemType, status: newStatus }),
    });
    await fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await fetch("/api/automations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteConfirm.id, itemType: deleteConfirm.type }),
    });
    setDeleteConfirm(null);
    await fetchAll();
  };

  const activeJobCount = jobs.filter((j) => j.status === "active").length;
  const activeTriggerCount = triggers.filter((t) => t.status === "active").length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Automations</h1>
          <p className="text-sm text-zinc-500">
            {activeJobCount} schedule{activeJobCount !== 1 ? "s" : ""}, {activeTriggerCount} trigger{activeTriggerCount !== 1 ? "s" : ""} active
          </p>
        </div>
      </div>

      <div className="mt-2">
        <AISummary section="automations" />
      </div>

      <div className="mt-6">
        <TabBar
          tabs={TABS as unknown as string[]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as AutomationTab)}
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-100" />
            ))}
          </div>
        ) : (
          <>
            {activeTab === "Schedules" && (
              <SchedulesTab
                jobs={jobs}
                agents={agents}
                onToggle={(id, status) => toggleStatus(id, "job", status)}
                onDelete={(id, name) => setDeleteConfirm({ id, type: "job", name })}
                onCreate={() => setShowJobModal(true)}
              />
            )}
            {activeTab === "Triggers" && (
              <TriggersTab
                triggers={triggers}
                agents={agents}
                onToggle={(id, status) => toggleStatus(id, "trigger", status)}
                onDelete={(id, name) => setDeleteConfirm({ id, type: "trigger", name })}
                onCreate={() => setShowTriggerModal(true)}
              />
            )}
            {activeTab === "History" && (
              <HistoryTab runs={runs} jobs={jobs} triggers={triggers} agents={agents} />
            )}
          </>
        )}
      </div>

      {/* ─── Create Job Modal ──────────────────────────────────────────────────── */}
      <CreateJobModal
        open={showJobModal}
        agents={agents}
        onClose={() => setShowJobModal(false)}
        onCreated={fetchAll}
      />

      {/* ─── Create Trigger Modal ──────────────────────────────────────────────── */}
      <CreateTriggerModal
        open={showTriggerModal}
        agents={agents}
        onClose={() => setShowTriggerModal(false)}
        onCreated={fetchAll}
      />

      {/* ─── Delete Confirmation ───────────────────────────────────────────────── */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={`Delete ${deleteConfirm?.type}?`}
        description={`This will permanently delete "${deleteConfirm?.name}". This cannot be undone.`}
      >
        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-800"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Schedules Tab ───────────────────────────────────────────────────────────

function SchedulesTab({
  jobs,
  agents,
  onToggle,
  onDelete,
  onCreate,
}: {
  jobs: Job[];
  agents: Agent[];
  onToggle: (id: string, currentStatus: string) => void;
  onDelete: (id: string, name: string) => void;
  onCreate: () => void;
}) {
  const getAgentName = (id: string | null) =>
    agents.find((a) => a.id === id)?.name ?? "Any agent";

  return (
    <div>
      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-sm text-zinc-600">No schedules yet</p>
          <Button onClick={onCreate} className="mt-4 text-xs">
            + New Schedule
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-zinc-900 truncate">{job.name}</p>
                    <Badge
                      variant={
                        job.status === "active"
                          ? "success"
                          : job.status === "error"
                            ? "destructive"
                            : "default"
                      }
                    >
                      {job.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    <span className="font-mono">{formatSchedule(job)}</span>
                    <span className="mx-1">&middot;</span>
                    <span>{getAgentName(job.agent_id)}</span>
                    {job.last_run_at && (
                      <>
                        <span className="mx-1">&middot;</span>
                        <span>Last: {timeAgo(job.last_run_at)}</span>
                        {job.last_status && (
                          <span className={job.last_status === "error" ? "text-zinc-900 ml-1" : "text-zinc-900 ml-1"}>
                            ({job.last_status})
                          </span>
                        )}
                      </>
                    )}
                    {job.consecutive_errors > 0 && (
                      <span className="text-zinc-900 ml-1">
                        {job.consecutive_errors} error{job.consecutive_errors !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => onToggle(job.id, job.status)}
                    className="text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    {job.status === "active" ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => onDelete(job.id, job.name)}
                    className="text-[11px] text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-4 text-[13px] text-zinc-500 hover:text-zinc-700 transition-colors"
            onClick={onCreate}
          >
            + New Schedule
          </button>
        </>
      )}
    </div>
  );
}

// ─── Triggers Tab ────────────────────────────────────────────────────────────

function TriggersTab({
  triggers,
  agents,
  onToggle,
  onDelete,
  onCreate,
}: {
  triggers: Trigger[];
  agents: Agent[];
  onToggle: (id: string, currentStatus: string) => void;
  onDelete: (id: string, name: string) => void;
  onCreate: () => void;
}) {
  const getAgentName = (id: string | null) =>
    agents.find((a) => a.id === id)?.name ?? "Any agent";

  return (
    <div>
      {triggers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-sm text-zinc-600">No triggers yet</p>
          <Button onClick={onCreate} className="mt-4 text-xs">
            + New Trigger
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col">
            {triggers.map((trigger) => (
              <div
                key={trigger.id}
                className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-zinc-900 truncate">{trigger.name}</p>
                    <Badge variant={trigger.status === "active" ? "success" : "default"}>
                      {trigger.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    <span className="font-mono">{trigger.event}</span>
                    {trigger.condition && (
                      <span className="text-zinc-400"> when {trigger.condition}</span>
                    )}
                    <span className="mx-1">&rarr;</span>
                    <span>{getAgentName(trigger.action_agent_id)}: {trigger.action_message}</span>
                  </p>
                  {trigger.fire_count > 0 && (
                    <p className="text-[10px] text-zinc-400">
                      Fired {trigger.fire_count}x
                      {trigger.last_fired_at && <> &middot; last {timeAgo(trigger.last_fired_at)}</>}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => onToggle(trigger.id, trigger.status)}
                    className="text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    {trigger.status === "active" ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => onDelete(trigger.id, trigger.name)}
                    className="text-[11px] text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-4 text-[13px] text-zinc-500 hover:text-zinc-700 transition-colors"
            onClick={onCreate}
          >
            + New Trigger
          </button>
        </>
      )}
    </div>
  );
}

// ─── History Tab ─────────────────────────────────────────────────────────────

function HistoryTab({
  runs,
  jobs,
  triggers,
  agents,
}: {
  runs: Run[];
  jobs: Job[];
  triggers: Trigger[];
  agents: Agent[];
}) {
  const getName = (run: Run): string => {
    if (run.job_id) return jobs.find((j) => j.id === run.job_id)?.name ?? "Unknown job";
    if (run.trigger_id) return triggers.find((t) => t.id === run.trigger_id)?.name ?? "Unknown trigger";
    return "Manual run";
  };

  const getAgentName = (id: string | null) =>
    agents.find((a) => a.id === id)?.name ?? "—";

  if (runs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <p className="text-sm text-zinc-600">No runs yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Name</th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Type</th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Agent</th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Status</th>
            <th className="px-3 py-2 text-right font-medium text-zinc-500">When</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="border-b border-zinc-100 last:border-0">
              <td className="px-3 py-2 text-zinc-900">{getName(run)}</td>
              <td className="px-3 py-2 text-zinc-500">{run.run_type}</td>
              <td className="px-3 py-2 text-zinc-500">{getAgentName(run.agent_id)}</td>
              <td className="px-3 py-2">
                <Badge
                  variant={
                    run.status === "ok"
                      ? "success"
                      : run.status === "error"
                        ? "destructive"
                        : "default"
                  }
                >
                  {run.status}
                </Badge>
                {run.error_message && (
                  <p className="mt-0.5 text-[10px] text-zinc-900 truncate max-w-[200px]">
                    {run.error_message}
                  </p>
                )}
              </td>
              <td className="px-3 py-2 text-right text-zinc-500">
                {timeAgo(run.started_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Create Job Modal ────────────────────────────────────────────────────────

function CreateJobModal({
  open,
  agents,
  onClose,
  onCreated,
}: {
  open: boolean;
  agents: Agent[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [scheduleKind, setScheduleKind] = React.useState<"cron" | "interval" | "once">("cron");
  const [cronExpr, setCronExpr] = React.useState("0 9 * * *");
  const [intervalHours, setIntervalHours] = React.useState("2");
  const [onceAt, setOnceAt] = React.useState("");
  const [agentId, setAgentId] = React.useState<string>("");
  const [message, setMessage] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setName("");
    setScheduleKind("cron");
    setCronExpr("0 9 * * *");
    setIntervalHours("2");
    setOnceAt("");
    setAgentId("");
    setMessage("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !message.trim()) {
      setError("Name and task message are required");
      return;
    }

    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {
      type: "job",
      name: name.trim(),
      scheduleKind,
      payloadMessage: message.trim(),
      agentId: agentId || null,
    };

    if (scheduleKind === "cron") body.scheduleExpr = cronExpr;
    if (scheduleKind === "interval") body.scheduleIntervalMs = parseFloat(intervalHours) * 3600000;
    if (scheduleKind === "once") body.scheduleOnceAt = onceAt;

    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create");
        return;
      }

      reset();
      onClose();
      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="New Schedule"
      description="Run a task on a schedule."
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Name"
          placeholder="e.g. Morning Briefing, Invoice Reminders"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-900">Schedule</label>
          <div className="flex gap-1">
            {(["cron", "interval", "once"] as const).map((kind) => (
              <button
                key={kind}
                onClick={() => setScheduleKind(kind)}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  scheduleKind === kind
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {kind === "cron" ? "Cron" : kind === "interval" ? "Interval" : "One-time"}
              </button>
            ))}
          </div>
        </div>

        {scheduleKind === "cron" && (
          <div>
            <Input
              label="Cron expression"
              placeholder="0 9 * * * (every day at 9 AM)"
              value={cronExpr}
              onChange={(e) => setCronExpr(e.target.value)}
            />
            <p className="mt-1 text-[10px] text-zinc-400">
              Format: minute hour day-of-month month day-of-week
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {CRON_PRESETS.map((p) => (
                <button
                  key={p.expr}
                  onClick={() => setCronExpr(p.expr)}
                  className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                    cronExpr === p.expr ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {scheduleKind === "interval" && (
          <Input
            label="Every N hours"
            type="number"
            min="0.25"
            step="0.25"
            value={intervalHours}
            onChange={(e) => setIntervalHours(e.target.value)}
          />
        )}

        {scheduleKind === "once" && (
          <Input
            label="Run at"
            type="datetime-local"
            value={onceAt}
            onChange={(e) => setOnceAt(e.target.value)}
          />
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-900">Agent</label>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm text-zinc-900"
          >
            <option value="">Any available agent</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.role})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Task message"
          placeholder="What should the agent do? e.g. Generate morning briefing report"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {error && <p className="text-xs text-zinc-800">{error}</p>}

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            onClick={() => { reset(); onClose(); }}
            className="rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </button>
          <Button onClick={handleSubmit} loading={saving} className="text-xs">
            Create Schedule
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Create Trigger Modal ────────────────────────────────────────────────────

function CreateTriggerModal({
  open,
  agents,
  onClose,
  onCreated,
}: {
  open: boolean;
  agents: Agent[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [event, setEvent] = React.useState("invoice.overdue");
  const [customEvent, setCustomEvent] = React.useState("");
  const [condition, setCondition] = React.useState("");
  const [agentId, setAgentId] = React.useState("");
  const [actionMessage, setActionMessage] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setName("");
    setEvent("invoice.overdue");
    setCustomEvent("");
    setCondition("");
    setAgentId("");
    setActionMessage("");
    setError(null);
  };

  const handleSubmit = async () => {
    const actualEvent = event === "custom" ? customEvent.trim() : event;
    if (!name.trim() || !actualEvent || !actionMessage.trim()) {
      setError("Name, event, and action message are required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "trigger",
          name: name.trim(),
          event: actualEvent,
          condition: condition.trim() || undefined,
          actionAgentId: agentId || null,
          actionMessage: actionMessage.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create");
        return;
      }

      reset();
      onClose();
      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="New Trigger"
      description="Run a task when an event fires."
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Name"
          placeholder="e.g. Follow up on overdue invoices"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-900">When this event fires</label>
          <select
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm text-zinc-900"
          >
            {EVENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {event === "custom" && (
          <Input
            label="Custom event name"
            placeholder="e.g. order.shipped"
            value={customEvent}
            onChange={(e) => setCustomEvent(e.target.value)}
          />
        )}

        <Input
          label="Condition (optional)"
          placeholder="e.g. amount > 5000"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-900">Agent to handle</label>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm text-zinc-900"
          >
            <option value="">Any available agent</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.role})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Action message"
          placeholder="What should the agent do? e.g. Send a reminder email"
          value={actionMessage}
          onChange={(e) => setActionMessage(e.target.value)}
        />

        {error && <p className="text-xs text-zinc-800">{error}</p>}

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            onClick={() => { reset(); onClose(); }}
            className="rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </button>
          <Button onClick={handleSubmit} loading={saving} className="text-xs">
            Create Trigger
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Cron Presets ────────────────────────────────────────────────────────────

const CRON_PRESETS = [
  { label: "Daily 9AM", expr: "0 9 * * *" },
  { label: "Daily 8AM", expr: "0 8 * * *" },
  { label: "Every hour", expr: "0 * * * *" },
  { label: "Every 2h", expr: "0 */2 * * *" },
  { label: "Mon 9AM", expr: "0 9 * * 1" },
  { label: "Mon-Fri 9AM", expr: "0 9 * * 1-5" },
  { label: "Fri 5PM", expr: "0 17 * * 5" },
  { label: "1st of month", expr: "0 9 1 * *" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSchedule(job: Job): string {
  if (job.schedule_kind === "cron" && job.schedule_expr) {
    return describeCron(job.schedule_expr);
  }
  if (job.schedule_kind === "interval" && job.schedule_interval_ms) {
    const hours = job.schedule_interval_ms / 3600000;
    if (hours < 1) return `Every ${Math.round(hours * 60)} min`;
    if (hours === 1) return "Every hour";
    return `Every ${hours}h`;
  }
  if (job.schedule_kind === "once" && job.schedule_once_at) {
    return `Once: ${new Date(job.schedule_once_at).toLocaleString()}`;
  }
  return job.schedule_kind;
}

function describeCron(expr: string): string {
  const COMMON: Record<string, string> = {
    "0 9 * * *": "Daily at 9:00 AM",
    "0 8 * * *": "Daily at 8:00 AM",
    "0 * * * *": "Every hour",
    "0 */2 * * *": "Every 2 hours",
    "0 9 * * 1": "Every Monday 9:00 AM",
    "0 9 * * 1-5": "Weekdays 9:00 AM",
    "0 17 * * 5": "Every Friday 5:00 PM",
    "0 9 1 * *": "1st of month 9:00 AM",
  };
  return COMMON[expr] ?? expr;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

export { AutomationsPage };
