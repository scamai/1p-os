"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/launch/ProgressBar";

interface Phase {
  id: string;
  title: string;
  slug: string;
  description: string;
  sort_order: number;
  estimated_hours: number;
}

interface Step {
  id: string;
  phase_id: string;
  title: string;
  slug: string;
  sort_order: number;
  estimated_minutes: number;
  visibility_rules: Record<string, unknown> | null;
}

interface Progress {
  step_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

interface Reminder {
  id: string;
  title: string;
  due_date: string;
  is_completed: boolean;
}

interface FounderProfile {
  id: string;
  user_id: string;
  company_name: string;
  founder_type: string;
  business_type: string;
  raising_vc: boolean;
  state: string;
  incorporation_path: string;
  cofounder_count: number | null;
}

interface LaunchDashboardProps {
  profile: FounderProfile;
  phases: Phase[];
  steps: Step[];
  progress: Progress[];
  reminders: Reminder[];
}

function isStepVisible(
  step: Step,
  profile: FounderProfile
): boolean {
  if (!step.visibility_rules) return true;
  const rules = step.visibility_rules as Record<string, unknown>;

  for (const [key, value] of Object.entries(rules)) {
    const profileValue = (profile as unknown as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      if (!value.includes(profileValue)) return false;
    } else if (profileValue !== value) {
      return false;
    }
  }
  return true;
}

export function LaunchDashboard({
  profile,
  phases,
  steps,
  progress,
  reminders,
}: LaunchDashboardProps) {
  const completedIds = new Set(
    progress.filter((p) => p.is_completed).map((p) => p.step_id)
  );

  const visibleSteps = steps.filter((s) => isStepVisible(s, profile));
  const totalVisible = visibleSteps.length;
  const totalCompleted = visibleSteps.filter((s) =>
    completedIds.has(s.id)
  ).length;

  function getPhaseSteps(phaseId: string) {
    return visibleSteps.filter((s) => s.phase_id === phaseId);
  }

  function getPhaseCompleted(phaseId: string) {
    return getPhaseSteps(phaseId).filter((s) => completedIds.has(s.id)).length;
  }

  function getPhaseTimeRemaining(phaseId: string) {
    const incomplete = getPhaseSteps(phaseId).filter(
      (s) => !completedIds.has(s.id)
    );
    const totalMinutes = incomplete.reduce(
      (sum, s) => sum + (s.estimated_minutes || 0),
      0
    );
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  function isPhaseStarted(phaseId: string) {
    return getPhaseCompleted(phaseId) > 0;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-base font-semibold text-black">
          {profile.company_name || "Your Company"}
        </h1>
        <p className="mt-1 text-[13px] text-black/50">
          FounderLaunch — your incorporation checklist
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-black/50">Overall progress</span>
          <span className="text-xs text-black/50 tabular-nums">
            {totalCompleted}/{totalVisible} steps
          </span>
        </div>
        <ProgressBar completed={totalCompleted} total={totalVisible} />
      </div>

      <div className="flex flex-col gap-3">
        {phases.map((phase) => {
          const phaseSteps = getPhaseSteps(phase.id);
          if (phaseSteps.length === 0) return null;
          const completed = getPhaseCompleted(phase.id);
          const total = phaseSteps.length;
          const started = isPhaseStarted(phase.id);
          const done = completed === total;
          const timeLeft = getPhaseTimeRemaining(phase.id);

          return (
            <Card key={phase.id} className={done ? "opacity-60" : ""}>
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{phase.title}</CardTitle>
                    <p className="mt-1 text-[13px] text-black/50">
                      {phase.description}
                    </p>
                  </div>
                  {done && (
                    <Badge variant="success" className="ml-3 shrink-0">
                      Done
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-black/50 tabular-nums">
                      {completed}/{total} steps
                    </span>
                    {!done && (
                      <span className="text-xs text-black/40">
                        ~{timeLeft} left
                      </span>
                    )}
                  </div>
                  <Link href={`/launch/phase/${phase.slug}`}>
                    <Button size="sm" variant={done ? "ghost" : "default"}>
                      {done ? "Review" : started ? "Continue" : "Start"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {reminders.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-black mb-3">
            Upcoming reminders
          </h2>
          <div className="flex flex-col gap-2">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between border border-black/[0.08] bg-white px-4 py-3"
              >
                <span className="text-sm text-black">{r.title}</span>
                <span className="text-xs text-black/40">
                  {new Date(r.due_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-12 text-xs text-black/40 leading-relaxed">
        FounderLaunch provides general information and templates for educational
        purposes. This is not legal, tax, or financial advice.
      </p>
    </div>
  );
}
