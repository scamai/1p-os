"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/Card";

interface Template {
  id: string;
  icon: string;
  name: string;
  description: string;
  agentCount: number;
  estimatedCost: string;
}

const templates: Template[] = [
  {
    id: "freelance-designer",
    icon: "🎨",
    name: "Freelance Designer",
    description: "Client management, invoicing, scheduling, and project tracking.",
    agentCount: 4,
    estimatedCost: "$1-3/day",
  },
  {
    id: "saas-founder",
    icon: "🚀",
    name: "SaaS Founder",
    description: "Customer support, billing ops, metrics tracking, and content.",
    agentCount: 5,
    estimatedCost: "$2-5/day",
  },
  {
    id: "consultant-coach",
    icon: "📋",
    name: "Consultant / Coach",
    description: "Scheduling, client onboarding, invoicing, and follow-ups.",
    agentCount: 4,
    estimatedCost: "$1-3/day",
  },
  {
    id: "ecommerce",
    icon: "🛒",
    name: "E-commerce",
    description: "Inventory alerts, order management, customer service, marketing.",
    agentCount: 5,
    estimatedCost: "$2-4/day",
  },
  {
    id: "content-creator",
    icon: "✍️",
    name: "Content Creator",
    description: "Content calendar, social scheduling, analytics, sponsorship mgmt.",
    agentCount: 4,
    estimatedCost: "$1-3/day",
  },
  {
    id: "agency",
    icon: "🏢",
    name: "Agency",
    description: "Client management, project tracking, resource allocation, billing.",
    agentCount: 6,
    estimatedCost: "$3-6/day",
  },
  {
    id: "general",
    icon: "⚙️",
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card
            key={t.id}
            className={`cursor-pointer transition-all ${
              selected === t.id
                ? "border-zinc-900 ring-1 ring-zinc-300"
                : ""
            }`}
            onClick={() => onSelect(t.id)}
          >
            <CardContent className="p-4">
              <div className="mb-2 text-2xl">{t.icon}</div>
              <h3 className="text-sm font-semibold text-zinc-900">
                {t.name}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                {t.description}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                <span>{t.agentCount} agents</span>
                <span>{t.estimatedCost}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { TemplatePicker };
