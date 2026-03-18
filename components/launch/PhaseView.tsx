"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

interface Phase {
  id: string;
  title: string;
  slug: string;
  description: string;
}

interface Step {
  id: string;
  phase_id: string;
  title: string;
  slug: string;
  sort_order: number;
  estimated_minutes: number;
  cost_estimate: string | null;
  trap_warning: string | null;
  visibility_rules: Record<string, unknown> | null;
}

interface Progress {
  step_id: string;
  is_completed: boolean;
}

interface FounderProfile {
  founder_type: string;
  business_type: string;
  raising_vc: boolean;
  state: string;
  incorporation_path: string;
  [key: string]: unknown;
}

interface PhaseViewProps {
  phase: Phase;
  steps: Step[];
  progress: Progress[];
  profile: FounderProfile;
}

function isStepVisible(
  step: Step,
  profile: FounderProfile
): boolean {
  if (!step.visibility_rules) return true;
  const rules = step.visibility_rules as Record<string, unknown>;

  for (const [key, value] of Object.entries(rules)) {
    const profileValue = profile[key];
    if (Array.isArray(value)) {
      if (!value.includes(profileValue)) return false;
    } else if (profileValue !== value) {
      return false;
    }
  }
  return true;
}

export function PhaseView({ phase, steps, progress, profile }: PhaseViewProps) {
  const router = useRouter();
  const completedIds = new Set(
    progress.filter((p) => p.is_completed).map((p) => p.step_id)
  );

  const visibleSteps = steps.filter((s) => isStepVisible(s, profile));

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Back link */}
      <button
        onClick={() => router.push("/launch")}
        className="mb-6 flex items-center gap-1.5 text-xs text-slate-500 transition-colors duration-150 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M7.5 2L3.5 6l4 4" />
        </svg>
        Back to dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-base font-semibold text-slate-900">
          {phase.title}
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">{phase.description}</p>
      </div>

      <div className="flex flex-col">
        {visibleSteps.map((step, index) => {
          const isCompleted = completedIds.has(step.id);
          const isLast = index === visibleSteps.length - 1;

          return (
            <Link
              key={step.id}
              href={`/launch/phase/${phase.slug}/${step.slug}`}
              className={`group flex items-start gap-3 border-b border-slate-100 px-1 py-3 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 ${
                isLast ? "border-b-0" : ""
              }`}
            >
              {/* Checkbox indicator */}
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-slate-300">
                {isCompleted && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-900"
                  >
                    <path d="M2 5.5l2 2L8 3" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm ${
                    isCompleted
                      ? "text-slate-400 line-through"
                      : "text-slate-900"
                  }`}
                >
                  {step.title}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  {step.estimated_minutes > 0 && (
                    <Badge variant="outline">
                      {step.estimated_minutes}m
                    </Badge>
                  )}
                  {step.cost_estimate && (
                    <Badge variant="outline">{step.cost_estimate}</Badge>
                  )}
                  {step.trap_warning && (
                    <span className="inline-flex h-4 w-4 items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-600">
                      !
                    </span>
                  )}
                </div>
              </div>

              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mt-1 shrink-0 text-slate-300 transition-colors duration-150 group-hover:text-slate-500"
              >
                <path d="M4.5 2l4 4-4 4" />
              </svg>
            </Link>
          );
        })}
      </div>

      {visibleSteps.length === 0 && (
        <p className="text-sm text-slate-500">
          No steps in this phase match your profile.
        </p>
      )}
    </div>
  );
}
