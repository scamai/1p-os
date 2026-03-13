interface HealthScoreProps {
  score: number;
  className?: string;
}

function HealthScore({ score, className = "" }: HealthScoreProps) {
  const color =
    score > 80
      ? "text-[var(--success)]"
      : score >= 50
        ? "text-[var(--warning)]"
        : "text-[var(--destructive)]";

  return (
    <div
      className={`flex items-center gap-1 text-xs ${className}`}
      title="Health Score"
    >
      <span className={`font-mono font-semibold ${color}`}>{score}</span>
      <span className="text-[var(--muted-foreground)]">health</span>
    </div>
  );
}

export { HealthScore };
