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
        selected ? "border-amber-500 shadow-amber-100" : "border-amber-200"
      }`}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !border-2 !border-amber-400 !bg-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-[10px] bg-amber-50 px-3 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-[12px] font-bold text-white">
          ◇
        </div>
        <p className="text-[12px] font-semibold text-amber-900">{d.label}</p>
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
        className="!h-3 !w-3 !rounded-full !border-2 !border-emerald-400 !bg-white"
        style={{ left: "30%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="!h-3 !w-3 !rounded-full !border-2 !border-red-400 !bg-white"
        style={{ left: "70%" }}
      />

      {/* Labels */}
      <div className="flex justify-between px-4 pb-1">
        <span className="text-[8px] font-medium text-emerald-600">Yes</span>
        <span className="text-[8px] font-medium text-red-500">No</span>
      </div>
    </div>
  );
}
