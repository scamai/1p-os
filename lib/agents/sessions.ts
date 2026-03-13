/**
 * Session Manager — tracks agent conversations and cross-agent coordination.
 *
 * Uses in-memory stores for development; production would persist to Supabase.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentSession {
  id: string;
  agentId: string;
  channel: string; // "web" | "whatsapp" | "slack" | etc.
  peerId?: string; // who the agent is talking to
  status: "active" | "idle" | "archived";
  model?: string;
  messageCount: number;
  tokenCount: { input: number; output: number; total: number };
  costUsd: number;
  createdAt: string;
  lastActivityAt: string;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolName?: string;
  toolCallId?: string;
  timestamp: string;
  tokenCount?: number;
}

export interface CrossAgentEnvelope {
  fromSessionId: string;
  fromAgentId: string;
  toAgentId: string;
  message: SessionMessage;
}

// ---------------------------------------------------------------------------
// SessionManager
// ---------------------------------------------------------------------------

export class SessionManager {
  private sessions = new Map<string, AgentSession>();
  private messages = new Map<string, SessionMessage[]>(); // sessionId -> messages
  private crossAgentInbox = new Map<string, CrossAgentEnvelope[]>(); // agentId -> envelopes

  // ── Create ───────────────────────────────────────────────────────────────

  create(agentId: string, channel: string, peerId?: string): AgentSession {
    const now = new Date().toISOString();
    const session: AgentSession = {
      id: crypto.randomUUID(),
      agentId,
      channel,
      peerId,
      status: "active",
      messageCount: 0,
      tokenCount: { input: 0, output: 0, total: 0 },
      costUsd: 0,
      createdAt: now,
      lastActivityAt: now,
    };

    this.sessions.set(session.id, session);
    this.messages.set(session.id, []);
    return session;
  }

  // ── Read ─────────────────────────────────────────────────────────────────

  get(id: string): AgentSession | undefined {
    return this.sessions.get(id);
  }

  list(filters?: {
    agentId?: string;
    channel?: string;
    status?: AgentSession["status"];
  }): AgentSession[] {
    let results = Array.from(this.sessions.values());

    if (filters?.agentId) {
      results = results.filter((s) => s.agentId === filters.agentId);
    }
    if (filters?.channel) {
      results = results.filter((s) => s.channel === filters.channel);
    }
    if (filters?.status) {
      results = results.filter((s) => s.status === filters.status);
    }

    return results.sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() -
        new Date(a.lastActivityAt).getTime(),
    );
  }

  // ── Messages ─────────────────────────────────────────────────────────────

  addMessage(
    sessionId: string,
    message: Omit<SessionMessage, "id" | "sessionId" | "timestamp">,
  ): SessionMessage {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const fullMessage: SessionMessage = {
      ...message,
      id: crypto.randomUUID(),
      sessionId,
      timestamp: new Date().toISOString(),
    };

    const bucket = this.messages.get(sessionId) ?? [];
    bucket.push(fullMessage);
    this.messages.set(sessionId, bucket);

    // Update session counters
    session.messageCount += 1;
    if (fullMessage.tokenCount) {
      if (fullMessage.role === "user" || fullMessage.role === "system") {
        session.tokenCount.input += fullMessage.tokenCount;
      } else {
        session.tokenCount.output += fullMessage.tokenCount;
      }
      session.tokenCount.total =
        session.tokenCount.input + session.tokenCount.output;
    }
    session.lastActivityAt = fullMessage.timestamp;

    return fullMessage;
  }

  getHistory(sessionId: string, limit?: number): SessionMessage[] {
    const bucket = this.messages.get(sessionId) ?? [];
    if (limit && limit > 0) {
      return bucket.slice(-limit);
    }
    return [...bucket];
  }

  /**
   * Build a formatted context string suitable for sending to an LLM.
   * Returns system prompt + recent conversation history as a single block.
   */
  getContext(sessionId: string, systemPrompt?: string, maxMessages = 50): string {
    const history = this.getHistory(sessionId, maxMessages);
    const lines: string[] = [];

    if (systemPrompt) {
      lines.push(`[System]: ${systemPrompt}`);
    }

    for (const msg of history) {
      const prefix =
        msg.role === "tool"
          ? `[Tool:${msg.toolName ?? "unknown"}]`
          : `[${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}]`;
      lines.push(`${prefix}: ${msg.content}`);
    }

    return lines.join("\n\n");
  }

  /**
   * Build a structured context array suitable for Anthropic messages API.
   */
  getContextMessages(
    sessionId: string,
    systemPrompt?: string,
    maxMessages = 50,
  ): Array<{ role: string; content: string }> {
    const history = this.getHistory(sessionId, maxMessages);
    const formatted: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      formatted.push({ role: "system", content: systemPrompt });
    }

    for (const msg of history) {
      if (msg.role === "tool") {
        formatted.push({
          role: "user",
          content: `[Tool result for ${msg.toolName ?? "unknown"}]: ${msg.content}`,
        });
      } else {
        formatted.push({ role: msg.role, content: msg.content });
      }
    }

    return formatted;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  archiveSession(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.status = "archived";
      session.lastActivityAt = new Date().toISOString();
    }
  }

  // ── Cross-agent messaging ────────────────────────────────────────────────

  /**
   * Send a message from one agent's session to another agent.
   * The target agent will see the message in its inbox and can pick it up
   * when its next session starts or is polled.
   */
  crossAgentSend(
    fromSessionId: string,
    toAgentId: string,
    messageContent: string,
  ): CrossAgentEnvelope {
    const session = this.sessions.get(fromSessionId);
    if (!session) {
      throw new Error(`Source session not found: ${fromSessionId}`);
    }

    const message: SessionMessage = {
      id: crypto.randomUUID(),
      sessionId: fromSessionId,
      role: "assistant",
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    const envelope: CrossAgentEnvelope = {
      fromSessionId,
      fromAgentId: session.agentId,
      toAgentId,
      message,
    };

    const inbox = this.crossAgentInbox.get(toAgentId) ?? [];
    inbox.push(envelope);
    this.crossAgentInbox.set(toAgentId, inbox);

    return envelope;
  }

  /**
   * Retrieve and drain pending cross-agent messages for an agent.
   */
  drainInbox(agentId: string): CrossAgentEnvelope[] {
    const inbox = this.crossAgentInbox.get(agentId) ?? [];
    this.crossAgentInbox.set(agentId, []);
    return inbox;
  }

  // ── Cost ─────────────────────────────────────────────────────────────────

  getSessionCost(id: string): number {
    return this.sessions.get(id)?.costUsd ?? 0;
  }

  addSessionCost(id: string, costUsd: number): void {
    const session = this.sessions.get(id);
    if (session) {
      session.costUsd += costUsd;
    }
  }

  // ── Compaction ───────────────────────────────────────────────────────────

  /**
   * Compact old messages into a single summary message to save tokens.
   * Keeps the most recent `keepCount` messages verbatim and replaces
   * everything older with a "[Summary]" system message.
   *
   * In production this would call the LLM to generate the summary;
   * here we create a deterministic digest.
   */
  compactHistory(sessionId: string, keepCount = 10, summary?: string): void {
    const bucket = this.messages.get(sessionId);
    if (!bucket || bucket.length <= keepCount) {
      return;
    }

    const toSummarize = bucket.slice(0, bucket.length - keepCount);
    const toKeep = bucket.slice(bucket.length - keepCount);

    // Use provided summary or build a simple digest from the old messages
    let summaryContent: string;
    if (summary) {
      summaryContent = summary;
    } else {
      const turns = toSummarize.length;
      const roles = new Set(toSummarize.map((m) => m.role));
      const topics = toSummarize
        .filter((m) => m.role === "user")
        .map((m) => m.content.slice(0, 80))
        .slice(0, 5);

      summaryContent = [
        `[Conversation summary — ${turns} earlier messages compacted]`,
        `Participants: ${Array.from(roles).join(", ")}`,
        topics.length > 0
          ? `Key topics: ${topics.map((t) => `"${t}"`).join("; ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    const summaryMessage: SessionMessage = {
      id: crypto.randomUUID(),
      sessionId,
      role: "system",
      content: summaryContent,
      timestamp: toSummarize[0].timestamp,
    };

    this.messages.set(sessionId, [summaryMessage, ...toKeep]);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const sessionManager = new SessionManager();
