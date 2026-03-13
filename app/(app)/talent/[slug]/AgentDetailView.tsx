"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { HireFlow } from "@/components/talent/HireFlow";

interface AgentInfo {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  author: string;
  rating: number;
  installCount: number;
  estimatedDailyCost: string;
  category: string;
  capabilities: string[];
  permissions: string[];
}

function AgentDetailView({ agent }: { agent: AgentInfo }) {
  const [hireOpen, setHireOpen] = React.useState(false);

  const handleConfirmHire = async () => {
    await fetch("/api/marketplace/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: agent.id }),
    });
    setHireOpen(false);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[var(--foreground)]">
            {agent.name}
          </h1>
          <Badge variant="outline">{agent.category}</Badge>
        </div>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          by {agent.author}
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
        <span>{agent.installCount.toLocaleString()} installs</span>
        <span>{agent.rating}/5 rating</span>
        <span className="font-mono">{agent.estimatedDailyCost}</span>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <p className="text-sm text-[var(--foreground)]">
            {agent.longDescription}
          </p>
        </CardContent>
      </Card>

      {agent.capabilities.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-[var(--foreground)]">
            Capabilities
          </h2>
          <ul className="flex flex-col gap-1">
            {agent.capabilities.map((cap, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]"
              >
                <span className="text-[var(--success)]">+</span>
                {cap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {agent.permissions.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-[var(--foreground)]">
            Permissions Required
          </h2>
          <ul className="flex flex-col gap-1">
            {agent.permissions.map((perm, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]"
              >
                <span>-</span>
                {perm}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={() => setHireOpen(true)}>Hire {agent.name}</Button>

      <HireFlow
        open={hireOpen}
        onClose={() => setHireOpen(false)}
        agent={{
          name: agent.name,
          description: agent.description,
          capabilities: agent.capabilities,
          permissions: agent.permissions,
          estimatedDailyCost: agent.estimatedDailyCost,
        }}
        onConfirmHire={handleConfirmHire}
        onCustomize={() => setHireOpen(false)}
      />
    </div>
  );
}

export { AgentDetailView };
