"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DecisionFeed, type DecisionItem } from "@/components/company/DecisionFeed";
import { StatusStrip, type HQMetrics } from "@/components/company/StatusStrip";
import { AgentPulse, type AgentStatus } from "@/components/company/AgentPulse";
import { ActivityTimeline, type ActivityEvent } from "@/components/company/ActivityTimeline";
import { QuickActions } from "@/components/company/QuickActions";

interface CompanyViewProps {
  cards: DecisionItem[];
  agents: AgentStatus[];
  metrics: HQMetrics;
  activity: ActivityEvent[];
}

function CompanyView({ cards, agents, metrics, activity }: CompanyViewProps) {
  const router = useRouter();

  const handleDecisionAction = async (cardId: string, action: string) => {
    await fetch(`/api/decisions/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    router.refresh();
  };

  const handleQuickAction = (action: string) => {
    window.dispatchEvent(
      new CustomEvent("app-action", { detail: { action } })
    );
  };

  const pendingCards = cards.filter((c) => !c.done);

  return (
    <div className="mx-auto max-w-2xl">
      {/* 1. Vital signs */}
      <StatusStrip metrics={metrics} />

      {/* 2. Quick actions — contextual */}
      <div className="mt-6">
        <QuickActions
          pendingDecisions={metrics.pendingDecisions}
          onAction={handleQuickAction}
        />
      </div>

      {/* 3. Pending decisions */}
      {pendingCards.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Needs your attention
          </p>
          <DecisionFeed cards={cards} onAction={handleDecisionAction} />
        </div>
      )}

      {/* Show "all clear" when no decisions */}
      {pendingCards.length === 0 && cards.length === 0 && (
        <div className="mt-8 py-8 text-center">
          <p className="text-sm text-zinc-500">All clear. Your business is running.</p>
        </div>
      )}

      {/* 4. Agent pulse */}
      {agents.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Agents
          </p>
          <AgentPulse agents={agents} />
        </div>
      )}

      {/* 5. Activity timeline */}
      {activity.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Recent activity
          </p>
          <ActivityTimeline events={activity} />
        </div>
      )}

      {/* Done decisions — collapsed at bottom */}
      {pendingCards.length === 0 && cards.length > 0 && (
        <div className="mt-8">
          <DecisionFeed cards={cards} onAction={handleDecisionAction} />
        </div>
      )}
    </div>
  );
}

export { CompanyView };
