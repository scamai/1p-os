/**
 * MiniMax LLM Client
 * ==================
 * MiniMax exposes an OpenAI-compatible chat completions API.
 * Endpoint: https://api.minimaxi.chat/v1/text/chatcompletion_v2
 *
 * Supports: MiniMax-Text-01 (1M context window)
 */

const MINIMAX_BASE_URL = 'https://api.minimaxi.chat/v1';

interface MiniMaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MiniMaxChoice {
  message: { role: string; content: string };
  finish_reason: string;
}

interface MiniMaxResponse {
  choices: MiniMaxChoice[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

function getApiKey(): string {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) throw new Error('MINIMAX_API_KEY not set');
  return key;
}

export async function minimaxChat(
  messages: MiniMaxMessage[],
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<{ text: string; usage?: MiniMaxResponse['usage'] }> {
  const {
    model = 'MiniMax-Text-01',
    maxTokens = 1024,
    temperature = 0.7,
  } = options;

  const res = await fetch(`${MINIMAX_BASE_URL}/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`MiniMax API error ${res.status}: ${body}`);
  }

  const data: MiniMaxResponse = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';

  return { text, usage: data.usage };
}
