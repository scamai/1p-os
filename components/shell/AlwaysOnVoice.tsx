"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
} from "@/lib/voice/speech-recognition";
import { speak, setVoiceFeedbackEnabled, stopSpeaking } from "@/lib/voice/voice-feedback";

/**
 * AlwaysOnVoice — Persistent voice control for the entire platform
 * =================================================================
 * When enabled, continuously listens for voice commands without
 * needing the CommandBar open. Uses Web Speech API in continuous mode
 * with auto-restart so it never stops listening.
 *
 * Activated via:
 *  - The mic toggle in the header (always-on indicator)
 *  - Voice command: "start listening" / "stop listening"
 *  - Keyboard: Cmd+Shift+L to toggle always-on mode
 *
 * The component imports parseIntent from the same logic as CommandBar
 * so all voice commands work identically.
 */

interface AlwaysOnVoiceProps {
  onAction: (action: string, params?: Record<string, unknown>) => void;
  onOpenCommandBar: () => void;
}

// ── Navigation map (duplicated subset for direct handling) ──
const NAV_MAP: Record<string, string> = {
  home: "/company", hq: "/company", dashboard: "/company",
  finance: "/finance", money: "/finance", sales: "/sales",
  people: "/people", crm: "/crm", contacts: "/people",
  work: "/work", projects: "/work", team: "/team", agents: "/team",
  talent: "/talent", marketplace: "/talent",
  channels: "/channels", operations: "/operations", org: "/operations",
  automations: "/automations", memory: "/memory", canvas: "/canvas",
  costs: "/costs", budget: "/costs", settings: "/settings",
  setup: "/setup",
  products: "/products", inventory: "/products",
  achievements: "/achievements", milestones: "/achievements",
  history: "/history", activity: "/history",
  safety: "/settings/safety", keys: "/settings/keys",
  models: "/settings/models",
};

function quickParse(input: string): { action: string; params: Record<string, unknown>; label: string } | null {
  const lower = input.toLowerCase().trim();
  if (!lower) return null;

  // Navigation
  const navMatch = lower.match(/^(?:go\s+to|open|show|navigate\s+to|take\s+me\s+to)?\s*(.+)/);
  if (navMatch) {
    const target = navMatch[1].trim();
    for (const [key, path] of Object.entries(NAV_MAP)) {
      if (target === key || target.includes(key)) {
        return { action: "navigate", params: { path }, label: key };
      }
    }
  }

  // Back / forward / refresh
  if (lower.match(/^go\s+back$|^back$/)) return { action: "go_back", params: {}, label: "back" };
  if (lower.match(/^go\s+forward$|^forward$/)) return { action: "go_forward", params: {}, label: "forward" };
  if (lower.match(/^refresh$|^reload$/)) return { action: "refresh", params: {}, label: "refresh" };

  // Safety
  if (lower.match(/stop everything|kill switch|emergency stop|halt all|pause all/)) {
    return { action: "kill_switch", params: {}, label: "kill switch" };
  }
  if (lower.match(/^(stop|pause)\s+(.+)/)) {
    const name = lower.match(/^(?:stop|pause)\s+(.+)/)?.[1];
    return { action: "pause_agent", params: { name }, label: `pause ${name}` };
  }
  if (lower.match(/^resume\s+(.+)/)) {
    const name = lower.match(/^resume\s+(.+)/)?.[1];
    return { action: "resume_agent", params: { name }, label: `resume ${name}` };
  }
  if (lower.match(/^resume$/)) return { action: "resume_all", params: {}, label: "resume all" };

  // Create
  if (lower.match(/invoice|bill\s/)) return { action: "new_invoice", params: {}, label: "new invoice" };
  if (lower.match(/expense|spent|paid for/)) return { action: "new_expense", params: {}, label: "new expense" };
  if (lower.match(/add\s+(contact|person|client|lead)|new\s+(contact|person|client|lead)/)) return { action: "add_contact", params: {}, label: "add contact" };
  if (lower.match(/new project|create project/)) return { action: "new_project", params: {}, label: "new project" };
  if (lower.match(/hire|new agent|add agent/)) return { action: "hire_agent", params: {}, label: "hire agent" };
  if (lower.match(/upload|attach/)) return { action: "upload_document", params: {}, label: "upload" };

  // Approve / reject
  if (lower.match(/^approve/)) return { action: "approve_decision", params: { scope: lower.includes("all") ? "all" : "next" }, label: "approve" };
  if (lower.match(/^(reject|deny|decline)/)) return { action: "reject_decision", params: {}, label: "reject" };

  // Scroll
  if (lower.match(/^scroll\s+(up|down|top|bottom)$/)) {
    const dir = lower.match(/scroll\s+(up|down|top|bottom)/)?.[1] ?? "down";
    return { action: "scroll", params: { direction: dir }, label: `scroll ${dir}` };
  }

  // Voice
  if (lower.match(/^(mute|stop listening|voice off|quiet)$/)) return { action: "voice_mute", params: {}, label: "mute" };

  // Search (catchall for questions)
  if (lower.match(/^(search|find|look for)\s+/)) {
    const query = input.replace(/^(search|find|look for)\s+/i, "").trim();
    return { action: "search", params: { query }, label: `search ${query}` };
  }

  return null;
}

function AlwaysOnVoice({ onAction, onOpenCommandBar }: AlwaysOnVoiceProps) {
  const router = useRouter();
  const [active, setActive] = React.useState(false);
  const [lastHeard, setLastHeard] = React.useState("");
  const recognitionRef = React.useRef<ReturnType<typeof createSpeechRecognition>>(null);
  const restartTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null);
  const activeRef = React.useRef(false);

  // Keep ref in sync
  activeRef.current = active;

  // Persist preference
  React.useEffect(() => {
    const saved = localStorage.getItem("1pos-voice-always-on");
    if (saved === "true") setActive(true);
  }, []);

  React.useEffect(() => {
    localStorage.setItem("1pos-voice-always-on", String(active));
  }, [active]);

  // Handle voice-control events from CommandBar
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ action: string }>).detail;
      if (detail?.action === "mute") {
        setActive(false);
        setVoiceFeedbackEnabled(false);
        stopSpeaking();
      } else if (detail?.action === "unmute") {
        setActive(true);
        setVoiceFeedbackEnabled(true);
      }
    };
    window.addEventListener("voice-control", handler);
    return () => window.removeEventListener("voice-control", handler);
  }, []);

  // Global keyboard shortcut: Cmd+Shift+L to toggle always-on
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "l") {
        e.preventDefault();
        setActive((prev) => {
          const next = !prev;
          speak(next ? "Voice control on" : "Voice control off");
          return next;
        });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Dispatch custom event so Header can show the indicator
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("voice-always-on", { detail: { active } }));
  }, [active]);

  // Execute a parsed intent
  const execute = React.useCallback(
    (parsed: ReturnType<typeof quickParse>) => {
      if (!parsed) return;

      switch (parsed.action) {
        case "navigate":
          speak(`Opening ${parsed.label}`);
          router.push(parsed.params.path as string);
          break;
        case "go_back":
          speak("Going back");
          window.history.back();
          break;
        case "go_forward":
          speak("Going forward");
          window.history.forward();
          break;
        case "refresh":
          speak("Refreshing");
          router.refresh();
          break;
        case "scroll": {
          const dir = parsed.params.direction as string;
          if (dir === "top") window.scrollTo({ top: 0, behavior: "smooth" });
          else if (dir === "bottom") window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          else if (dir === "up") window.scrollBy({ top: -400, behavior: "smooth" });
          else window.scrollBy({ top: 400, behavior: "smooth" });
          break;
        }
        case "voice_mute":
          speak("Muting voice");
          setTimeout(() => {
            setActive(false);
            setVoiceFeedbackEnabled(false);
          }, 800);
          break;
        default:
          speak(parsed.label);
          onAction(parsed.action, parsed.params);
          break;
      }
    },
    [onAction, router]
  );

  // ── Continuous speech recognition loop ──
  React.useEffect(() => {
    if (!active || !isSpeechRecognitionSupported()) {
      // Stop existing recognition
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      return;
    }

    function startListening() {
      if (!activeRef.current) return;

      recognitionRef.current = createSpeechRecognition({
        lang: "en-US",
        interimResults: false,
        continuous: true,
        onResult: (text) => {
          setLastHeard(text);
          const parsed = quickParse(text);
          if (parsed) {
            execute(parsed);
          } else {
            // Unrecognized command — open CommandBar with transcript for AI parsing
            onOpenCommandBar();
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("voice-transcript", { detail: { text } }));
            }, 200);
          }
        },
        onError: (err) => {
          // Ignore no-speech and aborted errors — just restart
          if (err.includes("No speech") || err.includes("aborted") || err === "") return;
          console.warn("[AlwaysOnVoice]", err);
        },
        onStateChange: (state) => {
          if (state === "idle" && activeRef.current) {
            // Auto-restart after a brief pause
            restartTimeoutRef.current = setTimeout(startListening, 300);
          }
        },
      });

      recognitionRef.current?.start();
    }

    startListening();

    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, [active, execute, onOpenCommandBar]);

  if (!active) return null;

  // Minimal always-on indicator (bottom-left)
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-zinc-900/90 px-3 py-1.5 shadow-lg ring-1 ring-white/10 backdrop-blur-sm">
      <div className="relative flex h-3 w-3 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </div>
      <span className="text-[10px] font-medium text-zinc-400">Voice on</span>
      {lastHeard && (
        <span className="max-w-[160px] truncate text-[10px] text-zinc-500">
          &ldquo;{lastHeard}&rdquo;
        </span>
      )}
      <button
        onClick={() => {
          setActive(false);
          speak("Voice control off");
        }}
        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
        title="Turn off (⌘⇧L)"
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export { AlwaysOnVoice };
