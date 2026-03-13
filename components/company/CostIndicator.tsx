interface CostIndicatorProps {
  spent: number;
  budget: number;
  className?: string;
}

function CostIndicator({ spent, budget, className = "" }: CostIndicatorProps) {
  return (
    <span className={`font-mono text-xs text-zinc-900 ${className}`} title="Daily spend / budget">
      ${spent.toFixed(2)}/${budget}
    </span>
  );
}

export { CostIndicator };
