// =============================================================================
// 1P OS — Voice Engine
// TTS and STT capabilities for agents with provider fallback
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface VoiceProvider {
  id: string;
  name: string;
  capabilities: VoiceCapability[];
  transcribe?: (audio: ArrayBuffer, opts?: TranscribeOptions) => Promise<string>;
  synthesize?: (text: string, opts?: SynthesizeOptions) => Promise<ArrayBuffer>;
}

export type VoiceCapability = 'stt' | 'tts' | 'streaming';

export interface TranscribeOptions {
  lang?: string;
}

export interface SynthesizeOptions {
  voice?: string;
  speed?: number;
}

export interface PartialTranscript {
  text: string;
  isFinal: boolean;
}

export interface VoiceEngineConfig {
  primaryProviderId?: string;
  fallbackProviderId?: string;
}

// -----------------------------------------------------------------------------
// Built-in Providers (stubs)
// -----------------------------------------------------------------------------

const browserProvider: VoiceProvider = {
  id: 'browser',
  name: 'Browser Web Speech API',
  capabilities: ['stt', 'tts'],

  async transcribe(audio: ArrayBuffer, opts?: TranscribeOptions): Promise<string> {
    // Stub: In production, this would use the Web Speech API
    // via a client-side bridge (postMessage or WebSocket)
    void audio;
    void opts;
    throw new Error(
      '[voice/engine] Browser STT requires client-side execution. ' +
      'Use the client bridge to forward audio to Web Speech API.'
    );
  },

  async synthesize(text: string, opts?: SynthesizeOptions): Promise<ArrayBuffer> {
    // Stub: In production, this would use SpeechSynthesis API
    // via a client-side bridge
    void text;
    void opts;
    throw new Error(
      '[voice/engine] Browser TTS requires client-side execution. ' +
      'Use the client bridge to forward text to SpeechSynthesis API.'
    );
  },
};

const openaiProvider: VoiceProvider = {
  id: 'openai',
  name: 'OpenAI Whisper + TTS',
  capabilities: ['stt', 'tts', 'streaming'],

  async transcribe(audio: ArrayBuffer, opts?: TranscribeOptions): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('[voice/engine] OPENAI_API_KEY not configured');
    }

    const formData = new FormData();
    formData.append('file', new Blob([audio], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', 'whisper-1');
    if (opts?.lang) {
      formData.append('language', opts.lang);
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`[voice/engine] OpenAI transcription failed: ${response.status} ${errorBody}`);
    }

    const result = await response.json() as { text: string };
    return result.text;
  },

  async synthesize(text: string, opts?: SynthesizeOptions): Promise<ArrayBuffer> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('[voice/engine] OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: opts?.voice ?? 'alloy',
        speed: opts?.speed ?? 1.0,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`[voice/engine] OpenAI TTS failed: ${response.status} ${errorBody}`);
    }

    return response.arrayBuffer();
  },
};

const elevenlabsProvider: VoiceProvider = {
  id: 'elevenlabs',
  name: 'ElevenLabs',
  capabilities: ['tts', 'streaming'],

  async synthesize(text: string, opts?: SynthesizeOptions): Promise<ArrayBuffer> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('[voice/engine] ELEVENLABS_API_KEY not configured');
    }

    const voiceId = opts?.voice ?? '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`[voice/engine] ElevenLabs TTS failed: ${response.status} ${errorBody}`);
    }

    return response.arrayBuffer();
  },
};

// -----------------------------------------------------------------------------
// Provider Registry
// -----------------------------------------------------------------------------

const defaultProviders: VoiceProvider[] = [
  browserProvider,
  openaiProvider,
  elevenlabsProvider,
];

// -----------------------------------------------------------------------------
// Voice Engine
// -----------------------------------------------------------------------------

export class VoiceEngine {
  private providers: Map<string, VoiceProvider>;
  private primaryId: string;
  private fallbackId: string;

  constructor(config?: VoiceEngineConfig) {
    this.providers = new Map();
    for (const provider of defaultProviders) {
      this.providers.set(provider.id, provider);
    }
    this.primaryId = config?.primaryProviderId ?? 'openai';
    this.fallbackId = config?.fallbackProviderId ?? 'browser';
  }

  // ---------------------------------------------------------------------------
  // Provider Management
  // ---------------------------------------------------------------------------

  registerProvider(provider: VoiceProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): VoiceProvider | undefined {
    return this.providers.get(id);
  }

  listProviders(): VoiceProvider[] {
    return Array.from(this.providers.values());
  }

  // ---------------------------------------------------------------------------
  // Speech-to-Text
  // ---------------------------------------------------------------------------

  async transcribe(audioBuffer: ArrayBuffer, options?: TranscribeOptions): Promise<string> {
    const primary = this.resolveProvider('stt', this.primaryId);
    const fallback = this.resolveProvider('stt', this.fallbackId);

    if (primary?.transcribe) {
      try {
        return await primary.transcribe(audioBuffer, options);
      } catch (err) {
        console.error(
          `[voice/engine] Primary STT provider "${primary.id}" failed, trying fallback:`,
          err
        );
      }
    }

    if (fallback?.transcribe) {
      return fallback.transcribe(audioBuffer, options);
    }

    throw new Error('[voice/engine] No STT provider available');
  }

  // ---------------------------------------------------------------------------
  // Text-to-Speech
  // ---------------------------------------------------------------------------

  async synthesize(text: string, options?: SynthesizeOptions): Promise<ArrayBuffer> {
    const primary = this.resolveProvider('tts', this.primaryId);
    const fallback = this.resolveProvider('tts', this.fallbackId);

    if (primary?.synthesize) {
      try {
        return await primary.synthesize(text, options);
      } catch (err) {
        console.error(
          `[voice/engine] Primary TTS provider "${primary.id}" failed, trying fallback:`,
          err
        );
      }
    }

    if (fallback?.synthesize) {
      return fallback.synthesize(text, options);
    }

    throw new Error('[voice/engine] No TTS provider available');
  }

  // ---------------------------------------------------------------------------
  // Streaming STT
  // ---------------------------------------------------------------------------

  async *streamTranscribe(
    stream: ReadableStream<Uint8Array>
  ): AsyncGenerator<PartialTranscript> {
    // Streaming transcription: accumulate chunks and transcribe in segments.
    // In production, this would use a WebSocket-based streaming API (e.g. OpenAI
    // real-time or Deepgram). For now, we buffer chunks and transcribe when we
    // have enough data.
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const chunkThreshold = 16_000; // ~1 second of 16kHz 16-bit audio

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          chunks.push(value);
          totalBytes += value.byteLength;
        }

        if (totalBytes >= chunkThreshold || done) {
          if (chunks.length > 0) {
            const merged = mergeChunks(chunks, totalBytes);
            try {
              const text = await this.transcribe(merged.buffer as ArrayBuffer);
              yield { text, isFinal: done ?? false };
            } catch {
              // Skip failed chunk, continue streaming
            }
            chunks.length = 0;
            totalBytes = 0;
          }
        }

        if (done) {
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private resolveProvider(
    capability: VoiceCapability,
    preferredId: string
  ): VoiceProvider | undefined {
    const preferred = this.providers.get(preferredId);
    if (preferred?.capabilities.includes(capability)) {
      return preferred;
    }

    // Find any provider with the capability
    for (const provider of this.providers.values()) {
      if (provider.capabilities.includes(capability)) {
        return provider;
      }
    }

    return undefined;
  }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function mergeChunks(chunks: Uint8Array[], totalLength: number): Uint8Array {
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

// -----------------------------------------------------------------------------
// Singleton
// -----------------------------------------------------------------------------

export const voiceEngine = new VoiceEngine();
