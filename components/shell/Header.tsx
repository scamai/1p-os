"use client";

import * as React from "react";
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
      <div />

    </header>
  );
}

export { Header };
export type { HeaderProps };
