/**
 * Browser Speech Recognition (Web Speech API)
 * =============================================
 * Uses the native SpeechRecognition API built into Chrome, Safari, and Edge.
 * - Zero latency startup (no model download)
 * - Free, no API keys
 * - English only (matches project requirement)
 * - Works on localhost and HTTPS
 *
 * Falls back gracefully if not available (Firefox without flags).
 */

export type SpeechState = 'idle' | 'listening' | 'error';

export interface SpeechRecognitionOptions {
  /** Language (default 'en-US') */
  lang?: string;
  /** Show interim results while speaking (default true) */
  interimResults?: boolean;
  /** Auto-restart on silence (default false — we want single utterance) */
  continuous?: boolean;
  /** Called with final transcript */
  onResult?: (text: string) => void;
  /** Called with interim (partial) transcript */
  onInterim?: (text: string) => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Called when state changes */
  onStateChange?: (state: SpeechState) => void;
}

// Web Speech API types (not always in TS lib)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// Check browser support
function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  return SR ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognition() !== null;
}

export function createSpeechRecognition(opts: SpeechRecognitionOptions = {}) {
  const SR = getSpeechRecognition();
  if (!SR) {
    opts.onError?.('Speech recognition not supported in this browser.');
    return null;
  }

  const recognition = new SR();
  recognition.lang = opts.lang ?? 'en-US';
  recognition.interimResults = opts.interimResults ?? true;
  recognition.continuous = opts.continuous ?? false;
  recognition.maxAlternatives = 1;

  let isRunning = false;

  recognition.onstart = () => {
    isRunning = true;
    opts.onStateChange?.('listening');
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let finalText = '';
    let interimText = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalText += result[0].transcript;
      } else {
        interimText += result[0].transcript;
      }
    }

    if (interimText) {
      opts.onInterim?.(interimText);
    }

    if (finalText) {
      opts.onResult?.(finalText.trim());
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    isRunning = false;
    const errorMap: Record<string, string> = {
      'not-allowed': 'Microphone access denied. Allow mic in browser settings.',
      'no-speech': 'No speech detected. Try again.',
      'audio-capture': 'No microphone found.',
      'network': 'Network error during recognition.',
      'aborted': '', // User cancelled — don't show error
    };
    const msg = errorMap[event.error] ?? `Speech error: ${event.error}`;
    if (msg) {
      opts.onError?.(msg);
    }
    opts.onStateChange?.(event.error === 'aborted' ? 'idle' : 'error');
  };

  recognition.onend = () => {
    isRunning = false;
    opts.onStateChange?.('idle');
  };

  return {
    start: () => {
      if (!isRunning) {
        try {
          recognition.start();
        } catch {
          // Already started
        }
      }
    },
    stop: () => {
      if (isRunning) {
        recognition.stop();
      }
    },
    abort: () => {
      recognition.abort();
      isRunning = false;
    },
    get isRunning() {
      return isRunning;
    },
  };
}
