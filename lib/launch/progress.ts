import { evaluateCondition } from "./conditions";

interface Phase {
  id: number;
  slug: string;
  title: string;
  estimated_minutes: number;
  sort_order: number;
  is_conditional: boolean;
  condition_field: string | null;
}

interface Step {
  id: number;
  phase_id: number;
  slug: string;
  title: string;
  step_type: string;
  estimated_minutes: number;
  sort_order: number;
  is_conditional: boolean;
  condition_json: Record<string, unknown> | null;
}

interface Progress {
  step_id: number;
  status: "not_started" | "in_progress" | "completed" | "skipped";
}

interface Profile {
  is_solo: boolean;
  planning_to_raise: boolean;
  home_state: string;
  [key: string]: unknown;
}

export function getVisiblePhases(phases: Phase[], profile: Profile): Phase[] {
  return phases.filter((phase) => {
    if (!phase.is_conditional) return true;
    if (!phase.condition_field) return true;
    return Boolean(profile[phase.condition_field]);
  });
}

export function getVisibleSteps(steps: Step[], profile: Profile): Step[] {
  return steps.filter((step) => {
    if (!step.is_conditional) return true;
    return evaluateCondition(
      step.condition_json as Record<string, unknown> | null,
      profile
    );
  });
}

export function getPhaseCompletion(
  phaseId: number,
  steps: Step[],
  progress: Progress[],
  profile: Profile
): { completed: number; total: number; percentage: number } {
  const phaseSteps = getVisibleSteps(
    steps.filter((s) => s.phase_id === phaseId),
    profile
  );
  const total = phaseSteps.length;
  const completed = phaseSteps.filter((s) => {
    const p = progress.find((pr) => pr.step_id === s.id);
    return p?.status === "completed" || p?.status === "skipped";
  }).length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function getOverallCompletion(
  phases: Phase[],
  steps: Step[],
  progress: Progress[],
  profile: Profile
): { completed: number; total: number; percentage: number } {
  const visiblePhases = getVisiblePhases(phases, profile);
  const visibleSteps = getVisibleSteps(
    steps.filter((s) => visiblePhases.some((p) => p.id === s.phase_id)),
    profile
  );
  const total = visibleSteps.length;
  const completed = visibleSteps.filter((s) => {
    const p = progress.find((pr) => pr.step_id === s.id);
    return p?.status === "completed" || p?.status === "skipped";
  }).length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function getNextIncompleteStep(
  phases: Phase[],
  steps: Step[],
  progress: Progress[],
  profile: Profile
): { phase: Phase; step: Step } | null {
  const visiblePhases = getVisiblePhases(phases, profile);

  for (const phase of visiblePhases) {
    const phaseSteps = getVisibleSteps(
      steps.filter((s) => s.phase_id === phase.id),
      profile
    ).sort((a, b) => a.sort_order - b.sort_order);

    for (const step of phaseSteps) {
      const p = progress.find((pr) => pr.step_id === step.id);
      if (!p || p.status === "not_started" || p.status === "in_progress") {
        return { phase, step };
      }
    }
  }

  return null;
}

export function getRemainingMinutes(
  phases: Phase[],
  steps: Step[],
  progress: Progress[],
  profile: Profile
): number {
  const visiblePhases = getVisiblePhases(phases, profile);
  const visibleSteps = getVisibleSteps(
    steps.filter((s) => visiblePhases.some((p) => p.id === s.phase_id)),
    profile
  );

  return visibleSteps
    .filter((s) => {
      const p = progress.find((pr) => pr.step_id === s.id);
      return !p || p.status === "not_started" || p.status === "in_progress";
    })
    .reduce((sum, s) => sum + (s.estimated_minutes ?? 0), 0);
}
