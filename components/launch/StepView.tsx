"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";

const EquityCalculator = dynamic(
  () => import("./calculators/EquityCalculator").then((m) => ({ default: m.EquityCalculator })),
  { ssr: false, loading: () => <div className="h-48 animate-pulse bg-slate-50" /> }
);
const DilutionSimulator = dynamic(
  () => import("./calculators/DilutionSimulator").then((m) => ({ default: m.DilutionSimulator })),
  { ssr: false, loading: () => <div className="h-48 animate-pulse bg-slate-50" /> }
);
const VestingVisualizer = dynamic(
  () => import("./calculators/VestingVisualizer").then((m) => ({ default: m.VestingVisualizer })),
  { ssr: false, loading: () => <div className="h-48 animate-pulse bg-slate-50" /> }
);
const TAMCalculator = dynamic(
  () => import("./calculators/TAMCalculator").then((m) => ({ default: m.TAMCalculator })),
  { ssr: false, loading: () => <div className="h-48 animate-pulse bg-slate-50" /> }
);

const CALCULATOR_MAP: Record<string, React.ComponentType> = {
  "equity-split": EquityCalculator,
  "share-allocation": EquityCalculator,
  "valuation-calculator": DilutionSimulator,
  "vesting-schedule": VestingVisualizer,
  "option-pool": VestingVisualizer,
  "market-why-now": TAMCalculator,
};
import { TrapWarning } from "@/components/launch/TrapWarning";
import { StepComplete } from "@/components/launch/StepComplete";

interface Phase {
  id: string;
  title: string;
  slug: string;
}

interface Step {
  id: string;
  phase_id: string;
  title: string;
  slug: string;
  sort_order: number;
  step_type: "info" | "action" | "template" | "form" | "calculator" | "external_link";
  content_md: string | null;
  external_url: string | null;
  external_label: string | null;
  template_url: string | null;
  trap_warning: string | null;
  trap_severity: "critical" | "warning" | "info" | null;
  estimated_minutes: number;
  checklist: string[] | null;
}

interface Progress {
  step_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

interface NavStep {
  id: string;
  slug: string;
  title: string;
  sort_order: number;
}

interface StepViewProps {
  phase: Phase;
  step: Step;
  progress: Progress | null;
  allSteps: NavStep[];
  userId: string;
}

function renderContent(content: string | null) {
  if (!content) return null;

  // Simple markdown-to-HTML: paragraphs, bold, links, lists
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 ml-4 flex flex-col gap-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm text-slate-700 leading-relaxed">
              <span className="mr-2 text-slate-400">&bull;</span>
              {formatInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  function formatInline(text: string): React.ReactNode {
    // Bold
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <span key={i} className="font-medium text-slate-900">
          {part}
        </span>
      ) : (
        part
      )
    );
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.slice(2));
      continue;
    }

    flushList();

    if (trimmed === "") {
      continue;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4
          key={elements.length}
          className="mt-4 mb-1 text-sm font-semibold text-slate-900"
        >
          {trimmed.slice(4)}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3
          key={elements.length}
          className="mt-4 mb-1 text-sm font-semibold text-slate-900"
        >
          {trimmed.slice(3)}
        </h3>
      );
    } else {
      elements.push(
        <p
          key={elements.length}
          className="my-1.5 text-sm text-slate-700 leading-relaxed"
        >
          {formatInline(trimmed)}
        </p>
      );
    }
  }

  flushList();
  return <div>{elements}</div>;
}

export function StepView({
  phase,
  step,
  progress,
  allSteps,
  userId,
}: StepViewProps) {
  const router = useRouter();
  const isCompleted = progress?.is_completed ?? false;

  // Find prev/next steps
  const currentIndex = allSteps.findIndex((s) => s.id === step.id);
  const prevStep = currentIndex > 0 ? allSteps[currentIndex - 1] : null;
  const nextStep =
    currentIndex < allSteps.length - 1 ? allSteps[currentIndex + 1] : null;

  const nextStepUrl = nextStep
    ? `/launch/phase/${phase.slug}/${nextStep.slug}`
    : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Back link */}
      <button
        onClick={() => router.push(`/launch/phase/${phase.slug}`)}
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
        {phase.title}
      </button>

      {/* Trap warning */}
      {step.trap_warning && step.trap_severity && (
        <TrapWarning
          severity={step.trap_severity}
          message={step.trap_warning}
          className="mb-6"
        />
      )}

      {/* Step title */}
      <h1 className="text-base font-semibold text-slate-900 mb-1">
        {step.title}
      </h1>
      {step.estimated_minutes > 0 && (
        <p className="text-xs text-slate-400 mb-6">
          ~{step.estimated_minutes} min
        </p>
      )}

      {/* Content based on step type */}
      <div className="mb-8">
        {/* Info type */}
        {step.step_type === "info" && renderContent(step.content_md)}

        {/* Action type */}
        {step.step_type === "action" && (
          <div>
            {renderContent(step.content_md)}
            {step.external_url && (
              <div className="mt-4">
                <a
                  href={step.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm">
                    {step.external_label || "Open link"}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="ml-1.5"
                    >
                      <path d="M3 9L9 3M9 3H4.5M9 3v4.5" />
                    </svg>
                  </Button>
                </a>
              </div>
            )}
            {step.checklist && step.checklist.length > 0 && (
              <div className="mt-4 border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Checklist
                </p>
                <div className="flex flex-col gap-1.5">
                  {step.checklist.map((item, i) => (
                    <label
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 border border-slate-300 accent-slate-900"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Template type */}
        {step.step_type === "template" && (
          <div>
            {renderContent(step.content_md)}
            {step.template_url && (
              <div className="mt-4">
                <a
                  href={step.template_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm">
                    Download template
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="ml-1.5"
                    >
                      <path d="M6 2v7M3 7l3 3 3-3M2 11h8" />
                    </svg>
                  </Button>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Form type */}
        {step.step_type === "form" && (
          <div>
            {renderContent(step.content_md)}
            <div className="mt-4 border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Form fields will be rendered here based on step configuration.
              </p>
            </div>
          </div>
        )}

        {/* Calculator type */}
        {step.step_type === "calculator" && (
          <div>
            {renderContent(step.content_md)}
            <div className="mt-4 border border-slate-200 p-5">
              {CALCULATOR_MAP[step.slug]
                ? React.createElement(CALCULATOR_MAP[step.slug])
                : <p className="text-sm text-slate-500">Calculator coming soon.</p>
              }
            </div>
          </div>
        )}

        {/* External link type */}
        {step.step_type === "external_link" && (
          <div>
            {renderContent(step.content_md)}
            {step.external_url && (
              <div className="mt-4">
                <a
                  href={step.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm">
                    {step.external_label || "Visit site"}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="ml-1.5"
                    >
                      <path d="M3 9L9 3M9 3H4.5M9 3v4.5" />
                    </svg>
                  </Button>
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mark complete */}
      <div className="border-t border-slate-200 pt-4">
        <StepComplete
          stepId={step.id}
          userId={userId}
          isCompleted={isCompleted}
          nextStepUrl={nextStepUrl}
        />
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        {prevStep ? (
          <Link
            href={`/launch/phase/${phase.slug}/${prevStep.slug}`}
            className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors duration-150 hover:text-slate-900"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 2L3 5l3 3" />
            </svg>
            {prevStep.title}
          </Link>
        ) : (
          <div />
        )}
        {nextStep ? (
          <Link
            href={`/launch/phase/${phase.slug}/${nextStep.slug}`}
            className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors duration-150 hover:text-slate-900"
          >
            {nextStep.title}
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 2l3 3-3 3" />
            </svg>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
