"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string;
  severity: string;
  is_completed: boolean;
  is_recurring: boolean;
  recurrence_interval: string | null;
  completed_at: string | null;
  created_at: string;
}

interface RemindersViewProps {
  reminders: Reminder[];
}

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-l-2 border-l-slate-900",
  warning: "border-l-2 border-l-slate-500",
  info: "border-l-2 border-l-slate-300",
};

function severityVariant(severity: string): "default" | "warning" | "outline" {
  switch (severity) {
    case "critical":
      return "default";
    case "warning":
      return "warning";
    default:
      return "outline";
  }
}

export function RemindersView({ reminders: initialReminders }: RemindersViewProps) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formSeverity, setFormSeverity] = useState("info");

  const now = new Date();
  const thirtyDaysFromNow = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000
  );

  const upcoming = useMemo(() => {
    return reminders.filter((r) => {
      if (r.is_completed) return false;
      const due = new Date(r.due_date);
      return due <= thirtyDaysFromNow;
    });
  }, [reminders, thirtyDaysFromNow]);

  const completed = useMemo(() => {
    return reminders.filter((r) => r.is_completed);
  }, [reminders]);

  async function handleMarkComplete(id: string) {
    setCompletingId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("launch_reminders")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, is_completed: true, completed_at: new Date().toISOString() }
            : r
        )
      );
    } catch {
      // Silently handle
    } finally {
      setCompletingId(null);
    }
  }

  async function handleAddReminder() {
    if (!formTitle.trim() || !formDueDate) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("launch_reminders")
        .insert({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          due_date: formDueDate,
          severity: formSeverity,
          is_completed: false,
          is_recurring: false,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setReminders((prev) => [...prev, data as Reminder]);
        setFormTitle("");
        setFormDescription("");
        setFormDueDate("");
        setFormSeverity("info");
        setShowAddForm(false);
      }
    } catch {
      // Silently handle
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Reminders</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Compliance deadlines and important dates
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "Add reminder"}
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-6 border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-medium text-slate-900 mb-3">
            New reminder
          </h3>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Due date
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="h-9 w-full border border-slate-200 bg-transparent px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Severity
                </label>
                <select
                  value={formSeverity}
                  onChange={(e) => setFormSeverity(e.target.value)}
                  className="h-9 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAddReminder}
                loading={saving}
                disabled={!formTitle.trim() || !formDueDate}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-3">
          Upcoming (next 30 days)
        </h2>
        {upcoming.length === 0 ? (
          <div className="flex items-center justify-center border border-slate-200 px-4 py-12">
            <p className="text-[13px] text-slate-500">
              No reminders yet. Complete steps to auto-generate compliance
              deadlines.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((reminder) => (
              <div
                key={reminder.id}
                className={`flex items-center justify-between border border-slate-200 bg-white px-4 py-3 ${
                  SEVERITY_BORDER[reminder.severity] || ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-900">
                      {reminder.title}
                    </span>
                    <Badge variant={severityVariant(reminder.severity)}>
                      {reminder.severity}
                    </Badge>
                    {reminder.is_recurring && (
                      <span className="text-xs text-slate-400">
                        {reminder.recurrence_interval || "recurring"}
                      </span>
                    )}
                  </div>
                  {reminder.description && (
                    <p className="mt-0.5 text-xs text-slate-500 truncate">
                      {reminder.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className="text-xs text-slate-400 tabular-nums">
                    {new Date(reminder.due_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={completingId === reminder.id}
                    onClick={() => handleMarkComplete(reminder.id)}
                  >
                    Complete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors duration-150 mb-3"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={`transition-transform duration-150 ${
                completedExpanded ? "rotate-90" : ""
              }`}
            >
              <path d="M3 1l4 4-4 4" />
            </svg>
            Completed ({completed.length})
          </button>
          {completedExpanded && (
            <div className="flex flex-col gap-2">
              {completed.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3 opacity-60"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-slate-500 line-through">
                      {reminder.title}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {reminder.completed_at
                      ? new Date(reminder.completed_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )
                      : "--"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-12 text-xs text-slate-400 leading-relaxed">
        Reminders are generated based on your incorporation steps. Always
        confirm deadlines with official sources.
      </p>
    </div>
  );
}
