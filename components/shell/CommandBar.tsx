"use client";

import * as React from "react";

interface CommandBarProps {
  open: boolean;
  onClose: () => void;
  onAction?: (action: string, params?: Record<string, unknown>) => void;
  agents?: { id: string; name: string }[];
}

interface CommandItem {
  id: string;
  label: string;
  category: "actions" | "agents" | "safety";
  action: string;
  params?: Record<string, unknown>;
}

const RECENT_KEY = "1pos-recent-commands";
const MAX_RECENT = 5;

function getRecentCommands(): CommandItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as CommandItem[]) : [];
  } catch {
    return [];
  }
}

function saveRecentCommand(item: CommandItem) {
  try {
    const recent = getRecentCommands().filter((r) => r.id !== item.id);
    recent.unshift(item);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // localStorage unavailable
  }
}

const staticActions: CommandItem[] = [
  { id: "new_invoice", label: "New Invoice", category: "actions", action: "new_invoice" },
  { id: "add_person", label: "Add Client", category: "actions", action: "add_person" },
  { id: "new_expense", label: "Log Expense", category: "actions", action: "new_expense" },
  { id: "new_project", label: "New Project", category: "actions", action: "new_project" },
  { id: "upload_document", label: "Upload Document", category: "actions", action: "upload_document" },
];

const safetyActions: CommandItem[] = [
  { id: "kill_switch", label: "Stop Everything", category: "safety", action: "kill_switch" },
  { id: "pause_agent", label: "Pause Agent", category: "safety", action: "pause_agent" },
  { id: "resume_all", label: "Resume All", category: "safety", action: "resume_all" },
];

function CommandBar({ open, onClose, onAction, agents = [] }: CommandBarProps) {
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [inlineResponse, setInlineResponse] = React.useState<string | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const recognitionRef = React.useRef<any>(null);

  const startVoice = React.useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setSearch(transcript);
      setSelectedIndex(0);
      setInlineResponse(null);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stopVoice = React.useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const agentItems: CommandItem[] = React.useMemo(
    () =>
      agents.map((a) => ({
        id: `agent_${a.id}`,
        label: `@${a.name}`,
        category: "agents" as const,
        action: "hire_agent",
        params: { agentId: a.id, agentName: a.name },
      })),
    [agents]
  );

  const allItems = React.useMemo(
    () => [...staticActions, ...agentItems, ...safetyActions],
    [agentItems]
  );

  const filtered = React.useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q)
    );
  }, [search, allItems]);

  const recentCommands = React.useMemo(() => {
    if (search.trim()) return [];
    return getRecentCommands();
  }, [search, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayedItems = search.trim() ? filtered : recentCommands;
  const hasKnownMatches = filtered.length > 0;

  // Group items by category
  const grouped = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of displayedItems) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [displayedItems]);

  const flatItems = React.useMemo(() => {
    const categoryOrder = ["actions", "agents", "safety"];
    const result: CommandItem[] = [];
    for (const cat of categoryOrder) {
      if (grouped[cat]) {
        result.push(...grouped[cat]);
      }
    }
    return result;
  }, [grouped]);

  // Reset state when opened/closed
  React.useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
      setInlineResponse(null);
      setParsing(false);
      setListening(false);
      recognitionRef.current?.stop();
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      recognitionRef.current?.stop();
      setListening(false);
    }
  }, [open]);

  // Global Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Toggle is handled by parent via onClose or onOpenCommandBar
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Clamp selected index
  React.useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(Math.max(0, flatItems.length - 1));
    }
  }, [flatItems.length, selectedIndex]);

  const executeItem = React.useCallback(
    (item: CommandItem) => {
      saveRecentCommand(item);
      onAction?.(item.action, item.params);
      onClose();
    },
    [onAction, onClose]
  );

  const handleNlpParse = React.useCallback(async () => {
    if (!search.trim() || hasKnownMatches) return;

    setParsing(true);
    setInlineResponse(null);

    try {
      // Use AI Core engine (algorithm-first, no AI calls)
      const res = await fetch("/api/core", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: search }),
      });

      if (!res.ok) {
        setInlineResponse("Could not parse command. Try again.");
        return;
      }

      const data = (await res.json()) as {
        type: "action" | "insight" | "info" | "error";
        message?: string;
        navigate?: string;
        intent?: { action: string; params: Record<string, unknown>; display: string };
      };

      if (data.type === "action" && data.navigate) {
        onAction?.("navigate", { page: data.navigate });
        onClose();
      } else if (data.type === "action" && data.intent) {
        onAction?.(data.intent.action, data.intent.params);
        onClose();
      } else if (data.message) {
        setInlineResponse(data.message);
      }
    } catch {
      setInlineResponse("Failed to parse command.");
    } finally {
      setParsing(false);
    }
  }, [search, hasKnownMatches, onAction, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        executeItem(flatItems[selectedIndex]);
      } else {
        handleNlpParse();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  const categoryLabels: Record<string, string> = {
    actions: "Actions",
    agents: "Agents",
    safety: "Safety",
  };

  const categoryOrder = ["actions", "agents", "safety"];
  let itemIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[520px] rounded-xl border border-zinc-200 bg-white/80 shadow-2xl backdrop-blur-xl">
        {/* Search input */}
        <div className="flex items-center px-4">
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
              setInlineResponse(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={listening ? "Listening..." : "What do you need?"}
            className="h-14 flex-1 bg-transparent text-[16px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={listening ? stopVoice : startVoice}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
              listening
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-600 hover:text-zinc-600"
            }`}
            aria-label={listening ? "Stop listening" : "Voice input"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            {listening && (
              <span className="absolute h-8 w-8 animate-ping rounded-lg bg-zinc-100" />
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-zinc-200" />

        {/* Inline response */}
        {inlineResponse && (
          <div className="px-5 py-3">
            <p className="text-sm text-zinc-600">{inlineResponse}</p>
          </div>
        )}

        {/* Parsing indicator */}
        {parsing && (
          <div className="flex items-center gap-2 px-5 py-3">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-900" />
          </div>
        )}

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-2" role="listbox">
          {!search.trim() && recentCommands.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-zinc-600">
              Type to search commands...
            </p>
          )}

          {!search.trim() && recentCommands.length > 0 && (
            <div className="px-5 pb-1 pt-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">
                Recent
              </span>
            </div>
          )}

          {search.trim() &&
            categoryOrder.map((cat) => {
              const items = grouped[cat];
              if (!items || items.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="px-5 pb-1 pt-3">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">
                      {categoryLabels[cat]}
                    </span>
                  </div>
                  {items.map((item) => {
                    itemIndex++;
                    const idx = itemIndex;
                    return (
                      <button
                        key={item.id}
                        role="option"
                        aria-selected={idx === selectedIndex}
                        onClick={() => executeItem(item)}
                        className={`flex w-full items-center justify-between rounded-lg px-5 py-2 text-left text-sm transition-colors duration-200 ${
                          idx === selectedIndex
                            ? "bg-zinc-100 text-zinc-900"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        <span>{item.label}</span>
                        {idx === selectedIndex && (
                          <span className="text-xs text-zinc-600">&#x23CE;</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}

          {!search.trim() &&
            recentCommands.map((item) => {
              itemIndex++;
              const idx = itemIndex;
              return (
                <button
                  key={item.id}
                  role="option"
                  aria-selected={idx === selectedIndex}
                  onClick={() => executeItem(item)}
                  className={`flex w-full items-center justify-between rounded-lg px-5 py-2 text-left text-sm transition-colors duration-200 ${
                    idx === selectedIndex
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  <span>{item.label}</span>
                  {idx === selectedIndex && (
                    <span className="text-xs text-zinc-600">&#x23CE;</span>
                  )}
                </button>
              );
            })}

          {search.trim() && filtered.length === 0 && !parsing && !inlineResponse && (
            <p className="px-5 py-6 text-center text-sm text-zinc-600">
              Press Enter to parse with AI...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export { CommandBar };
export type { CommandBarProps };
