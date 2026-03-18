"use client";

import { useState } from "react";

interface FounderTipProps {
  title: string;
  items: { term: string; explanation: string }[];
}

export function FounderTip({ title, items }: FounderTipProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 rounded-xl border border-black/[0.06] bg-black/[0.02]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
            ?
          </span>
          <span className="text-[13px] font-medium text-black/70">{title}</span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-black/40 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-black/[0.06] px-4 py-3 space-y-3">
          {items.map((item, i) => (
            <div key={i}>
              <p className="text-[12px] font-semibold text-black/80">{item.term}</p>
              <p className="mt-0.5 text-[12px] text-black/50 leading-relaxed">{item.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
