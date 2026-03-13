import * as React from "react";

interface TabBarProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
  className?: string;
}

function TabBar({ tabs, active, onChange, className = "" }: TabBarProps) {
  return (
    <div
      className={`flex gap-8 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={`relative pb-2.5 text-[13px] font-medium transition-colors duration-200 ${
              isActive
                ? "text-zinc-900"
                : "text-zinc-600 hover:text-zinc-500"
            }`}
          >
            {tab}
            {isActive && (
              <span
                className="absolute inset-x-0 bottom-0 h-[1.5px] bg-zinc-900"
                style={{ bottom: "-8px" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export { TabBar };
