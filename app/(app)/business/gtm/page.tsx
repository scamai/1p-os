"use client";

import { useState, useEffect, useRef } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";
import { useTableData } from "@/lib/hooks/useTableData";

type TaskStatus = "todo" | "in-progress" | "done";

type GtmTask = {
  id: string;
  phase: string;
  title: string;
  status: TaskStatus;
  sort_order: number;
};

type Phase = {
  id: string;
  name: string;
};

const PHASES: Phase[] = [
  { id: "pre-launch", name: "Pre-Launch" },
  { id: "launch", name: "Launch" },
  { id: "post-launch", name: "Post-Launch" },
];

const DEFAULT_TASKS: Omit<GtmTask, "id">[] = [
  { phase: "pre-launch", title: "Define ideal customer profile", status: "todo", sort_order: 0 },
  { phase: "pre-launch", title: "Build landing page", status: "todo", sort_order: 1 },
  { phase: "pre-launch", title: "Set up analytics", status: "todo", sort_order: 2 },
  { phase: "pre-launch", title: "Create waitlist / early access", status: "todo", sort_order: 3 },
  { phase: "pre-launch", title: "Prepare launch assets (screenshots, copy, video)", status: "todo", sort_order: 4 },
  { phase: "launch", title: "Submit to Product Hunt", status: "todo", sort_order: 5 },
  { phase: "launch", title: "Email launch announcement", status: "todo", sort_order: 6 },
  { phase: "launch", title: "Social media blitz", status: "todo", sort_order: 7 },
  { phase: "launch", title: "Reach out to press / bloggers", status: "todo", sort_order: 8 },
  { phase: "launch", title: "Activate community channels", status: "todo", sort_order: 9 },
  { phase: "post-launch", title: "Collect user feedback", status: "todo", sort_order: 10 },
  { phase: "post-launch", title: "Iterate on onboarding", status: "todo", sort_order: 11 },
  { phase: "post-launch", title: "Set up referral program", status: "todo", sort_order: 12 },
  { phase: "post-launch", title: "Start content marketing", status: "todo", sort_order: 13 },
  { phase: "post-launch", title: "Analyze acquisition metrics", status: "todo", sort_order: 14 },
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-black/[0.04] text-black/60",
  "in-progress": "bg-black text-white",
  done: "bg-black/30 text-black/70",
};

export default function Page() {
  const { data: tasks, loading, create, update, remove } = useTableData<GtmTask>(
    "gtm_tasks",
    { orderBy: "sort_order", ascending: true }
  );
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const seededRef = useRef(false);

  // Seed default tasks if table is empty
  useEffect(() => {
    if (!loading && tasks.length === 0 && !seededRef.current) {
      seededRef.current = true;
      (async () => {
        for (const t of DEFAULT_TASKS) {
          await create(t);
        }
      })();
    }
  }, [loading, tasks.length, create]);

  function cycleStatus(taskId: string) {
    const order: TaskStatus[] = ["todo", "in-progress", "done"];
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const nextStatus = order[(order.indexOf(task.status) + 1) % 3];
    update(taskId, { status: nextStatus });
  }

  async function addTask(phaseId: string) {
    const text = (taskDrafts[phaseId] || "").trim();
    if (!text) return;
    const phaseTasks = tasks.filter((t) => t.phase === phaseId);
    const maxOrder = phaseTasks.length > 0 ? Math.max(...phaseTasks.map((t) => t.sort_order)) + 1 : 0;
    await create({ phase: phaseId, title: text, status: "todo", sort_order: maxOrder });
    setTaskDrafts((prev) => ({ ...prev, [phaseId]: "" }));
  }

  function removeTask(taskId: string) {
    remove(taskId);
  }

  if (loading) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <Education {...EDUCATION.gtm} />
      <h1 className="text-lg font-semibold text-black">Go-to-Market</h1>
      <p className="mt-1 text-sm text-black/50 mb-6">
        Plan your launch checklist, channels, and timeline.
      </p>

      {/* GTM Checklist */}
      <div className="space-y-4 mb-8">
        {PHASES.map((phase) => {
          const phaseTasks = tasks.filter((t) => t.phase === phase.id);
          const done = phaseTasks.filter((t) => t.status === "done").length;
          const total = phaseTasks.length;
          return (
            <div
              key={phase.id}
              className="border border-black/[0.08] rounded-lg p-4 bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-black">
                  {phase.name}
                </h2>
                <span className="text-xs text-black/40">
                  {done}/{total} complete
                </span>
              </div>
              <div className="w-full h-1 bg-black/[0.04] rounded mb-3">
                <div
                  className="h-1 bg-black rounded transition-all"
                  style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
                />
              </div>
              <ul className="space-y-1.5 mb-3">
                {phaseTasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => cycleStatus(task.id)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[task.status]}`}
                    >
                      {task.status}
                    </button>
                    <span
                      className={`text-sm flex-1 ${
                        task.status === "done"
                          ? "text-black/40 line-through"
                          : "text-black/70"
                      }`}
                    >
                      {task.title}
                    </span>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="text-xs text-black/30 hover:text-black/60 opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={taskDrafts[phase.id] || ""}
                  onChange={(e) =>
                    setTaskDrafts((prev) => ({ ...prev, [phase.id]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && addTask(phase.id)}
                  placeholder="Add task..."
                  className="flex-1 text-sm border border-black/[0.08] rounded px-2 py-1 text-black placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-black/40"
                />
                <button
                  onClick={() => addTask(phase.id)}
                  className="text-xs px-2 py-1 bg-black/[0.04] text-black/70 rounded hover:bg-black/[0.08]"
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
