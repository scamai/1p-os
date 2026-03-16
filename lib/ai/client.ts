import Anthropic from '@anthropic-ai/sdk';
import { minimaxChat } from '@/lib/ai/minimax';

let anthropicInstance: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicInstance) {
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return anthropicInstance;
}

/** Check if a model ID belongs to MiniMax */
function isMiniMaxModel(model: string): boolean {
  return model.toLowerCase().startsWith('minimax');
}

interface GenerateTextOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export async function generateText(
  prompt: string,
  options: GenerateTextOptions = {}
): Promise<string> {
  const {
    model = 'claude-sonnet-4-20250514',
    maxTokens = 1024,
    temperature = 0.7,
    systemPrompt,
  } = options;

  // Route to MiniMax
  if (isMiniMaxModel(model)) {
    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: prompt },
    ];
    const result = await minimaxChat(messages, { model, maxTokens, temperature });
    return result.text;
  }

  // Default: Anthropic
  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock?.text ?? '';
  } catch (error) {
    console.error('[ai/client] generateText failed:', error);
    throw error;
  }
}

interface GenerateStructuredOptions extends GenerateTextOptions {}

export async function generateStructured<T>(
  prompt: string,
  schema: { parse: (data: unknown) => T },
  options: GenerateStructuredOptions = {}
): Promise<T> {
  const {
    model = 'claude-sonnet-4-20250514',
    maxTokens = 2048,
    temperature = 0.3,
    systemPrompt,
  } = options;

  const fullSystemPrompt = [
    systemPrompt ?? '',
    'You must respond with valid JSON only. No markdown, no explanation, just the JSON object.',
  ]
    .filter(Boolean)
    .join('\n\n');

  let rawText: string;

  // Route to MiniMax
  if (isMiniMaxModel(model)) {
    const messages = [
      { role: 'system' as const, content: fullSystemPrompt },
      { role: 'user' as const, content: prompt },
    ];
    const result = await minimaxChat(messages, { model, maxTokens, temperature });
    rawText = result.text;
  } else {
    // Default: Anthropic
    try {
      const client = getAnthropicClient();
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: fullSystemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      rawText = textBlock?.text ?? '{}';
    } catch (error) {
      console.error('[ai/client] generateStructured failed:', error);
      throw error;
    }
  }

  // Extract JSON from potential markdown code blocks
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [
    null,
    rawText,
  ];
  const jsonString = jsonMatch[1]!.trim();

  const parsed = JSON.parse(jsonString);
  return schema.parse(parsed);
}
