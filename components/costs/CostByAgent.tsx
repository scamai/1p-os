interface AgentCostData {
  agentId?: string;
  name: string;
  role?: string;
  cost: number;
  tasks?: number;
  hoursSaved?: number;
  efficiencyScore?: number;
  dailyBudget?: number;
  monthlyBudget?: number;
}

interface CostByAgentProps {
  agents: AgentCostData[];
}

function getBudgetColor(cost: number, budget: number): string {
  if (budget <= 0) return "bg-slate-100";
  const ratio = cost / budget;
  if (ratio >= 1) return "bg-slate-900";
  if (ratio >= 0.8) return "bg-slate-600";
  return "bg-slate-400";
}

function getBudgetTextColor(cost: number, budget: number): string {
  if (budget <= 0) return "text-slate-500";
  const ratio = cost / budget;
  if (ratio >= 1) return "text-slate-900 font-bold";
  if (ratio >= 0.8) return "text-slate-700";
  return "text-slate-500";
}

function CostByAgent({ agents }: CostByAgentProps) {
  const sorted = [...agents].sort((a, b) => b.cost - a.cost);
  const maxCost = sorted.length > 0 ? sorted[0].cost : 1;

  if (sorted.length === 0) {
    return (
      <p className="py-4 text-sm text-slate-500">
        No cost data yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((agent) => {
        const budget = agent.monthlyBudget ?? agent.dailyBudget ?? 0;
        const barColor = getBudgetColor(agent.cost, budget);
        const costColor = getBudgetTextColor(agent.cost, budget);

        return (
          <div key={agent.agentId ?? agent.name} className="flex flex-col gap-1">
            {/* Row: name, role, cost */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">
                  {agent.name}
                </span>
                {agent.role && (
                  <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {agent.role}
                  </span>
                )}
              </div>
              <span className={`font-mono font-semibold ${costColor}`}>
                ${agent.cost.toFixed(2)}
              </span>
            </div>

            {/* Cost bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-50">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{
                  width: `${maxCost > 0 ? (agent.cost / maxCost) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              {agent.tasks !== undefined && (
                <span>{agent.tasks} tasks</span>
              )}
              {agent.hoursSaved !== undefined && agent.hoursSaved > 0 && (
                <span>{agent.hoursSaved}h saved</span>
              )}
              {agent.efficiencyScore !== undefined &&
                agent.efficiencyScore > 0 && (
                  <span>
                    efficiency: {agent.efficiencyScore.toFixed(1)} hrs/$
                  </span>
                )}
              {budget > 0 && (
                <span className="ml-auto">
                  budget: ${budget.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { CostByAgent };
