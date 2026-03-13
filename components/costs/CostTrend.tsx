interface CostTrendProps {
  data: { date: string; cost: number }[];
}

function CostTrend({ data }: CostTrendProps) {
  if (data.length === 0) {
    return (
      <p className="py-4 text-sm text-[var(--muted-foreground)]">
        No trend data yet.
      </p>
    );
  }

  const maxCost = Math.max(...data.map((d) => d.cost), 0.01);
  const width = 400;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - (d.cost / maxCost) * chartH,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <line
          key={pct}
          x1={padding.left}
          y1={padding.top + chartH * (1 - pct)}
          x2={padding.left + chartW}
          y2={padding.top + chartH * (1 - pct)}
          stroke="var(--border)"
          strokeWidth="0.5"
        />
      ))}

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="2"
          fill="var(--foreground)"
        />
      ))}

      {/* X labels (show first and last) */}
      {data.length > 0 && (
        <>
          <text
            x={padding.left}
            y={height - 2}
            className="text-[8px] fill-[var(--muted-foreground)]"
          >
            {data[0].date}
          </text>
          <text
            x={padding.left + chartW}
            y={height - 2}
            textAnchor="end"
            className="text-[8px] fill-[var(--muted-foreground)]"
          >
            {data[data.length - 1].date}
          </text>
        </>
      )}
    </svg>
  );
}

export { CostTrend };
