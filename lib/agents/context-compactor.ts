/**
 * Context Compactor — manages context window overflow.
 *
 * When a session's message history exceeds token budget, older messages
 * are summarized into a compact context block. This preserves important
 * information while keeping the context window manageable.
 */

import { sessionManager } from "@/lib/agents/sessions";
import type { SessionMessage } from "@/lib/agents/sessions";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_MAX_MESSAGES = 50;
const DEFAULT_KEEP_RECENT = 10;

// ---------------------------------------------------------------------------
// Compactor
// ---------------------------------------------------------------------------

export class ContextCompactor {
  /**
   * Check if a session needs compaction.
   */
  needsCompaction(sessionId: string, maxMessages = DEFAULT_MAX_MESSAGES): boolean {
    const history = sessionManager.getHistory(sessionId);
    return history.length > maxMessages;
  }

  /**
   * Compact a session's history by summarizing older messages.
   * Keeps the most recent messages intact.
   */
  compact(
    sessionId: string,
    options: {
      maxMessages?: number;
      keepRecent?: number;
      summaryFn?: (messages: SessionMessage[]) => string;
    } = {},
  ): { compacted: boolean; removedCount: number; summary: string } {
    const maxMessages = options.maxMessages ?? DEFAULT_MAX_MESSAGES;
    const keepRecent = options.keepRecent ?? DEFAULT_KEEP_RECENT;
    const summaryFn = options.summaryFn ?? this.defaultSummarize;

    const history = sessionManager.getHistory(sessionId);

    if (history.length <= maxMessages) {
      return { compacted: false, removedCount: 0, summary: "" };
    }

    const toCompact = history.slice(0, history.length - keepRecent);
    const summary = summaryFn(toCompact);

    // Replace old messages with a single summary message
    sessionManager.compactHistory(sessionId, keepRecent, summary);

    return {
      compacted: true,
      removedCount: toCompact.length,
      summary,
    };
  }

  /**
   * Default summarization — extracts key information from messages.
   * In production, this would call an LLM for proper summarization.
   */
  private defaultSummarize(messages: SessionMessage[]): string {
    const parts: string[] = [];

    // Extract tool calls
    const toolCalls = messages.filter((m) => m.role === "tool" || m.toolName);
    if (toolCalls.length > 0) {
      const toolNames = [...new Set(toolCalls.map((m) => m.toolName).filter(Boolean))];
      parts.push(`Tools used: ${toolNames.join(", ")}`);
    }

    // Extract key user messages (first and last)
    const userMessages = messages.filter((m) => m.role === "user" && !m.toolCallId);
    if (userMessages.length > 0) {
      parts.push(`User topics: ${userMessages.slice(0, 3).map((m) => m.content.slice(0, 100)).join("; ")}`);
    }

    // Extract assistant conclusions
    const assistantMessages = messages.filter((m) => m.role === "assistant" && !m.toolName);
    if (assistantMessages.length > 0) {
      const last = assistantMessages[assistantMessages.length - 1];
      parts.push(`Last conclusion: ${last.content.slice(0, 200)}`);
    }

    return `[Context summary of ${messages.length} messages] ${parts.join(". ")}`;
  }

  /**
   * Estimate token count for a session (rough: 1 token ≈ 4 chars).
   */
  estimateTokens(sessionId: string): number {
    const history = sessionManager.getHistory(sessionId);
    const totalChars = history.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 4);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const contextCompactor = new ContextCompactor();
