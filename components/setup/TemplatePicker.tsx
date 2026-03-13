"use client";

import * as React from "react";

interface Template {
  id: string;
  name: string;
  description: string;
  agentCount: number;
  estimatedCost: string;
}

const templates: Template[] = [
  {
    id: "freelance-designer",
    name: "Freelance Designer",
    description: "Client management, invoicing, scheduling, and project tracking.",
    agentCount: 4,
    estimatedCost: "$1-3/day",
  },
  {
    id: "saas-founder",
    name: "SaaS Founder",
    description: "Customer support, billing ops, metrics tracking, and content.",
    agentCount: 5,
    estimatedCost: "$2-5/day",
  },
  {
    id: "consultant-coach",
    name: "Consultant / Coach",
    description: "Scheduling, client onboarding, invoicing, and follow-ups.",
    agentCount: 4,
    estimatedCost: "$1-3/day",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Inventory alerts, order management, customer service, marketing.",
    agentCount: 5,
    estimatedCost: "$2-4/day",
  },
  {
    id: "content-creator",
    name: "Content Creator",
    description: "Content calendar, social scheduling, analytics, sponsorship mgmt.",
    agentCount: 4,
    estimatedCost: "$1-3/day",
  },
  {
    id: "agency",
    name: "Agency",
    description: "Client management, project tracking, resource allocation, billing.",
    agentCount: 6,
    estimatedCost: "$3-6/day",
  },
  {
    id: "general",
    name: "General",
    description: "Email, calendar, bookkeeping, and basic admin tasks.",
    agentCount: 3,
    estimatedCost: "$1-2/day",
  },
];

interface TemplatePickerProps {
  selected?: string;
  onSelect: (templateId: string) => void;
}

function TemplatePicker({ selected, onSelect }: TemplatePickerProps) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-zinc-900">
        Choose a template
      </h2>
      <p className="mb-6 text-sm text-zinc-500">
        Pick the one closest to what you do. You can customize later.
      </p>

      <div className="flex flex-col gap-1.5">
        {templates.map((t) => {
          const isSelected = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                isSelected
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900">
                    {t.name}
                  </span>
                  {isSelected && (
                    <svg className="h-3.5 w-3.5 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{t.description}</p>
              </div>
              <div className="ml-4 shrink-0 text-right">
                <p className="text-xs font-mono text-zinc-600">{t.agentCount} agents</p>
                <p className="text-[11px] font-mono text-zinc-400">{t.estimatedCost}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { TemplatePicker };
