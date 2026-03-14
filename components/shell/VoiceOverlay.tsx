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
  const voiceRef = React.useRef<ReturnType<typeof createHandyVoice> | null>(
    null
  );

  // Recreate voice engine when opts change
  const optsRef = React.useRef(opts);
  optsRef.current = opts;

  const getVoice = React.useCallback(() => {
    if (!voiceRef.current) {
      voiceRef.current = createHandyVoice(
        setState,
        setLevels,
        (t) => {
          setTranscript(t);
          optsRef.current.onTranscript?.(t);
        },
        optsRef.current
      );
    }
    return voiceRef.current;
  }, []);

  const start = React.useCallback(async () => {
    // Recreate each time to pick up latest opts
    voiceRef.current = createHandyVoice(
      setState,
      setLevels,
      (t) => {
        setTranscript(t);
        optsRef.current.onTranscript?.(t);
      },
      optsRef.current
    );
    await voiceRef.current.start();
  }, []);

  const stop = React.useCallback(() => {
    getVoice().stop();
  }, [getVoice]);

  const cancel = React.useCallback(() => {
    getVoice().cancel();
  }, [getVoice]);

  return { state, levels, transcript, start, stop, cancel };
}

// ── Overlay Component (Handy-style floating pill) ──

interface VoiceOverlayProps {
  state: VoiceState;
  levels: number[];
  onCancel: () => void;
}

export function VoiceOverlay({ state, levels, onCancel }: VoiceOverlayProps) {
  if (state === "idle" || state === "error") return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex h-9 items-center gap-1.5 rounded-full bg-zinc-900/90 px-3 shadow-lg backdrop-blur-sm">
        {/* Mic icon */}
        <div className="flex h-5 w-5 items-center justify-center">
          {state === "recording" ? (
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              className="animate-pulse text-zinc-400"
            >
              <path
                d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M19 10v2a7 7 0 0 1-14 0v-2"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          )}
        </div>

        {/* Audio bars or status text */}
        <div className="flex h-6 items-end gap-[3px]">
          {state === "recording" ? (
            levels.map((v, i) => (
              <div
                key={i}
                className="w-[5px] rounded-sm bg-zinc-300"
                style={{
                  height: `${Math.max(3, Math.min(20, 3 + Math.pow(v, 0.7) * 17))}px`,
                  opacity: Math.max(0.25, v * 1.7),
                  transition: "height 60ms ease-out, opacity 120ms ease-out",
                }}
              />
            ))
          ) : (
            <span className="px-1 text-[11px] text-zinc-400">
              {state === "loading"
                ? "Loading model..."
                : state === "transcribing"
                  ? "Transcribing..."
                  : "Error"}
            </span>
          )}
        </div>

        {/* Cancel button */}
        {state === "recording" && (
          <button
            onClick={onCancel}
            className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
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
        )}
      </div>
    </div>
  );
}

// ── Mic Button (reusable, drop into any input) ──

interface MicButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function MicButton({
  onTranscript,
  className = "",
}: MicButtonProps) {
  const voice = useHandyVoice({
    onTranscript,
    onError: (err) => console.warn("[MicButton]", err),
  });

  const isActive = voice.state !== "idle" && voice.state !== "error";

  return (
    <>
      <button
        type="button"
        onClick={isActive ? voice.stop : () => voice.start()}
        className={`flex shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-zinc-900 text-white"
            : "text-zinc-400 hover:text-zinc-600"
        } ${className}`}
        aria-label={isActive ? "Stop listening" : "Voice input"}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </button>

      <VoiceOverlay
        state={voice.state}
        levels={voice.levels}
        onCancel={voice.cancel}
      />
    </>
  );
}
