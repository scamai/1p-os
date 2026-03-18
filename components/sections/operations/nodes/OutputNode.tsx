import { Handle, Position, type NodeProps } from "@xyflow/react";

interface OutputData {
  label: string;
  [key: string]: unknown;
}

export function OutputNode({ data, selected }: NodeProps) {
  const d = data as OutputData;
  return (
    <div
      className={`min-w-[160px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? "border-slate-900 shadow-slate-100" : "border-slate-200"
      }`}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-400 !bg-white"
      />

      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] text-white">
          ✓
        </div>
        <p className="text-[12px] font-semibold text-slate-800">{d.label}</p>
      </div>
    </div>
  );
}
