"use client";

import * as React from "react";

interface Command {
  id: string;
  label: string;
  description: string;
  action: () => void;
}

const defaultCommands: Command[] = [
  {
    id: "chat",
    label: "@agent chat",
    description: "Chat with an agent",
    action: () => {},
  },
  {
    id: "hire",
    label: "Hire agent",
    description: "Browse the agent marketplace",
    action: () => {},
  },
  {
    id: "kill",
    label: "Kill switch",
    description: "Pause or stop agents",
    action: () => {},
  },
  {
    id: "cost",
    label: "Cost check",
    description: "See current spending",
    action: () => {},
  },
];

interface CommandBarProps {
  commands?: Command[];
}

function CommandBar({ commands = defaultCommands }: CommandBarProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-2xl">
        <div className="flex items-center border-b border-[var(--border)] px-3">
          <svg
            className="mr-2 h-4 w-4 shrink-0 text-[var(--muted-foreground)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command..."
            className="h-11 w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-[var(--muted-foreground)]">
              No commands found.
            </p>
          )}
          {filtered.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => {
                cmd.action();
                setOpen(false);
              }}
              className="flex w-full flex-col rounded-md px-3 py-2 text-left transition-colors hover:bg-[var(--muted)]"
            >
              <span className="text-sm font-medium text-[var(--foreground)]">
                {cmd.label}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {cmd.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { CommandBar };
export type { Command };
