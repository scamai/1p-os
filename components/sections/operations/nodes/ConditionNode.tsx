import { Handle, Position, type NodeProps } from "@xyflow/react";

interface ConditionData {
  label: string;
  condition: string;
  [key: string]: unknown;
}

export function ConditionNode({ data, selected }: NodeProps) {
  const d = data as ConditionData;
  return (
    <div
      className={`min-w-[200px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? "border-zinc-900 shadow-zinc-100" : "border-zinc-200"
      }`}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !border-2 !border-zinc-400 !bg-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-[10px] bg-zinc-100 px-3 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-500 text-[12px] font-bold text-white">
          ◇
        </div>
        <p className="text-[12px] font-semibold text-zinc-900">{d.label}</p>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-[11px] text-zinc-500">{d.condition}</p>
      </div>

      {/* Two source handles: left = false, right = true */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="!h-3 !w-3 !rounded-full !border-2 !border-zinc-400 !bg-white"
        style={{ left: "30%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="!h-3 !w-3 !rounded-full !border-2 !border-zinc-400 !bg-white"
        style={{ left: "70%" }}
      />

      {/* Labels */}
      <div className="flex justify-between px-4 pb-1">
        <span className="text-[10px] font-medium text-zinc-700">Yes</span>
        <span className="text-[10px] font-medium text-zinc-500">No</span>
      </div>
    </div>
  );
}
