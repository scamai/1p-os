"use client";

import { useState, useEffect } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

type TaskStatus = "todo" | "in-progress" | "done";

type Task = {
  id: string;
  text: string;
  status: TaskStatus;
};

type Phase = {
  id: string;
  name: string;
  tasks: Task[];
};

type Channel = {
  id: string;
  name: string;
  priority: "high" | "medium" | "low";
  budget: number;
  notes: string;
};

type TimelineItem = {
  id: string;
  date: string;
  milestone: string;
  done: boolean;
};

type GTMData = {
  phases: Phase[];
  channels: Channel[];
  timeline: TimelineItem[];
};

const STORAGE_KEY = "1pos-gtm";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const INITIAL: GTMData = {
  phases: [
    {
      id: "pre-launch",
      name: "Pre-Launch",
      tasks: [
        { id: uid(), text: "Define ideal customer profile", status: "todo" },
        { id: uid(), text: "Build landing page", status: "todo" },
        { id: uid(), text: "Set up analytics", status: "todo" },
        { id: uid(), text: "Create waitlist / early access", status: "todo" },
        { id: uid(), text: "Prepare launch assets (screenshots, copy, video)", status: "todo" },
      ],
    },
    {
      id: "launch",
      name: "Launch",
      tasks: [
        { id: uid(), text: "Submit to Product Hunt", status: "todo" },
        { id: uid(), text: "Email launch announcement", status: "todo" },
        { id: uid(), text: "Social media blitz", status: "todo" },
        { id: uid(), text: "Reach out to press / bloggers", status: "todo" },
        { id: uid(), text: "Activate community channels", status: "todo" },
      ],
    },
    {
      id: "post-launch",
      name: "Post-Launch",
      tasks: [
        { id: uid(), text: "Collect user feedback", status: "todo" },
        { id: uid(), text: "Iterate on onboarding", status: "todo" },
        { id: uid(), text: "Set up referral program", status: "todo" },
        { id: uid(), text: "Start content marketing", status: "todo" },
        { id: uid(), text: "Analyze acquisition metrics", status: "todo" },
      ],
    },
  ],
  channels: [],
  timeline: [],
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-zinc-100 text-zinc-600",
  "in-progress": "bg-zinc-900 text-white",
  done: "bg-zinc-300 text-zinc-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-zinc-900 text-white",
  medium: "bg-zinc-200 text-zinc-700",
  low: "bg-zinc-100 text-zinc-500",
};

export default function Page() {
  const [data, setData] = useState<GTMData>(INITIAL);
  const [loaded, setLoaded] = useState(false);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [channelDraft, setChannelDraft] = useState<{ name: string; priority: "high" | "medium" | "low"; budget: number; notes: string }>({ name: "", priority: "medium", budget: 0, notes: "" });
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [milestoneDraft, setMilestoneDraft] = useState({ date: "", milestone: "" });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData({ ...INITIAL, ...parsed });
      } catch {
        /* ignore */
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  function cycleStatus(phaseId: string, taskId: string) {
    const order: TaskStatus[] = ["todo", "in-progress", "done"];
    setData((prev) => ({
      ...prev,
      phases: prev.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, status: order[(order.indexOf(t.status) + 1) % 3] }
                  : t
              ),
            }
          : p
      ),
    }));
  }

  function addTask(phaseId: string) {
    const text = (taskDrafts[phaseId] || "").trim();
    if (!text) return;
    setData((prev) => ({
      ...prev,
      phases: prev.phases.map((p) =>
        p.id === phaseId
          ? { ...p, tasks: [...p.tasks, { id: uid(), text, status: "todo" }] }
          : p
      ),
    }));
    setTaskDrafts((prev) => ({ ...prev, [phaseId]: "" }));
  }

  function removeTask(phaseId: string, taskId: string) {
    setData((prev) => ({
      ...prev,
      phases: prev.phases.map((p) =>
        p.id === phaseId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          : p
      ),
    }));
  }

  function addChannel() {
    if (!channelDraft.name.trim()) return;
    setData((prev) => ({
      ...prev,
      channels: [
        ...prev.channels,
        { id: uid(), ...channelDraft, name: channelDraft.name.trim() },
      ],
    }));
    setChannelDraft({ name: "", priority: "medium", budget: 0, notes: "" });
    setShowChannelForm(false);
  }

  function removeChannel(id: string) {
    setData((prev) => ({
      ...prev,
      channels: prev.channels.filter((c) => c.id !== id),
    }));
  }

  function addMilestone() {
    if (!milestoneDraft.milestone.trim()) return;
    setData((prev) => ({
      ...prev,
      timeline: [
        ...prev.timeline,
        { id: uid(), ...milestoneDraft, milestone: milestoneDraft.milestone.trim(), done: false },
      ].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setMilestoneDraft({ date: "", milestone: "" });
  }

  function toggleMilestone(id: string) {
    setData((prev) => ({
      ...prev,
      timeline: prev.timeline.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      ),
    }));
  }

  function removeMilestone(id: string) {
    setData((prev) => ({
      ...prev,
      timeline: prev.timeline.filter((t) => t.id !== id),
    }));
  }

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <Education {...EDUCATION.gtm} />
      <h1 className="text-lg font-semibold text-zinc-900">Go-to-Market</h1>
      <p className="mt-1 text-sm text-zinc-500 mb-6">
        Plan your launch checklist, channels, and timeline.
      </p>

      {/* GTM Checklist */}
      <div className="space-y-4 mb-8">
        {data.phases.map((phase) => {
          const done = phase.tasks.filter((t) => t.status === "done").length;
          const total = phase.tasks.length;
          return (
            <div
              key={phase.id}
              className="border border-zinc-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-zinc-900">
                  {phase.name}
                </h2>
                <span className="text-xs text-zinc-400">
                  {done}/{total} complete
                </span>
              </div>
              <div className="w-full h-1 bg-zinc-100 rounded mb-3">
                <div
                  className="h-1 bg-zinc-900 rounded transition-all"
                  style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
                />
              </div>
              <ul className="space-y-1.5 mb-3">
                {phase.tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => cycleStatus(phase.id, task.id)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[task.status]}`}
                    >
                      {task.status}
                    </button>
                    <span
                      className={`text-sm flex-1 ${
                        task.status === "done"
                          ? "text-zinc-400 line-through"
                          : "text-zinc-700"
                      }`}
                    >
                      {task.text}
                    </span>
                    <button
                      onClick={() => removeTask(phase.id, task.id)}
                      className="text-xs text-zinc-300 hover:text-zinc-600 opacity-0 group-hover:opacity-100"
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
                  className="flex-1 text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <button
                  onClick={() => addTask(phase.id)}
                  className="text-xs px-2 py-1 bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200"
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Channel Strategy */}
      <div className="border border-zinc-200 rounded-lg p-4 bg-white mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900">Channel Strategy</h2>
          <button
            onClick={() => setShowChannelForm(!showChannelForm)}
            className="text-xs px-2 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800"
          >
            Add Channel
          </button>
        </div>

        {showChannelForm && (
          <div className="border border-zinc-200 rounded p-3 mb-3 bg-zinc-50">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Channel</label>
                <input
                  type="text"
                  value={channelDraft.name}
                  onChange={(e) =>
                    setChannelDraft((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. SEO, Paid Ads, Twitter..."
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Priority</label>
                <select
                  value={channelDraft.priority}
                  onChange={(e) =>
                    setChannelDraft((prev) => ({
                      ...prev,
                      priority: e.target.value as "high" | "medium" | "low",
                    }))
                  }
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Monthly Budget ($)</label>
                <input
                  type="number"
                  min={0}
                  value={channelDraft.budget}
                  onChange={(e) =>
                    setChannelDraft((prev) => ({
                      ...prev,
                      budget: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Notes</label>
                <input
                  type="text"
                  value={channelDraft.notes}
                  onChange={(e) =>
                    setChannelDraft((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowChannelForm(false)}
                className="text-xs px-2 py-1 border border-zinc-200 rounded text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={addChannel}
                className="text-xs px-2 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {data.channels.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-3">
            No channels added yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Channel</th>
                <th className="text-left px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Priority</th>
                <th className="text-left px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Budget</th>
                <th className="text-left px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.channels.map((ch) => (
                <tr key={ch.id} className="border-b border-zinc-100">
                  <td className="px-2 py-2 text-zinc-900 font-medium">{ch.name}</td>
                  <td className="px-2 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[ch.priority]}`}>
                      {ch.priority}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-zinc-700">${ch.budget.toLocaleString()}/mo</td>
                  <td className="px-2 py-2 text-zinc-500 text-xs">{ch.notes}</td>
                  <td className="px-2 py-2">
                    <button onClick={() => removeChannel(ch.id)} className="text-xs text-zinc-400 hover:text-zinc-700">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data.channels.length > 0 && (
          <div className="mt-2 text-xs text-zinc-400 text-right">
            Total budget: ${data.channels.reduce((s, c) => s + c.budget, 0).toLocaleString()}/mo
          </div>
        )}
      </div>

      {/* Launch Timeline */}
      <div className="border border-zinc-200 rounded-lg p-4 bg-white">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Launch Timeline</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="date"
            value={milestoneDraft.date}
            onChange={(e) => setMilestoneDraft((prev) => ({ ...prev, date: e.target.value }))}
            className="text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
          <input
            type="text"
            value={milestoneDraft.milestone}
            onChange={(e) => setMilestoneDraft((prev) => ({ ...prev, milestone: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && addMilestone()}
            placeholder="Milestone..."
            className="flex-1 text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
          <button
            onClick={addMilestone}
            className="text-xs px-2 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800"
          >
            Add
          </button>
        </div>
        {data.timeline.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-3">No milestones yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.timeline.map((item) => (
              <li key={item.id} className="flex items-center gap-3 group">
                <button
                  onClick={() => toggleMilestone(item.id)}
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    item.done ? "bg-zinc-900 border-zinc-900" : "border-zinc-300"
                  }`}
                >
                  {item.done && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="text-xs text-zinc-400 w-24 shrink-0">{item.date || "No date"}</span>
                <span className={`text-sm flex-1 ${item.done ? "text-zinc-400 line-through" : "text-zinc-700"}`}>
                  {item.milestone}
                </span>
                <button
                  onClick={() => removeMilestone(item.id)}
                  className="text-xs text-zinc-300 hover:text-zinc-600 opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
