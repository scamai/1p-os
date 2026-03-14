/**
 * Whisper Web Worker — runs STT entirely in the browser via Transformers.js
 *
 * Supports: whisper-tiny.en, whisper-base.en, whisper-small.en
 * Default: whisper-base.en (best balance of speed + accuracy)
 *
 * Protocol:
 *   Main → Worker: { type: 'load', model? }     — preload model
 *   Main → Worker: { type: 'transcribe', audio } — Float32Array 16kHz mono
 *   Worker → Main: { type: 'status', status, message? }
 *   Worker → Main: { type: 'progress', progress, file? }
 *   Worker → Main: { type: 'result', text }
 *   Worker → Main: { type: 'error', error }
 */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';

// Disable WASM proxy — run directly in this worker thread
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

let whisperPipeline = null;
let loading = false;
let modelLoaded = false;

// Use base.en by default — 2x better accuracy than tiny, still fast
const DEFAULT_MODEL = 'onnx-community/whisper-base.en';

async function loadModel(modelId = DEFAULT_MODEL) {
  if (modelLoaded || loading) return;
  loading = true;

  self.postMessage({
    type: 'status',
    status: 'loading',
    message: `Downloading ${modelId.split('/').pop()} (~50MB, cached after first use)...`,
  });

  try {
    whisperPipeline = await pipeline('automatic-speech-recognition', modelId, {
      dtype: 'q4',
      device: 'wasm',
      progress_callback: (p) => {
        if (p.progress !== undefined) {
          self.postMessage({
            type: 'progress',
            progress: Math.round(p.progress),
            file: p.file,
          });
        }
      },
    });
    modelLoaded = true;
    self.postMessage({
      type: 'status',
      status: 'ready',
      message: 'Whisper ready',
    });
  } catch (err) {
    self.postMessage({
      type: 'error',
      error: 'Failed to load Whisper model: ' + (err.message || err),
    });
  } finally {
    loading = false;
  }
}

async function transcribe(audioData) {
  if (!whisperPipeline) {
    await loadModel();
  }
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
      return_timestamps: false,
    });

    const text = Array.isArray(result)
      ? result.map((r) => r.text).join(' ')
      : result.text;

    self.postMessage({ type: 'result', text: (text || '').trim() });
  } catch (err) {
    self.postMessage({
      type: 'error',
      error: 'Transcription failed: ' + (err.message || err),
    });
  }
}

self.onmessage = (event) => {
  const { type, audio, model } = event.data;
  if (type === 'load') loadModel(model);
  else if (type === 'transcribe') transcribe(audio);
};
