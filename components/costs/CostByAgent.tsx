interface CostByAgentProps {
  agents: { name: string; cost: number }[];
}

function CostByAgent({ agents }: CostByAgentProps) {
  const sorted = [...agents].sort((a, b) => b.cost - a.cost);
  const maxCost = sorted.length > 0 ? sorted[0].cost : 1;

  if (sorted.length === 0) {
    return (
      <p className="py-4 text-sm text-[var(--muted-foreground)]">
        No cost data yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((agent) => (
        <div key={agent.name} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--foreground)]">{agent.name}</span>
            <span className="font-mono text-[var(--muted-foreground)]">
              ${agent.cost.toFixed(2)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            <div
              className="h-full rounded-full bg-[var(--foreground)] transition-all"
              style={{
                width: `${(agent.cost / maxCost) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export { CostByAgent };
