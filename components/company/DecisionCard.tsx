"use client";

import { Button } from "@/components/ui/Button";

type CardType = "approval" | "choice" | "fyi" | "alert";
type Urgency = "low" | "medium" | "high" | "critical";

interface DecisionCardOption {
  label: string;
  value: string;
}

interface DecisionCardProps {
  id: string;
  type: CardType;
  title: string;
  description: string;
  urgency?: Urgency;
  options?: DecisionCardOption[];
  onAction: (cardId: string, action: string) => void;
}

const urgencyColors: Record<Urgency, string> = {
  low: "bg-zinc-300",
  medium: "bg-zinc-400",
  high: "bg-zinc-600",
  critical: "bg-zinc-900",
};

function DecisionCard({
  id,
  type,
  title,
  description,
  urgency = "low",
  options = [],
  onAction,
}: DecisionCardProps) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-zinc-200 bg-white transition-colors hover:border-zinc-500/20">
      <div className={`w-1 shrink-0 ${urgencyColors[urgency]}`} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            {title}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {type === "approval" && (
            <>
              <Button
                size="sm"
                onClick={() => onAction(id, "yes")}
              >
                Yes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(id, "no")}
              >
                No
              </Button>
            </>
          )}

          {type === "choice" &&
            options.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant="outline"
                onClick={() => onAction(id, opt.value)}
              >
                {opt.label}
              </Button>
            ))}

          {type === "fyi" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAction(id, "dismiss")}
            >
              Dismiss
            </Button>
          )}

          {type === "alert" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(id, "details")}
            >
              See Details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export { DecisionCard };
export type { DecisionCardProps, CardType, Urgency, DecisionCardOption };
