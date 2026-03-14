/**
 * useHandyVoice — Push-to-talk voice input
 * ==========================================
 * Uses the native Web Speech API (Chrome, Safari, Edge) for instant,
 * free, zero-latency speech recognition. No model downloads, no API keys.
 *
 * Features:
 * - Real-time interim transcripts (shows text as you speak)
 * - Auto-stops when you pause speaking
 * - Works on localhost and HTTPS
 * - English by default
 */

import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  type SpeechState,
} from '@/lib/voice/speech-recognition';

export type VoiceState = 'idle' | 'recording' | 'transcribing' | 'loading' | 'error';

export interface HandyVoiceOptions {
  /** Number of visualiser bars (default 9) */
  bars?: number;
  /** VAD energy threshold (unused with Web Speech API, kept for compat) */
  vadThreshold?: number;
  /** Silence timeout (unused with Web Speech API — it handles this natively) */
  silenceTimeout?: number;
  /** Max duration (unused with Web Speech API) */
  maxDuration?: number;
  /** Called with final transcript text */
  onTranscript?: (text: string) => void;
  /** Called with interim (partial) transcript as user speaks */
  onInterim?: (text: string) => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Called with model download progress (unused with Web Speech API) */
  onModelProgress?: (progress: number) => void;
}

export interface HandyVoiceReturn {
  state: VoiceState;
  levels: number[];
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
  transcript: string;
}

// Audio context for level visualisation
let sharedAudioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContext();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

export function createHandyVoice(
  setState: (s: VoiceState) => void,
  setLevels: (l: number[]) => void,
  setTranscript: (t: string) => void,
  opts: HandyVoiceOptions = {}
) {
  const NUM_BARS = opts.bars ?? 9;

  let recognition: ReturnType<typeof createSpeechRecognition> = null;
  let mediaStream: MediaStream | null = null;
  let analyser: AnalyserNode | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let animFrame: number | null = null;

  // ── Audio level visualiser (runs alongside recognition for the waveform) ──
  function startLevelLoop() {
    if (!analyser) return;
    analyser.fftSize = 256;
    const bufLen = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufLen);

    const ctx = getAudioContext();
    const nyquist = ctx.sampleRate / 2;
    const minBin = Math.floor((300 / nyquist) * bufLen);
    const maxBin = Math.min(Math.ceil((4000 / nyquist) * bufLen), bufLen);
    const binsPerBar = Math.max(1, Math.floor((maxBin - minBin) / NUM_BARS));

    const smoothed = new Array(NUM_BARS).fill(0);

    const tick = () => {
      analyser!.getByteFrequencyData(dataArray);
      const newLevels: number[] = [];

      for (let i = 0; i < NUM_BARS; i++) {
        const start = minBin + i * binsPerBar;
        const end = Math.min(start + binsPerBar, maxBin);
        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += dataArray[j] / 255;
        }
        const avg = sum / (end - start);
        smoothed[i] = smoothed[i] * 0.65 + avg * 0.35;
        newLevels.push(smoothed[i]);
      }

      setLevels(newLevels);
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
  }

  function stopLevelLoop() {
    if (animFrame !== null) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
    setLevels(new Array(NUM_BARS).fill(0));
  }

  function cleanupAudio() {
    if (sourceNode) { sourceNode.disconnect(); sourceNode = null; }
    analyser = null;
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
  }

  // ── Start ──
  async function start() {
    if (!isSpeechRecognitionSupported()) {
      setState('error');
      opts.onError?.('Speech recognition not supported. Use Chrome, Safari, or Edge.');
      setTimeout(() => setState('idle'), 3000);
      return;
    }

    setTranscript('');
    setState('recording');

    // Get mic for visualisation (waveform bars)
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const audioCtx = getAudioContext();
      sourceNode = audioCtx.createMediaStreamSource(mediaStream);
      analyser = audioCtx.createAnalyser();
      sourceNode.connect(analyser);
      startLevelLoop();
    } catch {
      // Visualisation not critical — continue without it
    }

    // Start speech recognition
    recognition = createSpeechRecognition({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
      onResult: (text) => {
        setTranscript(text);
        opts.onTranscript?.(text);
        // Auto-cleanup after final result
        stopLevelLoop();
        cleanupAudio();
        setState('idle');
      },
      onInterim: (text) => {
        setTranscript(text);
        opts.onInterim?.(text);
      },
      onError: (err) => {
        opts.onError?.(err);
        stopLevelLoop();
        cleanupAudio();
        setState('error');
        setTimeout(() => setState('idle'), 2000);
      },
      onStateChange: (s) => {
        if (s === 'idle') {
          stopLevelLoop();
          cleanupAudio();
          // Only set idle if we haven't already set it from onResult
        }
      },
    });

    recognition?.start();
  }

  // ── Stop ──
  function stop() {
    recognition?.stop();
    stopLevelLoop();
    cleanupAudio();
  }

  // ── Cancel ──
  function cancel() {
    recognition?.abort();
    stopLevelLoop();
    cleanupAudio();
    setState('idle');
    setTranscript('');
  }

  return { start, stop, cancel };
}

// No-op preload (Web Speech API doesn't need it)
export function preloadWhisper() {}
