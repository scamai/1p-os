"use client";

import * as React from "react";
import { HealthScore } from "@/components/company/HealthScore";
import { CostIndicator } from "@/components/company/CostIndicator";
import { speak } from "@/lib/voice/voice-feedback";

interface HeaderProps {
  businessName?: string;
  healthScore?: number;
  costToday?: number;
  budgetDaily?: number;
  onKillSwitch?: () => void;
  onOpenCommandBar?: () => void;
  onVoiceTranscript?: (text: string) => void;
}

function Header({
  businessName,
  healthScore = 100,
  costToday = 0,
  budgetDaily = 5,
  onKillSwitch,
  onOpenCommandBar,
  onVoiceTranscript,
}: HeaderProps) {
  const [voiceAlwaysOn, setVoiceAlwaysOn] = React.useState(false);

  // Listen for always-on voice state changes
  React.useEffect(() => {
    const saved = localStorage.getItem("1pos-voice-always-on");
    if (saved === "true") setVoiceAlwaysOn(true);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ active: boolean }>).detail;
      setVoiceAlwaysOn(detail?.active ?? false);
    };
    window.addEventListener("voice-always-on", handler);
    return () => window.removeEventListener("voice-always-on", handler);
  }, []);

  const toggleAlwaysOn = () => {
    const next = !voiceAlwaysOn;
    setVoiceAlwaysOn(next);
    localStorage.setItem("1pos-voice-always-on", String(next));
    speak(next ? "Voice control on" : "Voice control off");
    window.dispatchEvent(new CustomEvent("voice-control", { detail: { action: next ? "unmute" : "mute" } }));
  };

  return (
    <header className="flex h-12 items-center justify-between px-6">
      {/* Left: logo + business name */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-zinc-500">1P</span>
        {businessName && (
          <>
            <span className="text-zinc-600">/</span>
            <span className="text-[13px] text-zinc-500">{businessName}</span>
          </>
        )}
      </div>

      {/* Right: voice, command bar, cost, health, kill switch */}
      <div className="flex items-center gap-4">
        {/* Always-on voice toggle */}
        <button
          onClick={toggleAlwaysOn}
          className={`group relative flex h-8 items-center gap-1.5 rounded-full px-2.5 transition-all duration-200 ${
            voiceAlwaysOn
              ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
              : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          }`}
          aria-label={voiceAlwaysOn ? "Disable always-on voice (⌘⇧L)" : "Enable always-on voice (⌘⇧L)"}
          title={voiceAlwaysOn ? "Voice control on — click to disable (⌘⇧L)" : "Enable always-on voice control (⌘⇧L)"}
        >
          {voiceAlwaysOn && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
          {!voiceAlwaysOn && (
            <span className="text-[10px] font-medium hidden sm:inline">Voice</span>
          )}
        </button>

        <button
          onClick={onOpenCommandBar}
          className="hidden items-center rounded-md border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 transition-colors duration-200 hover:text-zinc-500 sm:flex"
        >
          <kbd className="font-mono text-[10px]">&#8984;K</kbd>
        </button>

        <CostIndicator spent={costToday} budget={budgetDaily} />

        <HealthScore score={healthScore} />

        <button
          onClick={onKillSwitch}
          className="relative flex h-3 w-3 items-center justify-center"
          aria-label="Kill switch"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-900 opacity-10" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-zinc-900" />
        </button>
      </div>
    </header>
  );
}

export { Header };
export type { HeaderProps };
