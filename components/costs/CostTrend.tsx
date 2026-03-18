"use client";

import * as React from "react";

interface CostTrendProps {
  data: { date: string; cost: number }[];
  budgetLine?: number;
}

function CostTrend({ data, budgetLine }: CostTrendProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  if (data.length === 0) {
    return (
      <p className="py-4 text-sm text-zinc-500">
        No trend data yet.
      </p>
    );
  }

  const maxCost = Math.max(
    ...data.map((d) => d.cost),
    budgetLine ?? 0,
    0.01
  );
  const width = 400;
  const height = 150;
  const padding = { top: 15, right: 15, bottom: 25, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - (d.cost / maxCost) * chartH,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Y-axis labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  // Budget line Y position
  const budgetY =
    budgetLine !== undefined && budgetLine > 0
      ? padding.top + chartH - (budgetLine / maxCost) * chartH
      : null;

  // Format short date for x-axis labels
  function formatDate(dateStr: string): string {
    const parts = dateStr.split("-");
    if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
    return dateStr;
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Grid lines + Y-axis labels */}
        {yTicks.map((pct) => {
          const y = padding.top + chartH * (1 - pct);
          const value = maxCost * pct;
          return (
            <g key={pct}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartW}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.5"
              />
              <text
                x={padding.left - 4}
                y={y + 3}
                textAnchor="end"
                className="text-[10px] fill-zinc-500"
              >
                ${value.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Budget line (dashed) */}
        {budgetY !== null && (
          <>
            <line
              x1={padding.left}
              y1={budgetY}
              x2={padding.left + chartW}
              y2={budgetY}
              stroke="#52525b"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity="0.6"
            />
            <text
              x={padding.left + chartW + 2}
              y={budgetY + 3}
              className="text-[10px] fill-zinc-500"
              opacity="0.8"
            >
              budget
            </text>
          </>
        )}

        {/* Area fill under curve */}
        {points.length > 1 && (
          <path
            d={`${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`}
            fill="#e4e4e7"
            opacity="0.05"
          />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots + invisible hover targets */}
        {points.map((p, i) => (
          <g key={i}>
            {/* Larger invisible target for hover */}
            <circle
              cx={p.x}
              cy={p.y}
              r="10"
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
            />
            {/* Visible dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 3.5 : 2}
              fill="#e4e4e7"
              className="transition-all"
            />
          </g>
        ))}

        {/* Hover tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <g>
            {/* Vertical guide line */}
            <line
              x1={points[hoveredIndex].x}
              y1={padding.top}
              x2={points[hoveredIndex].x}
              y2={padding.top + chartH}
              stroke="#e4e4e7"
              strokeWidth="0.5"
              opacity="0.3"
            />
            {/* Tooltip background */}
            <rect
              x={points[hoveredIndex].x - 30}
              y={points[hoveredIndex].y - 22}
              width="60"
              height="16"
              rx="3"
              fill="#e4e4e7"
              opacity="0.9"
            />
            {/* Tooltip text */}
            <text
              x={points[hoveredIndex].x}
              y={points[hoveredIndex].y - 11}
              textAnchor="middle"
              className="text-[10px] font-medium fill-[#09090b]"
            >
              ${data[hoveredIndex].cost.toFixed(2)}
            </text>
          </g>
        )}

        {/* X-axis labels */}
        {data.length > 0 && (
          <>
            <text
              x={padding.left}
              y={height - 4}
              className="text-[10px] fill-zinc-500"
            >
              {formatDate(data[0].date)}
            </text>
            {data.length > 2 && (
              <text
                x={padding.left + chartW / 2}
                y={height - 4}
                textAnchor="middle"
                className="text-[10px] fill-zinc-500"
              >
                {formatDate(data[Math.floor(data.length / 2)].date)}
              </text>
            )}
            <text
              x={padding.left + chartW}
              y={height - 4}
              textAnchor="end"
              className="text-[10px] fill-zinc-500"
            >
              {formatDate(data[data.length - 1].date)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

export { CostTrend };
