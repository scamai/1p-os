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
          className="rounded-md border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
        >
          Review {pendingDecisions} decision{pendingDecisions > 1 ? "s" : ""}
        </button>
      )}
      <button
        onClick={() => onAction("new_invoice")}
        className="rounded-md border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
      >
        New Invoice
      </button>
      <button
        onClick={() => onAction("hire_agent")}
        className="rounded-md border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
      >
        Hire Agent
      </button>
    </div>
  );
}

export { QuickActions };
