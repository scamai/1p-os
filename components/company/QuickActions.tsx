"use client";

interface QuickActionsProps {
  pendingDecisions: number;
  onAction: (action: string) => void;
}

function QuickActions({ pendingDecisions, onAction }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {pendingDecisions > 0 && (
        <button
          onClick={() => onAction("navigate_decisions")}
          className="rounded-md border border-black/[0.08] px-3 py-1.5 text-[12px] font-medium text-black/70 transition-colors hover:border-black/30 hover:text-black"
        >
          Review {pendingDecisions} decision{pendingDecisions > 1 ? "s" : ""}
        </button>
      )}
      <button
        onClick={() => onAction("new_invoice")}
        className="rounded-md border border-black/[0.08] px-3 py-1.5 text-[12px] font-medium text-black/70 transition-colors hover:border-black/30 hover:text-black"
      >
        New Invoice
      </button>
      <button
        onClick={() => onAction("hire_agent")}
        className="rounded-md border border-black/[0.08] px-3 py-1.5 text-[12px] font-medium text-black/70 transition-colors hover:border-black/30 hover:text-black"
      >
        Hire Agent
      </button>
    </div>
  );
}

export { QuickActions };
