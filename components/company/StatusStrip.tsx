"use client";

interface HQMetrics {
  revenueMtd: number;
  spendToday: number;
  activeAgents: number;
  pendingDecisions: number;
  pipelineLeads: number;
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

function StatusStrip({ metrics }: { metrics: HQMetrics }) {
  const items = [
    { label: "Revenue MTD", value: formatCurrency(metrics.revenueMtd) },
    { label: "Spend today", value: formatCurrency(metrics.spendToday) },
    { label: "Agents active", value: String(metrics.activeAgents) },
    { label: "Decisions", value: String(metrics.pendingDecisions) },
    { label: "Pipeline", value: String(metrics.pipelineLeads) },
  ];

  return (
    <div className="grid grid-cols-5 gap-x-4">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-[11px] text-zinc-400">{item.label}</p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-zinc-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export { StatusStrip };
export type { HQMetrics };
