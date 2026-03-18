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
        selected ? "border-black shadow-black/[0.04]" : "border-black/[0.08]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-[10px] bg-black/[0.04] px-3 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-black text-[11px] text-white">
          ⚡
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-black truncate">{d.label}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-[11px] text-black/50">
          <span className="font-medium text-black/60">When: </span>
          {d.trigger}
        </p>
      </div>

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !rounded-full !border-2 !border-black/40 !bg-white"
      />
    </div>
  );
}
