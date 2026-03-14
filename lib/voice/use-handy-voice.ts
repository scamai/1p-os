/**
 * useHandyVoice — Browser-native push-to-talk inspired by Handy
 * =============================================================
 * Captures mic audio via MediaRecorder, computes live audio levels for
 * visualisation, applies energy-based VAD to strip silence, and runs
 * Whisper STT **locally in the browser** via Transformers.js (Web Worker).
 *
 * No third-party API calls. Model downloads once (~40MB), cached in
 * IndexedDB, works fully offline after that.
 *
 * Architecture mirrors Handy's Rust pipeline:
 *   cpal recorder  → MediaRecorder + AnalyserNode (audio levels)
 *   Silero VAD     → energy-based VAD (strip silence)
 *   whisper.cpp    → Transformers.js Whisper (WASM, in Web Worker)
 */

import { transcribeLocal, preloadWhisper, type WhisperStatus } from '@/lib/voice/whisper-local';

export type VoiceState = 'idle' | 'recording' | 'transcribing' | 'loading' | 'error';

export interface HandyVoiceOptions {
  /** Number of visualiser bars (default 9, matching Handy overlay) */
  bars?: number;
  /** VAD energy threshold 0-1 — frames below this are silence (default 0.01) */
  vadThreshold?: number;
  /** Called with final transcript text */
  onTranscript?: (text: string) => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Called with model download progress 0-100 */
  onModelProgress?: (progress: number) => void;
}

export interface HandyVoiceReturn {
  state: VoiceState;
  /** Audio level bars 0-1, length = opts.bars */
  levels: number[];
  /** Start recording */
  start: () => Promise<void>;
  /** Stop recording and trigger transcription */
  stop: () => void;
  /** Cancel without transcribing */
  cancel: () => void;
  /** Current transcript */
  transcript: string;
}

// Singleton audio context — reused across calls
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
  const VAD_THRESHOLD = opts.vadThreshold ?? 0.01;

  let mediaStream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let analyser: AnalyserNode | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let animFrame: number | null = null;
  let chunks: Blob[] = [];
  let cancelled = false;

  // ── Audio level visualiser (mirrors Handy's AudioVisualiser) ──
  function startLevelLoop() {
    if (!analyser) return;
    const fftSize = 256;
    analyser.fftSize = fftSize;
    const bufLen = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufLen);

    // Map FFT bins to vocal range (400-4000 Hz, same as Handy)
    const ctx = getAudioContext();
    const nyquist = ctx.sampleRate / 2;
    const minBin = Math.floor((400 / nyquist) * bufLen);
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
        // Smooth like Handy: prev * 0.7 + target * 0.3
        smoothed[i] = smoothed[i] * 0.7 + avg * 0.3;
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

  // ── Start recording ──
  async function start() {
    cancelled = false;
    chunks = [];
    setTranscript('');
    setState('recording');

    // Check if getUserMedia is available (requires secure context)
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('error');
      opts.onError?.('Microphone not available. Make sure you are on HTTPS or localhost.');
      setTimeout(() => setState('idle'), 3000);
      return;
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch (err) {
      setState('error');
      const msg = err instanceof DOMException
        ? err.name === 'NotAllowedError'
          ? 'Microphone access denied. Click the lock icon in your browser address bar to allow mic access, then try again.'
          : err.name === 'NotFoundError'
            ? 'No microphone found. Please connect a mic and try again.'
            : `Mic error: ${err.message}`
        : 'Microphone access denied.';
      opts.onError?.(msg);
      setTimeout(() => setState('idle'), 3000);
      return;
    }

    // Set up audio graph for visualisation
    const audioCtx = getAudioContext();
    sourceNode = audioCtx.createMediaStreamSource(mediaStream);
    analyser = audioCtx.createAnalyser();
    sourceNode.connect(analyser);
    startLevelLoop();

    // Record as webm/opus
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      if (!cancelled && chunks.length > 0) {
        transcribeAudio();
      }
    };
    mediaRecorder.start(100); // 100ms timeslice
  }

  // ── Stop recording ──
  function stop() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    stopLevelLoop();
    cleanup();
  }

  // ── Cancel ──
  function cancel() {
    cancelled = true;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    stopLevelLoop();
    cleanup();
    setState('idle');
    setTranscript('');
  }

  // ── Transcribe locally via Whisper in Web Worker ──
  async function transcribeAudio() {
    const blob = new Blob(chunks, { type: chunks[0]?.type ?? 'audio/webm' });

    // Energy-based VAD: skip if audio is mostly silent
    try {
      const arrayBuf = await blob.arrayBuffer();
      const audioCtx = getAudioContext();
      const decoded = await audioCtx.decodeAudioData(arrayBuf.slice(0));
      const samples = decoded.getChannelData(0);
      const energy = samples.reduce((sum, s) => sum + s * s, 0) / samples.length;

      if (energy < VAD_THRESHOLD * VAD_THRESHOLD) {
        setState('idle');
        opts.onError?.('No speech detected.');
        return;
      }
    } catch {
      // Can't decode — still try to transcribe
    }

    setState('transcribing');

    try {
      const text = await transcribeLocal(blob, {
        onStatus: (status: WhisperStatus, message?: string) => {
          if (status === 'loading') {
            setState('loading');
          }
          if (status === 'error' && message) {
            opts.onError?.(message);
          }
        },
        onProgress: (progress: number) => {
          opts.onModelProgress?.(progress);
        },
      });

      if (text.trim()) {
        setTranscript(text.trim());
        opts.onTranscript?.(text.trim());
      } else {
        opts.onError?.('No speech detected.');
      }

      setState('idle');
    } catch (err) {
      setState('error');
      opts.onError?.(err instanceof Error ? err.message : 'Transcription failed.');
      setTimeout(() => setState('idle'), 2000);
    }
  }

  // ── Cleanup media resources ──
  function cleanup() {
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }
    analyser = null;
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
    mediaRecorder = null;
  }

  return { start, stop, cancel };
}

/**
 * Pre-load the Whisper model so first transcription is instant.
 * Call this on app mount or when user enters a voice-enabled page.
 */
export { preloadWhisper };
