interface HealthScoreProps {
  score: number;
  className?: string;
}

function HealthScore({ score, className = "" }: HealthScoreProps) {
  return (
    <span
      className={`font-mono text-xs text-slate-900 ${className}`}
      title="Health Score"
    >
      {score}
    </span>
  );
}

export { HealthScore };
