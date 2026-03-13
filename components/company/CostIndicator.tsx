interface CostIndicatorProps {
  spent: number;
  budget: number;
  className?: string;
}

function CostIndicator({ spent, budget, className = "" }: CostIndicatorProps) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const barColor =
    pct >= 100
      ? "bg-[var(--destructive)]"
      : pct >= 80
        ? "bg-[var(--warning)]"
        : "bg-[var(--success)]";

  return (
    <div className={`flex flex-col items-end gap-0.5 ${className}`}>
      <span className="text-xs text-[var(--muted-foreground)]">
        Today: ${spent.toFixed(2)} / Budget: ${budget.toFixed(2)}
      </span>
      <div className="h-1 w-20 overflow-hidden rounded-full bg-[var(--muted)]">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export { CostIndicator };
