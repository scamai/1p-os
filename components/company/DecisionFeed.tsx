"use client";

import * as React from "react";
import {
  DecisionCard,
  type DecisionCardProps,
} from "@/components/company/DecisionCard";

type DecisionItem = Omit<DecisionCardProps, "onAction"> & {
  done?: boolean;
};

interface DecisionFeedProps {
  cards: DecisionItem[];
  onAction: (cardId: string, action: string) => void;
}

function DecisionFeed({ cards, onAction }: DecisionFeedProps) {
  const [doneOpen, setDoneOpen] = React.useState(false);

  const pending = cards.filter((c) => !c.done);
  const done = cards.filter((c) => c.done);

  if (cards.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20">
        <p className="text-sm text-[var(--muted-foreground)]">
          All clear. Your business is running.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            All clear. Nothing needs your attention.
          </p>
        </div>
      )}

      {pending.map((card) => (
        <DecisionCard key={card.id} {...card} onAction={onAction} />
      ))}

      {done.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setDoneOpen((prev) => !prev)}
            className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <svg
              className={`h-3 w-3 transition-transform ${doneOpen ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
            Done today ({done.length})
          </button>

          {doneOpen && (
            <div className="mt-2 flex flex-col gap-2 opacity-60">
              {done.map((card) => (
                <DecisionCard key={card.id} {...card} onAction={onAction} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { DecisionFeed };
export type { DecisionItem };
