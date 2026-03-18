import { Handle, Position, type NodeProps } from "@xyflow/react";

const STATUS_COLORS: Record<string, string> = {
  working: "#18181b",
  idle: "#a1a1aa",
  paused: "#71717a",
  needs_input: "#52525b",
  error: "#3f3f46",
};

interface AgentStepData {
  agentName: string;
  action: string;
  department: string;
  deptColor: string;
  deptIcon: string;
  status: string;
  tasksToday: number;
  costToday: number;
  [key: string]: unknown;
}

export function AgentStepNode({ data, selected }: NodeProps) {
  const d = data as AgentStepData;
  const statusColor = STATUS_COLORS[d.status] ?? "#a1a1aa";

  return (
    <div
      className={`min-w-[240px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? "shadow-md" : ""
      }`}
      style={{
        borderColor: selected ? d.deptColor : `${d.deptColor}60`,
      }}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !border-2 !bg-white"
        style={{ borderColor: d.deptColor }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-[10px] px-3 py-2"
        style={{ backgroundColor: `${d.deptColor}10` }}
      >
        <div
          className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold text-white"
          style={{ backgroundColor: d.deptColor }}
        >
          {d.deptIcon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: statusColor }}
            />
            <p className="text-[12px] font-semibold text-zinc-900 truncate">{d.agentName}</p>
          </div>
          <p
            className="text-[10px] font-medium"
            style={{ color: d.deptColor }}
          >
            {d.department}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-[11px] text-zinc-600">{d.action}</p>
        <div className="mt-1.5 flex items-center gap-3 border-t border-zinc-100 pt-1.5">
          <span className="text-[10px] text-zinc-400">{d.tasksToday} tasks</span>
          <span className="text-[10px] text-zinc-400">${(d.costToday ?? 0).toFixed(2)}</span>
        </div>
      </div>

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !rounded-full !border-2 !bg-white"
        style={{ borderColor: d.deptColor }}
      />
    </div>
  );
}
