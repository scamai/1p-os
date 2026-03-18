"use client";

import { ReactNode, useEffect, useRef } from "react";

interface InlineFormSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

function InlineFormSheet({
  open,
  onClose,
  title,
  children,
}: InlineFormSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/20 transition-opacity duration-200
          ${open ? "opacity-100" : "pointer-events-none opacity-0"}
        `}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          fixed left-0 right-0 top-0 z-50 mx-auto w-full max-w-2xl
          transition-all duration-200 ease-out
          ${open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}
        `}
      >
        <div className="mx-4 mt-4 max-h-[80vh] overflow-y-auto rounded-xl border border-black/[0.08] bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/[0.08] px-6 py-4">
            <h2 className="text-sm font-medium text-black/60">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded-md text-black/60 transition-colors duration-200 hover:text-black/60"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M3 3l8 8M11 3l-8 8" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </>
  );
}

export { InlineFormSheet };
export type { InlineFormSheetProps };
