/**
 * Local Whisper Client
 * ====================
 * Manages the Whisper Web Worker (/public/whisper-worker.js) and provides
 * a simple async API. Uses whisper-base.en by default for Whisperflow-level
 * accuracy, running entirely in the browser via Transformers.js WASM.
 *
 * Model downloads once (~50MB), cached in IndexedDB, works offline after.
 */

export type WhisperStatus = 'idle' | 'loading' | 'ready' | 'transcribing' | 'error';

export interface WhisperCallbacks {
  onStatus?: (status: WhisperStatus, message?: string) => void;
  onProgress?: (progress: number, file?: string) => void;
}

let worker: Worker | null = null;
let currentStatus: WhisperStatus = 'idle';
let resolveTranscribe: ((text: string) => void) | null = null;
let rejectTranscribe: ((err: Error) => void) | null = null;
let statusCallbacks: WhisperCallbacks = {};
let modelReady = false;
let modelReadyResolve: (() => void) | null = null;

function getWorker(): Worker {
  if (typeof window === 'undefined') {
    throw new Error('Whisper worker can only be used in the browser');
  }

  if (!worker) {
    // Use the worker file from public/ — proper module worker, no blob URL issues
    worker = new Worker('/whisper-worker.js', { type: 'module' });

    worker.onmessage = (event) => {
      const { type, status, message, progress, file, text, error } = event.data;

      switch (type) {
        case 'status':
          currentStatus = status;
          statusCallbacks.onStatus?.(status, message);
          if (status === 'ready') {
            modelReady = true;
            modelReadyResolve?.();
            modelReadyResolve = null;
          }
          break;
        case 'progress':
          statusCallbacks.onProgress?.(progress, file);
          break;
        case 'result':
          resolveTranscribe?.(text ?? '');
          resolveTranscribe = null;
          rejectTranscribe = null;
          currentStatus = 'ready';
          statusCallbacks.onStatus?.('ready');
          break;
        case 'error':
          console.error('[Whisper]', error);
          if (rejectTranscribe) {
            rejectTranscribe(new Error(error));
            resolveTranscribe = null;
            rejectTranscribe = null;
          }
          currentStatus = 'error';
          statusCallbacks.onStatus?.('error', error);
          break;
      }
    };

    worker.onerror = (e) => {
      console.error('[Whisper Worker Error]', e);
      currentStatus = 'error';
      statusCallbacks.onStatus?.('error', e.message);
      if (rejectTranscribe) {
        rejectTranscribe(new Error(e.message));
        resolveTranscribe = null;
        rejectTranscribe = null;
      }
    };
  }
  return worker;
}

/**
 * Pre-load the Whisper model so first transcription is instant.
 * Call on app mount — the ~50MB model is cached in IndexedDB after first download.
 */
export function preloadWhisper(callbacks?: WhisperCallbacks): void {
  if (typeof window === 'undefined') return;
  if (modelReady) return;
  if (callbacks) statusCallbacks = callbacks;
  getWorker().postMessage({ type: 'load' });
}

/**
 * Wait until the model is ready.
 */
export function waitForModel(): Promise<void> {
  if (modelReady) return Promise.resolve();
  return new Promise((resolve) => {
    modelReadyResolve = resolve;
    // Trigger load if not already started
    preloadWhisper();
  });
}

/**
 * Get current Whisper status.
 */
export function getWhisperStatus(): WhisperStatus {
  return currentStatus;
}

/**
 * Is the model downloaded and ready?
 */
export function isModelReady(): boolean {
  return modelReady;
}

/**
 * Transcribe audio blob. Handles decoding and resampling to 16kHz mono.
 */
export async function transcribeLocal(
  audioBlob: Blob,
  callbacks?: WhisperCallbacks
): Promise<string> {
  if (callbacks) statusCallbacks = callbacks;

  // Decode audio to raw samples at 16kHz
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  const arrayBuf = await audioBlob.arrayBuffer();

  let decoded: AudioBuffer;
  try {
    decoded = await audioCtx.decodeAudioData(arrayBuf);
  } catch {
    // Some browsers can't decode webm — try with default sample rate and resample
    const fallbackCtx = new AudioContext();
    decoded = await fallbackCtx.decodeAudioData(arrayBuf.slice(0));
    await fallbackCtx.close();
  }

  // Get mono channel
  let samples = decoded.getChannelData(0);

  // Resample to 16kHz if needed
  if (decoded.sampleRate !== 16000) {
    samples = resample(samples, decoded.sampleRate, 16000) as Float32Array<ArrayBuffer>;
  }

  // Close the temp context
  await audioCtx.close();

  // Send to worker
  return new Promise((resolve, reject) => {
    resolveTranscribe = resolve;
    rejectTranscribe = reject;

    // Transfer the buffer for zero-copy
    const float32 = new Float32Array(samples);
    getWorker().postMessage(
      { type: 'transcribe', audio: float32 },
      [float32.buffer]
    );
  });
}

/**
 * Linear resampling — good enough for speech.
 */
function resample(
  samples: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  const ratio = fromRate / toRate;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIdx = i * ratio;
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, samples.length - 1);
    const frac = srcIdx - lo;
    result[i] = samples[lo] * (1 - frac) + samples[hi] * frac;
  }

  return result;
}
