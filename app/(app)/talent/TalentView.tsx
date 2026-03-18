"use client";

import * as React from "react";
import { MarketplaceGrid } from "@/components/talent/MarketplaceGrid";
import { HireFlow } from "@/components/talent/HireFlow";
import { TeamTemplates } from "@/components/talent/TeamTemplates";

interface ListingItem {
  id: string;
  name: string;
  description: string;
  author: string;
  rating: number;
  installCount: number;
  estimatedDailyCost: string;
  category: string;
}

interface TalentViewProps {
  listings: ListingItem[];
}

function TalentView({ listings }: TalentViewProps) {
  const [hireAgent, setHireAgent] = React.useState<{
    name: string;
    description: string;
    capabilities: string[];
    permissions: string[];
    estimatedDailyCost: string;
  } | null>(null);

  const handleHire = (id: string) => {
    const listing = listings.find((l) => l.id === id);
    if (!listing) return;
    setHireAgent({
      name: listing.name,
      description: listing.description,
      capabilities: ["Handles tasks automatically", "Escalates when needed", "Reports daily"],
      permissions: ["Read business context", "Create tasks", "Send notifications"],
      estimatedDailyCost: listing.estimatedDailyCost,
    });
  };

  const handleConfirmHire = async () => {
    await fetch("/api/marketplace/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentName: hireAgent?.name }),
    });
    setHireAgent(null);
  };

  const handleInstallTemplate = async (templateId: string) => {
    await fetch("/api/marketplace/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId }),
    });
  };

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">
        Agent Marketplace
      </h1>

      <div className="mb-8">
        <TeamTemplates onInstall={handleInstallTemplate} />
      </div>

      <h2 className="mb-4 text-base font-semibold text-slate-900">
        All Agents
      </h2>
      <MarketplaceGrid listings={listings} onHire={handleHire} />

      <HireFlow
        open={!!hireAgent}
        onClose={() => setHireAgent(null)}
        agent={hireAgent}
        onConfirmHire={handleConfirmHire}
        onCustomize={() => setHireAgent(null)}
      />
    </div>
  );
}

export { TalentView };
