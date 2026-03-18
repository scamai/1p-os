"use client";

import * as React from "react";

interface TemplateCardData {
  id: string;
  name: string;
  description: string;
  icon: string;
  agentCount: number;
  estimatedMonthlyCost: number;
}

const TEMPLATES: TemplateCardData[] = [
  {
    id: "freelancer",
    name: "Freelancer",
    description:
      "Invoicing, client management, taxes, and content. Get paid on time and stay organized.",
    icon: "\u{1F4BB}",
    agentCount: 4,
    estimatedMonthlyCost: 30,
  },
  {
    id: "saas-founder",
    name: "SaaS Founder",
    description:
      "Sales, support, finance, content, and ops all reporting to an AI CEO.",
    icon: "\u{1F680}",
    agentCount: 5,
    estimatedMonthlyCost: 80,
  },
  {
    id: "agency",
    name: "Agency",
    description:
      "Manage clients, projects, invoices, and talent for a services agency.",
    icon: "\u{1F3E2}",
    agentCount: 4,
    estimatedMonthlyCost: 60,
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description:
      "Inventory, customer support, marketing, and fulfillment for your store.",
    icon: "\u{1F6D2}",
    agentCount: 4,
    estimatedMonthlyCost: 70,
  },
  {
    id: "consultant",
    name: "Consultant",
    description:
      "Proposals, billing, client relationships, and industry research.",
    icon: "\u{1F4BC}",
    agentCount: 4,
    estimatedMonthlyCost: 40,
  },
];

interface BusinessTemplatesProps {
  onApply: (templateId: string) => void | Promise<void>;
}

function BusinessTemplates({ onApply }: BusinessTemplatesProps) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleApply() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      await onApply(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply template");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-zinc-100">
        Pick your business template
      </h2>
      <p className="mb-6 text-sm text-zinc-400">
        Choose one and get a fully configured team in 60 seconds. You can customize everything later.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => {
          const isSelected = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={loading}
              onClick={() => setSelected(t.id)}
              className={`relative flex flex-col rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-white bg-zinc-800 ring-1 ring-white"
                  : "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800/60"
              } ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {isSelected && (
                <div className="absolute right-3 top-3">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}

              <div className="mb-2 text-2xl">{t.icon}</div>

              <h3 className="text-sm font-semibold text-zinc-100">{t.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {t.description}
              </p>

              <div className="mt-3 flex items-center gap-3 text-xs font-mono text-zinc-500">
                <span>{t.agentCount} agents</span>
                <span className="text-zinc-600">&middot;</span>
                <span>~${t.estimatedMonthlyCost}/mo</span>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-sm text-zinc-400">{error}</p>
      )}

      <button
        type="button"
        disabled={!selected || loading}
        onClick={handleApply}
        className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
          selected && !loading
            ? "bg-white text-zinc-900 hover:bg-zinc-200"
            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Setting up your team...
          </span>
        ) : (
          "Get Started"
        )}
      </button>
    </div>
  );
}

export { BusinessTemplates };
