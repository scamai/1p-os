"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface TeamTemplate {
  id: string;
  name: string;
  description: string;
  agentCount: number;
  totalEstimatedCost: string;
  agents: string[];
}

const teamTemplates: TeamTemplate[] = [
  {
    id: "freelancer-starter",
    name: "Freelancer Starter",
    description: "Everything a solo freelancer needs to manage clients and finances.",
    agentCount: 3,
    totalEstimatedCost: "$1-2/day",
    agents: ["Admin Assistant", "Bookkeeper", "Client Manager"],
  },
  {
    id: "saas-founder",
    name: "SaaS Founder",
    description: "Support, billing, and growth for your SaaS product.",
    agentCount: 5,
    totalEstimatedCost: "$2-5/day",
    agents: ["Support Agent", "Billing Ops", "Analytics", "Content Writer", "Admin"],
  },
  {
    id: "content-machine",
    name: "Content Machine",
    description: "Create, schedule, and analyze content across platforms.",
    agentCount: 4,
    totalEstimatedCost: "$2-4/day",
    agents: ["Content Writer", "Social Manager", "SEO Analyst", "Scheduler"],
  },
  {
    id: "agency-team",
    name: "Agency Team",
    description: "Manage clients, projects, and team resources efficiently.",
    agentCount: 6,
    totalEstimatedCost: "$3-6/day",
    agents: ["Project Manager", "Client Manager", "Bookkeeper", "HR", "Scheduler", "Reporter"],
  },
];

interface TeamTemplatesProps {
  onInstall: (templateId: string) => void;
}

function TeamTemplates({ onInstall }: TeamTemplatesProps) {
  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-[var(--foreground)]">
        Pre-built Teams
      </h2>
      <p className="mb-4 text-sm text-[var(--muted-foreground)]">
        One-click install a complete team of agents.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {teamTemplates.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {t.name}
              </h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {t.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {t.agents.map((a) => (
                  <span
                    key={a}
                    className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]"
                  >
                    {a}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[var(--muted-foreground)]">
                  {t.agentCount} agents &middot; {t.totalEstimatedCost}
                </span>
                <Button size="sm" onClick={() => onInstall(t.id)}>
                  Install
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { TeamTemplates };
