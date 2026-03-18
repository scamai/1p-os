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
        selected ? "border-black shadow-black/[0.04]" : "border-black/[0.08]"
      }`}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !border-2 !border-black/40 !bg-white"
      />

      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[11px] text-white">
          ✓
        </div>
        <p className="text-[12px] font-semibold text-black/80">{d.label}</p>
      </div>
    </div>
  );
}
