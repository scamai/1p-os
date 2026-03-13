/**
 * Agent Memory — long-term knowledge storage and retrieval for agents.
 *
 * Uses mem0 for semantic, LLM-powered memory with vector search,
 * automatic fact extraction, deduplication, and conflict resolution.
 *
 * Falls back to a simple in-memory store when mem0 dependencies
 * (Supabase + OpenAI embeddings) are not configured.
 */

import { mem0Memory, type Mem0AgentMemory } from "./mem0";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemoryEntry {
  id: string;
  agentId: string;
  businessId: string;
  category: "fact" | "preference" | "relationship" | "event" | "insight";
  content: string;
  metadata?: Record<string, unknown>;
  importance: number; // 0-1
  createdAt: string;
  lastAccessedAt: string;
  accessCount: number;
}

type MemoryInput = Pick<MemoryEntry, "category" | "content"> &
  Partial<Pick<MemoryEntry, "metadata" | "importance">>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Naive keyword-overlap similarity between two strings.
 * Returns a score in [0, 1]. Used by the fallback in-memory store.
 */
function textSimilarity(a: string, b: string): number {
  const normalize = (s: string): Set<string> =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );

  const setA = normalize(a);
  const setB = normalize(b);

  if (setA.size === 0 || setB.size === 0) return 0;

  let overlap = 0;
  for (const word of setA) {
    if (setB.has(word)) overlap++;
  }

  return overlap / Math.max(setA.size, setB.size);
}

// ---------------------------------------------------------------------------
// Check if mem0 is available (env vars configured)
// ---------------------------------------------------------------------------

function isMem0Available(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.OPENAI_API_KEY &&
    process.env.ANTHROPIC_API_KEY
  );
}

// ---------------------------------------------------------------------------
// InMemoryAgentMemory — fallback when mem0 deps are not configured
// ---------------------------------------------------------------------------

class InMemoryAgentMemory {
  private store = new Map<string, MemoryEntry[]>();

  add(agentId: string, businessId: string, input: MemoryInput): MemoryEntry {
    const now = new Date().toISOString();

    const entry: MemoryEntry = {
      id: crypto.randomUUID(),
      agentId,
      businessId,
      category: input.category,
      content: input.content,
      metadata: input.metadata,
      importance: input.importance ?? 0.5,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
    };

    const bucket = this.store.get(agentId) ?? [];
    bucket.push(entry);
    this.store.set(agentId, bucket);

    return entry;
  }

  list(agentId: string, category?: MemoryEntry["category"]): MemoryEntry[] {
    const entries = this.store.get(agentId) ?? [];
    const filtered = category
      ? entries.filter((e) => e.category === category)
      : entries;

    return [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  search(agentId: string, query: string, limit = 10): MemoryEntry[] {
    const candidates = this.store.get(agentId) ?? [];

    const scored = candidates
      .map((entry) => ({
        entry,
        score: textSimilarity(query, entry.content) + entry.importance * 0.2,
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const now = new Date().toISOString();
    for (const { entry } of scored) {
      entry.lastAccessedAt = now;
      entry.accessCount += 1;
    }

    return scored.map((s) => s.entry);
  }

  getRelevant(agentId: string, context: string, limit = 5): MemoryEntry[] {
    return this.search(agentId, context, limit);
  }

  remove(id: string): void {
    for (const [, entries] of this.store) {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx !== -1) {
        entries.splice(idx, 1);
        return;
      }
    }
  }

  prune(agentId: string, maxEntries = 200): number {
    const entries = this.store.get(agentId) ?? [];
    if (entries.length <= maxEntries) return 0;

    const scored = entries.map((entry) => ({
      entry,
      keepScore:
        entry.importance * 0.5 +
        Math.min(entry.accessCount / 20, 0.3) +
        (Date.now() - new Date(entry.lastAccessedAt).getTime() < 86_400_000
          ? 0.2
          : 0),
    }));

    scored.sort((a, b) => b.keepScore - a.keepScore);

    const toKeep = scored.slice(0, maxEntries).map((s) => s.entry);
    const removed = entries.length - toKeep.length;
    this.store.set(agentId, toKeep);

    return removed;
  }
}

// ---------------------------------------------------------------------------
// AgentMemory — unified interface that delegates to mem0 or fallback
// ---------------------------------------------------------------------------

export class AgentMemory {
  private fallback = new InMemoryAgentMemory();
  private mem0: Mem0AgentMemory | null = null;

  constructor() {
    if (isMem0Available()) {
      this.mem0 = mem0Memory;
    }
  }

  // ── Write ──────────────────────────────────────────────────────────────

  add(agentId: string, businessId: string, input: MemoryInput): MemoryEntry {
    // Synchronous return for backward compat — fire mem0 add in background
    const entry = this.fallback.add(agentId, businessId, input);

    if (this.mem0) {
      this.mem0.add(agentId, businessId, input).catch((err) => {
        console.error("[mem0] Background add failed:", err);
      });
    }

    return entry;
  }

  /**
   * Async add — returns the mem0 result when available, otherwise fallback.
   */
  async addAsync(
    agentId: string,
    businessId: string,
    input: MemoryInput,
  ): Promise<MemoryEntry> {
    if (this.mem0) {
      return this.mem0.add(agentId, businessId, input);
    }
    return this.fallback.add(agentId, businessId, input);
  }

  /**
   * Extract and store memories from a full conversation.
   * Only available with mem0 — no-op with fallback.
   */
  async addFromConversation(
    agentId: string,
    businessId: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<void> {
    if (this.mem0) {
      await this.mem0.addFromConversation(agentId, businessId, messages);
    }
  }

  // ── Read ───────────────────────────────────────────────────────────────

  list(agentId: string, category?: MemoryEntry["category"]): MemoryEntry[] {
    return this.fallback.list(agentId, category);
  }

  /**
   * Async list — uses mem0 semantic storage when available.
   */
  async listAsync(
    agentId: string,
    category?: MemoryEntry["category"],
  ): Promise<MemoryEntry[]> {
    if (this.mem0) {
      return this.mem0.list(agentId, category);
    }
    return this.fallback.list(agentId, category);
  }

  search(agentId: string, query: string, limit = 10): MemoryEntry[] {
    return this.fallback.search(agentId, query, limit);
  }

  /**
   * Async semantic search — uses mem0 vector similarity when available.
   */
  async searchAsync(
    agentId: string,
    query: string,
    limit = 10,
  ): Promise<MemoryEntry[]> {
    if (this.mem0) {
      return this.mem0.search(agentId, query, limit);
    }
    return this.fallback.search(agentId, query, limit);
  }

  getRelevant(agentId: string, context: string, limit = 5): MemoryEntry[] {
    return this.fallback.getRelevant(agentId, context, limit);
  }

  /**
   * Async relevant memories — uses mem0 vector similarity when available.
   */
  async getRelevantAsync(
    agentId: string,
    context: string,
    limit = 5,
  ): Promise<MemoryEntry[]> {
    if (this.mem0) {
      return this.mem0.getRelevant(agentId, context, limit);
    }
    return this.fallback.getRelevant(agentId, context, limit);
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  remove(id: string): void {
    this.fallback.remove(id);

    if (this.mem0) {
      this.mem0.remove(id).catch((err) => {
        console.error("[mem0] Background remove failed:", err);
      });
    }
  }

  /**
   * Get memory change history (mem0 only).
   */
  async history(memoryId: string): Promise<unknown[]> {
    if (this.mem0) {
      return this.mem0.history(memoryId);
    }
    return [];
  }

  prune(agentId: string, maxEntries = 200): number {
    return this.fallback.prune(agentId, maxEntries);
  }

  /**
   * Whether mem0 (semantic memory) is active.
   */
  get isSemanticEnabled(): boolean {
    return this.mem0 !== null;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const agentMemory = new AgentMemory();
