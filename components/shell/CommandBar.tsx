"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useHandyVoice, VoiceOverlay } from "@/components/shell/VoiceOverlay";
import { speak } from "@/lib/voice/voice-feedback";

interface CommandBarProps {
  open: boolean;
  onClose: () => void;
  onAction?: (action: string, params?: Record<string, unknown>) => void;
  agents?: { id: string; name: string }[];
}

interface ParsedIntent {
  action: string;
  params: Record<string, unknown>;
  confidence: number;
  display_text?: string;
}

// ── Navigation map ──

const NAV_MAP: Record<string, { path: string; label: string }> = {
  home: { path: "/company", label: "HQ" },
  hq: { path: "/company", label: "HQ" },
  dashboard: { path: "/company", label: "HQ" },
  finance: { path: "/finance", label: "Finance" },
  money: { path: "/finance", label: "Finance" },
  sales: { path: "/sales", label: "Sales" },
  people: { path: "/people", label: "People" },
  crm: { path: "/crm", label: "CRM" },
  contacts: { path: "/people", label: "People" },
  work: { path: "/work", label: "Work" },
  projects: { path: "/work", label: "Work" },
  team: { path: "/team", label: "Team" },
  agents: { path: "/team", label: "Team" },
  talent: { path: "/talent", label: "Talent" },
  marketplace: { path: "/talent", label: "Talent" },
  hire: { path: "/talent", label: "Talent" },
  channels: { path: "/channels", label: "Channels" },
  operations: { path: "/operations", label: "Operations" },
  org: { path: "/operations", label: "Operations" },
  automations: { path: "/automations", label: "Automations" },
  memory: { path: "/memory", label: "Memory" },
  canvas: { path: "/canvas", label: "Canvas" },
  costs: { path: "/costs", label: "Costs" },
  budget: { path: "/costs", label: "Costs" },
  settings: { path: "/settings", label: "Settings" },
  setup: { path: "/setup", label: "Setup" },
  products: { path: "/products", label: "Products" },
  inventory: { path: "/products", label: "Products" },
  achievements: { path: "/achievements", label: "Achievements" },
  milestones: { path: "/achievements", label: "Achievements" },
  history: { path: "/history", label: "History" },
  activity: { path: "/history", label: "History" },
  "activity log": { path: "/history", label: "History" },
  safety: { path: "/settings/safety", label: "Safety Settings" },
  "safety settings": { path: "/settings/safety", label: "Safety Settings" },
  keys: { path: "/settings/keys", label: "API Keys" },
  "api keys": { path: "/settings/keys", label: "API Keys" },
  models: { path: "/settings/models", label: "Model Config" },
  "model settings": { path: "/settings/models", label: "Model Config" },
};

// ── Local intent parser (instant, no API call) ──

function parseIntent(input: string): ParsedIntent | null {
  const lower = input.toLowerCase().trim();
  if (!lower) return null;

  // Navigation: "go to X", "open X", "show X", or just the page name
  const navMatch = lower.match(/^(?:go\s+to|open|show|navigate\s+to|take\s+me\s+to)?\s*(.+)/);
  if (navMatch) {
    const target = navMatch[1].trim();
    for (const [key, nav] of Object.entries(NAV_MAP)) {
      if (target === key || target === nav.label.toLowerCase() || target.includes(key)) {
        return { action: "navigate", params: { path: nav.path }, confidence: 0.95, display_text: `Go to ${nav.label}` };
      }
    }
  }

  // @agent chat
  if (lower.startsWith("@")) {
    const match = input.match(/^@(\S+)\s*(.*)/);
    if (match) {
      return { action: "agent_chat", params: { agent_name: match[1], message: match[2] }, confidence: 0.95, display_text: `Talk to ${match[1]}` };
    }
  }

  // Safety / kill switch
  if (lower.match(/stop everything|kill switch|emergency stop|halt all|pause all/)) {
    return { action: "kill_switch", params: {}, confidence: 0.95, display_text: "Stop all agents" };
  }
  if (lower.match(/^(stop|pause)\s+(.+)/)) {
    const agentName = lower.match(/^(?:stop|pause)\s+(.+)/)?.[1];
    return { action: "pause_agent", params: { name: agentName }, confidence: 0.85, display_text: `Pause ${agentName}` };
  }
  if (lower.match(/^resume/)) {
    return { action: "resume_all", params: {}, confidence: 0.85, display_text: "Resume all agents" };
  }

  // Create actions
  if (lower.match(/invoice|bill\s/)) {
    const amount = input.match(/\$?([\d,]+(?:\.\d{2})?)/)?.[1]?.replace(",", "");
    const client = input.replace(/(?:create|new|send|make)?\s*(?:an?\s+)?invoice\s*(?:for|to)?\s*/i, "").replace(/\$[\d,.]+/, "").trim();
    return { action: "new_invoice", params: { ...(amount ? { amount } : {}), ...(client ? { client } : {}) }, confidence: 0.9, display_text: `Create invoice${client ? ` for ${client}` : ""}${amount ? ` — $${amount}` : ""}` };
  }
  if (lower.match(/expense|spent|paid for/)) {
    const amount = input.match(/\$?([\d,]+(?:\.\d{2})?)/)?.[1]?.replace(",", "");
    return { action: "new_expense", params: { ...(amount ? { amount } : {}) }, confidence: 0.9, display_text: `Log expense${amount ? ` — $${amount}` : ""}` };
  }
  if (lower.match(/add\s+(contact|person|client|lead)|new\s+(contact|person|client|lead)/)) {
    const nameAfter = input.replace(/(?:add|new)\s+(?:contact|person|client|lead)\s*/i, "").trim();
    return { action: "add_contact", params: { ...(nameAfter ? { name: nameAfter } : {}) }, confidence: 0.9, display_text: `Add contact${nameAfter ? `: ${nameAfter}` : ""}` };
  }
  if (lower.match(/new project|create project/)) {
    const name = input.replace(/(?:new|create)\s+project\s*/i, "").trim();
    return { action: "new_project", params: { ...(name ? { name } : {}) }, confidence: 0.9, display_text: `New project${name ? `: ${name}` : ""}` };
  }
  if (lower.match(/hire|new agent|add agent/)) {
    const role = input.replace(/(?:hire|add|create)\s+(?:an?\s+)?(?:new\s+)?agent\s*/i, "").trim();
    return { action: "hire_agent", params: { ...(role ? { role } : {}) }, confidence: 0.9, display_text: `Hire agent${role ? `: ${role}` : ""}` };
  }
  if (lower.match(/upload|attach/)) {
    return { action: "upload_document", params: {}, confidence: 0.85, display_text: "Upload document" };
  }

  // Browser/app navigation
  if (lower.match(/^go\s+back$|^back$/)) {
    return { action: "go_back", params: {}, confidence: 0.95, display_text: "Go back" };
  }
  if (lower.match(/^go\s+forward$|^forward$/)) {
    return { action: "go_forward", params: {}, confidence: 0.95, display_text: "Go forward" };
  }
  if (lower.match(/^refresh$|^reload$/)) {
    return { action: "refresh", params: {}, confidence: 0.95, display_text: "Refresh page" };
  }

  // Approve / reject decisions
  if (lower.match(/^approve\s*(all|everything)?$/)) {
    return { action: "approve_decision", params: { scope: lower.includes("all") ? "all" : "next" }, confidence: 0.9, display_text: lower.includes("all") ? "Approve all pending decisions" : "Approve next decision" };
  }
  if (lower.match(/^reject\s|^deny\s|^decline\s/)) {
    const what = input.replace(/^(reject|deny|decline)\s+/i, "").trim();
    return { action: "reject_decision", params: { what }, confidence: 0.9, display_text: `Reject: ${what || "next decision"}` };
  }

  // Search
  if (lower.match(/^(search|find|look for|look up)\s+/)) {
    const query = input.replace(/^(search|find|look for|look up)\s+/i, "").trim();
    return { action: "search", params: { query }, confidence: 0.85, display_text: `Search: ${query}` };
  }

  // Sidebar / UI control
  if (lower.match(/toggle sidebar|hide sidebar|show sidebar|collapse sidebar|expand sidebar/)) {
    return { action: "toggle_sidebar", params: {}, confidence: 0.9, display_text: "Toggle sidebar" };
  }
  if (lower.match(/edit sidebar|customize sidebar|reorder sidebar/)) {
    return { action: "edit_sidebar", params: {}, confidence: 0.9, display_text: "Edit sidebar" };
  }

  // Scroll commands
  if (lower.match(/^scroll\s+(up|down|top|bottom)$/)) {
    const dir = lower.match(/scroll\s+(up|down|top|bottom)/)?.[1] ?? "down";
    return { action: "scroll", params: { direction: dir }, confidence: 0.9, display_text: `Scroll ${dir}` };
  }

  // Voice control
  if (lower.match(/^(mute|unmute|stop listening|voice off|quiet)$/)) {
    return { action: "voice_mute", params: {}, confidence: 0.95, display_text: "Mute voice feedback" };
  }
  if (lower.match(/^(voice on|start listening|unmute voice|listen)$/)) {
    return { action: "voice_unmute", params: {}, confidence: 0.95, display_text: "Enable voice feedback" };
  }

  // Automations
  if (lower.match(/create automation|new automation|add automation/)) {
    return { action: "new_automation", params: {}, confidence: 0.9, display_text: "Create new automation" };
  }
  if (lower.match(/^(enable|disable|toggle)\s+automation/)) {
    const action = lower.startsWith("enable") ? "enable" : lower.startsWith("disable") ? "disable" : "toggle";
    const name = input.replace(/^(enable|disable|toggle)\s+automation\s*/i, "").trim();
    return { action: "toggle_automation", params: { action, name }, confidence: 0.85, display_text: `${action} automation${name ? `: ${name}` : ""}` };
  }

  // Resume specific agent
  if (lower.match(/^resume\s+(.+)/)) {
    const name = lower.match(/^resume\s+(.+)/)?.[1];
    return { action: "resume_agent", params: { name }, confidence: 0.85, display_text: `Resume ${name}` };
  }

  // Install skill / configure model
  if (lower.match(/install skill|add skill/)) {
    return { action: "install_skill", params: {}, confidence: 0.9, display_text: "Install skill" };
  }
  if (lower.match(/configure model|change model|switch model/)) {
    return { action: "configure_model", params: {}, confidence: 0.9, display_text: "Configure AI model" };
  }

  // Questions / info
  if (lower.match(/^(how much|what|when|where|who|how many|show me|tell me|what's)/)) {
    if (lower.match(/spend|cost|spent|budget/)) {
      return { action: "quick_info", params: { query: "spending" }, confidence: 0.85, display_text: "Today's spending: $3.86 across 7 agents" };
    }
    if (lower.match(/revenue|earned|income|mrr/)) {
      return { action: "quick_info", params: { query: "revenue" }, confidence: 0.85, display_text: "MRR: $45,000 — 8 active customers" };
    }
    if (lower.match(/agent|team|working/)) {
      return { action: "quick_info", params: { query: "agents" }, confidence: 0.85, display_text: "5 agents active, 1 paused, 1 idle" };
    }
    if (lower.match(/task|doing|progress/)) {
      return { action: "quick_info", params: { query: "tasks" }, confidence: 0.85, display_text: "54 tasks completed today" };
    }
    if (lower.match(/decision|pending|approve/)) {
      return { action: "navigate", params: { path: "/company" }, confidence: 0.85, display_text: "5 pending decisions — opening HQ" };
    }
  }

  return null;
}

// ── CommandBar Component ──

function CommandBar({ open, onClose, onAction, agents = [] }: CommandBarProps) {
  const router = useRouter();
  const [input, setInput] = React.useState("");
  const [intent, setIntent] = React.useState<ParsedIntent | null>(null);
  const [executed, setExecuted] = React.useState<string | null>(null);
  const [micError, setMicError] = React.useState<string | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Voice
  const voice = useHandyVoice({
    onTranscript: (text) => {
      setMicError(null);
      setInput(text);
      // Auto-parse and execute voice commands
      const parsed = parseIntent(text);
      if (parsed && parsed.confidence >= 0.85) {
        setIntent(parsed);
        // Auto-execute high-confidence voice commands after a beat
        setTimeout(() => executeIntent(parsed), 400);
      } else {
        setIntent(parsed);
      }
    },
    onInterim: (text) => {
      setInput(text);
      // Show live parse as user speaks
      setIntent(parseIntent(text));
    },
    onError: (err) => setMicError(err),
  });

  const listening = voice.state === "recording" || voice.state === "transcribing";
  const voiceError = voice.state === "error";

  // Parse as user types
  React.useEffect(() => {
    if (input.trim()) {
      setIntent(parseIntent(input));
    } else {
      setIntent(null);
    }
    setExecuted(null);
  }, [input]);

  // Reset on open — auto-start voice
  React.useEffect(() => {
    if (open) {
      setInput("");
      setIntent(null);
      setExecuted(null);
      setMicError(null);
      setParsing(false);
      // Start listening immediately
      setTimeout(() => voice.start(), 100);
    } else {
      voice.cancel();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Execute an intent
  const executeIntent = React.useCallback(
    (i: ParsedIntent) => {
      if (i.action === "navigate") {
        const label = i.display_text?.replace("Go to ", "") ?? "";
        setExecuted(`Opening ${label}...`);
        speak(`Opening ${label}`);
        router.push(i.params.path as string);
        setTimeout(onClose, 300);
      } else if (i.action === "go_back") {
        setExecuted("Going back");
        speak("Going back");
        window.history.back();
        setTimeout(onClose, 300);
      } else if (i.action === "go_forward") {
        setExecuted("Going forward");
        speak("Going forward");
        window.history.forward();
        setTimeout(onClose, 300);
      } else if (i.action === "refresh") {
        setExecuted("Refreshing");
        speak("Refreshing");
        router.refresh();
        setTimeout(onClose, 300);
      } else if (i.action === "scroll") {
        const dir = i.params.direction as string;
        setExecuted(`Scrolling ${dir}`);
        if (dir === "top") window.scrollTo({ top: 0, behavior: "smooth" });
        else if (dir === "bottom") window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        else if (dir === "up") window.scrollBy({ top: -400, behavior: "smooth" });
        else window.scrollBy({ top: 400, behavior: "smooth" });
        setTimeout(onClose, 300);
      } else if (i.action === "quick_info") {
        setExecuted(i.display_text ?? "");
        speak(i.display_text ?? "");
      } else {
        const msg = i.display_text ?? `Running: ${i.action}`;
        setExecuted(msg);
        speak(msg);
        onAction?.(i.action, i.params);
        setTimeout(onClose, 600);
      }
    },
    [onAction, onClose, router]
  );

  // Fallback: parse via API
  const parseViaApi = React.useCallback(async () => {
    if (!input.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/ai/parse-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.action && data.action !== "unknown") {
          setIntent(data);
          executeIntent(data);
        } else {
          setExecuted("Didn't catch that. Try again.");
        }
      }
    } catch {
      setExecuted("Failed to parse command.");
    } finally {
      setParsing(false);
    }
  }, [input, executeIntent]);

  // Listen for voice-transcript events from AlwaysOnVoice or Header
  React.useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text;
      if (text && open) {
        setInput(text);
        const parsed = parseIntent(text);
        if (parsed && parsed.confidence >= 0.85) {
          setIntent(parsed);
          setTimeout(() => executeIntent(parsed), 400);
        } else if (parsed) {
          setIntent(parsed);
        } else {
          // No local match — try API
          setTimeout(() => parseViaApi(), 200);
        }
      }
    };
    window.addEventListener("voice-transcript", handler);
    return () => window.removeEventListener("voice-transcript", handler);
  }, [open, executeIntent, parseViaApi]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (intent) {
        executeIntent(intent);
      } else if (input.trim()) {
        parseViaApi();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const toggleVoice = React.useCallback(() => {
    if (listening) {
      voice.stop();
    } else {
      setInput("");
      setIntent(null);
      setExecuted(null);
      voice.start();
    }
  }, [listening, voice]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        {/* Input row */}
        <div className="flex items-center gap-3 px-5">
          {/* Prompt indicator */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={listening ? "Listening..." : "What do you need?"}
            className="h-14 flex-1 bg-transparent text-[16px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          />

          {/* Mic button */}
          <button
            type="button"
            onClick={toggleVoice}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
              listening
                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 scale-110"
                : voiceError
                  ? "bg-zinc-200 text-zinc-500"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
            }`}
            aria-label={listening ? "Stop" : voiceError ? "Mic not working" : "Voice"}
            title={voiceError && micError ? micError : undefined}
          >
            {listening ? (
              <div className="h-2.5 w-2.5 rounded-sm bg-white" />
            ) : voiceError ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
            )}
          </button>
        </div>

        {/* Live waveform when listening */}
        {listening && (
          <div className="flex h-8 items-end justify-center gap-[3px] px-5 pb-2">
            {voice.levels.map((v, i) => (
              <div
                key={i}
                className="w-[4px] rounded-full bg-zinc-400"
                style={{
                  height: `${Math.max(3, Math.min(24, 3 + Math.pow(v, 0.6) * 21))}px`,
                  opacity: Math.max(0.3, Math.min(1, v * 2.5)),
                  transition: "height 50ms ease-out, opacity 80ms ease-out",
                }}
              />
            ))}
          </div>
        )}

        <div className="mx-5 border-t border-zinc-100" />

        {/* Intent preview */}
        <div className="px-5 py-3">
          {micError ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <span className="text-[13px] text-zinc-600">{micError}</span>
            </div>
          ) : executed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-[13px] text-zinc-700">{executed}</span>
            </div>
          ) : parsing ? (
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
              <span className="text-[13px] text-zinc-500">Thinking...</span>
            </div>
          ) : intent ? (
            <button
              onClick={() => executeIntent(intent)}
              className="flex w-full items-center gap-2.5 rounded-lg py-1 text-left transition-colors hover:bg-zinc-50 -mx-2 px-2"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                <ActionIcon action={intent.action} />
              </div>
              <span className="flex-1 text-[13px] text-zinc-800">{intent.display_text}</span>
              <span className="text-[11px] text-zinc-400">
                &#x23CE; run
              </span>
            </button>
          ) : input.trim() ? (
            <p className="text-[13px] text-zinc-400">
              Enter to run
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-zinc-400">Try saying</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Go to finance",
                  "Create invoice for Acme",
                  "Approve all",
                  "Pause Sales Agent",
                  "Scroll down",
                  "Go back",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setInput(s);
                      const parsed = parseIntent(s);
                      setIntent(parsed);
                    }}
                    className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Keyboard hints */}
        <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-2">
          <span className="text-[10px] text-zinc-400">
            &#x23CE; execute &middot; esc close
          </span>
          <span className="text-[10px] text-zinc-400">
            &#x2318;&#x21E7;V voice
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Action icon by type ──

function ActionIcon({ action }: { action: string }) {
  const cls = "text-zinc-500";
  switch (action) {
    case "navigate":
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cls} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case "new_invoice":
    case "new_expense":
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cls}>
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      );
    case "kill_switch":
    case "pause_agent":
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-900">
          <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      );
    case "quick_info":
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cls}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    case "go_back":
    case "go_forward":
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cls}>
          {action === "go_back"
            ? <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>
            : <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>
          }
        </svg>
      );
    case "refresh":
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cls}>
          <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      );
    case "approve_decision":
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-900">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "reject_decision":
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-900">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "scroll":
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cls}>
          <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
        </svg>
      );
    case "search":
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cls}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "toggle_sidebar":
    case "edit_sidebar":
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cls}>
          <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      );
    case "voice_mute":
    case "voice_unmute":
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cls}>
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        </svg>
      );
    default:
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cls}>
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
  }
}

export { CommandBar };
export type { CommandBarProps };
