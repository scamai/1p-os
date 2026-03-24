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
      className={`flex gap-4 sm:gap-8 overflow-x-auto ${className}`}
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
            className={`relative pb-2.5 text-[13px] font-medium transition-colors duration-150 whitespace-nowrap ${
              isActive
                ? "text-black"
                : "text-black/50 hover:text-black/70"
            }`}
          >
            {tab}
            {isActive && (
              <span
                className="absolute inset-x-0 -bottom-2 h-[1.5px] bg-black"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export { TabBar };
