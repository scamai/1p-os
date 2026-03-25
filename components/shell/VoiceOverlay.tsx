"use client";

import * as React from "react";
import {
  createHandyVoice,
  type VoiceState,
  type HandyVoiceOptions,
} from "@/lib/voice/use-handy-voice";

export type { VoiceState };

// ── Hook ──

export function useHandyVoice(opts: HandyVoiceOptions = {}) {
  const [state, setState] = React.useState<VoiceState>("idle");
  const [levels, setLevels] = React.useState<number[]>(
    new Array(opts.bars ?? 9).fill(0)
  );
  const [transcript, setTranscript] = React.useState("");
  const [progress, setProgress] = React.useState(0);
  const voiceRef = React.useRef<ReturnType<typeof createHandyVoice> | null>(
    null
  );

  const optsRef = React.useRef(opts);
  // eslint-disable-next-line react-hooks/refs -- intentional ref sync during render for useCallback access
  optsRef.current = opts;

  // Web Speech API needs no preloading — ready instantly

  const start = React.useCallback(async () => {
    voiceRef.current = createHandyVoice(
      setState,
      setLevels,
      (t) => {
        setTranscript(t);
        optsRef.current.onTranscript?.(t);
      },
      {
        ...optsRef.current,
        onModelProgress: (p) => {
          setProgress(p);
          optsRef.current.onModelProgress?.(p);
        },
      }
    );
    await voiceRef.current.start();
  }, []);

  const stop = React.useCallback(() => {
    voiceRef.current?.stop();
  }, []);

  const cancel = React.useCallback(() => {
    voiceRef.current?.cancel();
  }, []);

  return { state, levels, transcript, progress, start, stop, cancel };
}

// ── Global keyboard shortcut hook ──

export function useVoiceShortcut(
  onTranscript: (text: string) => void,
  enabled = true
) {
  const voice = useHandyVoice({
    onTranscript,
    onError: () => { /* silent */ },
  });

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+V or Ctrl+Shift+V to toggle
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "v") {
        e.preventDefault();
        if (voice.state === "idle" || voice.state === "error") {
          voice.start();
        } else if (voice.state === "recording") {
          voice.stop();
        }
      }
      // Escape to cancel
      if (e.key === "Escape" && voice.state === "recording") {
        voice.cancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, voice]);

  return voice;
}

// ── Overlay Component ──

interface VoiceOverlayProps {
  state: VoiceState;
  levels: number[];
  progress?: number;
  onStop?: () => void;
  onCancel: () => void;
}

export function VoiceOverlay({
  state,
  levels,
  progress = 0,
  onStop,
  onCancel,
}: VoiceOverlayProps) {
  if (state === "idle" || state === "error") return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex h-10 items-center gap-2 rounded-full bg-black/95 px-4 shadow-xl ring-1 ring-white/10">
        {/* Mic dot / spinner */}
        <div className="flex h-5 w-5 items-center justify-center">
          {state === "recording" ? (
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-black/40 shadow-[0_0_8px_rgba(161,161,170,0.6)]" />
          ) : state === "loading" ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-black/60 border-t-black/30" />
          ) : (
            <div className="h-2 w-2 animate-pulse rounded-full bg-black/50" />
          )}
        </div>

        {/* Audio bars or status */}
        <div className="flex h-7 items-end gap-[3px] min-w-[60px]">
          {state === "recording" ? (
            levels.map((v, i) => (
              <div
                key={i}
                className="w-[4px] rounded-sm bg-black/30"
                style={{
                  height: `${Math.max(3, Math.min(22, 3 + Math.pow(v, 0.6) * 19))}px`,
                  opacity: Math.max(0.3, Math.min(1, v * 2)),
                  transition: "height 50ms ease-out, opacity 80ms ease-out",
                }}
              />
            ))
          ) : (
            <span className="flex items-center gap-1.5 px-0.5 text-[11px] text-black/40">
              {state === "loading" ? (
                <>
                  Loading{progress > 0 && progress < 100 ? ` ${progress}%` : "..."}
                </>
              ) : (
                "Processing..."
              )}
            </span>
          )}
        </div>

        {/* Stop / Cancel buttons */}
        <div className="flex items-center gap-1 ml-1">
          {state === "recording" && onStop && (
            <button
              onClick={onStop}
              className="flex h-6 items-center gap-1 rounded-full bg-black/70/80 px-2.5 text-[10px] font-medium text-black/30 transition-colors hover:bg-black/60 hover:text-white"
            >
              Done
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex h-5 w-5 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/70 hover:text-black/30"
            title="Cancel (Esc)"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Shortcut hint */}
        {state === "recording" && (
          <span className="text-[10px] text-black/60 ml-1 hidden sm:inline">
            ⌘⇧V
          </span>
        )}
      </div>
    </div>
  );
}

// ── Mic Button (drop into any input) ──

interface MicButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function MicButton({
  onTranscript,
  className = "",
}: MicButtonProps) {
  const [micError, setMicError] = React.useState<string | null>(null);
  const voice = useHandyVoice({
    onTranscript: (text) => {
      setMicError(null);
      onTranscript(text);
    },
    onError: (err) => {
      setMicError(err);
    },
  });

  const isActive = voice.state !== "idle" && voice.state !== "error";
  const isError = voice.state === "error";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMicError(null);
          if (isActive) voice.stop();
          else voice.start();
        }}
        className={`flex shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-black text-white"
            : isError
              ? "text-black"
              : "text-black/40 hover:text-black/60"
        } ${className}`}
        aria-label={isActive ? "Stop listening" : isError ? "Mic not working — tap to retry" : "Voice input (⌘⇧V)"}
        title={isError && micError ? micError : isActive ? "Stop listening" : "Voice input (⌘⇧V)"}
      >
        {isError ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </button>

      <VoiceOverlay
        state={voice.state}
        levels={voice.levels}
        progress={voice.progress}
        onStop={voice.stop}
        onCancel={voice.cancel}
      />
    </>
  );
}
