"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "1pos-pwa-install-dismissed";

export function PWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if previously dismissed
    if (typeof window !== "undefined") {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!installPrompt || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-black/80 bg-black px-4 py-3 shadow-lg sm:left-auto sm:right-4">
      <p className="text-sm text-black/30">
        Install <span className="font-semibold text-white">1P OS</span> for a
        native app experience
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={handleDismiss}
          className="rounded px-3 py-1.5 text-xs text-black/40 transition-colors hover:text-black/[0.08]"
        >
          Dismiss
        </button>
        <button
          onClick={handleInstall}
          className="rounded bg-black/70 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black/60"
        >
          Install
        </button>
      </div>
    </div>
  );
}
