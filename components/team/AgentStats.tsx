interface AgentStatsProps {
  tasksCompleted: number;
  hoursSaved: number;
  costTotal: number;
  decisionsEscalated: number;
  approvalRate: number;
}

function AgentStats({
  tasksCompleted,
  hoursSaved,
  costTotal,
  decisionsEscalated,
  approvalRate,
}: AgentStatsProps) {
  const stats = [
    { label: "Tasks completed", value: tasksCompleted.toString() },
    { label: "Hours saved", value: `${hoursSaved}h` },
    { label: "Total cost", value: `$${costTotal.toFixed(2)}` },
    { label: "Escalated", value: decisionsEscalated.toString() },
    { label: "Approval rate", value: `${approvalRate}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-md bg-slate-50 p-3">
          <p className="text-xs text-slate-500">{s.label}</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export { AgentStats };
