/**
 * Local Whisper Client
 * ====================
 * Manages the Whisper Web Worker and provides a simple async API.
 * The worker is created lazily and only in the browser — it is never
 * imported server-side, so onnxruntime-node is never bundled.
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

function getWorker(): Worker {
  if (typeof window === 'undefined') {
    throw new Error('Whisper worker can only be used in the browser');
  }

  if (!worker) {
    // Create worker inline — avoids top-level import of @huggingface/transformers
    // which would pull onnxruntime-node into the server bundle.
    const workerCode = `
      import { pipeline, env } from '@huggingface/transformers';

      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.proxy = false;
      }

      let whisperPipeline = null;
      let loading = false;
      const DEFAULT_MODEL = 'onnx-community/whisper-tiny.en';

      async function loadModel(modelId = DEFAULT_MODEL) {
        if (whisperPipeline || loading) return;
        loading = true;
        self.postMessage({ type: 'status', status: 'loading', message: 'Loading Whisper model...' });
        try {
          whisperPipeline = await pipeline('automatic-speech-recognition', modelId, {
            dtype: 'q4',
            device: 'wasm',
            progress_callback: (p) => {
              if (p.progress !== undefined) {
                self.postMessage({ type: 'progress', progress: p.progress, file: p.file });
              }
            },
          });
          self.postMessage({ type: 'status', status: 'ready', message: 'Whisper model ready' });
        } catch (err) {
          self.postMessage({ type: 'error', error: 'Failed to load model: ' + (err.message || err) });
        } finally {
          loading = false;
        }
      }

      async function transcribe(audioData) {
        if (!whisperPipeline) await loadModel();
        if (!whisperPipeline) {
          self.postMessage({ type: 'error', error: 'Model not loaded' });
          return;
        }
        self.postMessage({ type: 'status', status: 'transcribing' });
        try {
          const result = await whisperPipeline(audioData, {
            language: 'en',
            task: 'transcribe',
            chunk_length_s: 30,
            stride_length_s: 5,
          });
          const text = Array.isArray(result) ? result.map(r => r.text).join(' ') : result.text;
          self.postMessage({ type: 'result', text: text.trim() });
        } catch (err) {
          self.postMessage({ type: 'error', error: 'Transcription failed: ' + (err.message || err) });
        }
      }

      self.onmessage = (event) => {
        const { type, audio, model } = event.data;
        if (type === 'load') loadModel(model);
        else if (type === 'transcribe') transcribe(audio);
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    worker = new Worker(URL.createObjectURL(blob), { type: 'module' });

    worker.onmessage = (event) => {
      const { type, status, message, progress, file, text, error } = event.data;

      switch (type) {
        case 'status':
          currentStatus = status;
          statusCallbacks.onStatus?.(status, message);
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
  }
  return worker;
}

/**
 * Pre-load the Whisper model (downloads ~40MB on first use, cached after).
 */
export function preloadWhisper(callbacks?: WhisperCallbacks): void {
  if (typeof window === 'undefined') return;
  if (callbacks) statusCallbacks = callbacks;
  getWorker().postMessage({ type: 'load' });
}

/**
 * Get current Whisper status.
 */
export function getWhisperStatus(): WhisperStatus {
  return currentStatus;
}

/**
 * Transcribe audio samples. Handles resampling to 16kHz mono.
 */
export async function transcribeLocal(
  audioBlob: Blob,
  callbacks?: WhisperCallbacks
): Promise<string> {
  if (callbacks) statusCallbacks = callbacks;

  // Decode audio to raw samples at 16kHz
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  const arrayBuf = await audioBlob.arrayBuffer();
  const decoded = await audioCtx.decodeAudioData(arrayBuf);

  // Get mono channel
  let samples = decoded.getChannelData(0);

  // If not 16kHz, resample
  if (decoded.sampleRate !== 16000) {
    samples = resample(samples, decoded.sampleRate, 16000) as Float32Array<ArrayBuffer>;
  }

  // Send to worker
  return new Promise((resolve, reject) => {
    resolveTranscribe = resolve;
    rejectTranscribe = reject;
    getWorker().postMessage(
      { type: 'transcribe', audio: samples },
      [samples.buffer]
    );
  });
}

/**
 * Simple linear resampling.
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
