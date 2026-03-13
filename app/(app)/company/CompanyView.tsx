"use client";

import { DecisionFeed, type DecisionItem } from "@/components/company/DecisionFeed";
import { MorningBrief } from "@/components/company/MorningBrief";

interface CompanyViewProps {
  cards: DecisionItem[];
  morningBrief: string | null;
}

function CompanyView({ cards, morningBrief }: CompanyViewProps) {
  const handleAction = async (cardId: string, action: string) => {
    await fetch(`/api/decisions/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <MorningBrief summary={morningBrief} />
      <DecisionFeed cards={cards} onAction={handleAction} />
    </div>
  );
}

export { CompanyView };
