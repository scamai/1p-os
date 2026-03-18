import { Handle, Position, type NodeProps } from "@xyflow/react";

interface TriggerData {
  label: string;
  trigger: string;
  workflowId?: string;
  [key: string]: unknown;
}

export function TriggerNode({ data, selected }: NodeProps) {
  const d = data as TriggerData;
  return (
    <div
      className={`min-w-[220px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? "border-slate-900 shadow-slate-100" : "border-slate-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-[10px] bg-slate-100 px-3 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-[11px] text-white">
          ⚡
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-slate-900 truncate">{d.label}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-[11px] text-slate-500">
          <span className="font-medium text-slate-600">When: </span>
          {d.trigger}
        </p>
      </div>

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-400 !bg-white"
      />
    </div>
  );
}
