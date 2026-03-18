"use client";

import { ReactNode } from "react";

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  count?: number;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

function SidebarItem({
  icon,
  label,
  href,
  count,
  isActive,
  isExpanded,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      title={isExpanded ? undefined : label}
      className={`
        group relative flex w-full items-center gap-3 px-4 py-1.5
        text-left transition-colors duration-200
        ${isActive ? "text-black" : "text-black/50 hover:text-black/70"}
      `}
    >
      {/* Active indicator — 2px left white bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-black" />
      )}

      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center ${
          isActive ? "text-black" : "text-black/60 group-hover:text-black/70"
        }`}
      >
        {icon}
      </span>

      <span
        className={`truncate text-[13px] leading-5 ${
          isActive ? "text-black font-medium" : ""
        }`}
      >
        {label}
      </span>

      {count !== undefined && count > 0 && (
        <span className="ml-auto shrink-0 font-mono text-[11px] leading-none text-black/60">
          {count}
        </span>
      )}
    </button>
  );
}

export { SidebarItem };
export type { SidebarItemProps };
