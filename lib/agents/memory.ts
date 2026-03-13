/**
 * Agent Memory — long-term knowledge storage and retrieval for agents.
 *
 * Provides persistent (in-memory for dev) storage of facts, preferences,
 * relationships, events, and insights that agents accumulate over time.
 */

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
 * Returns a score in [0, 1].
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
// AgentMemory
// ---------------------------------------------------------------------------

export class AgentMemory {
  private store = new Map<string, MemoryEntry[]>(); // agentId -> entries

  // ── Write ────────────────────────────────────────────────────────────────

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

  // ── Read ─────────────────────────────────────────────────────────────────

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

  /**
   * Search memories by text similarity (keyword matching).
   */
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

    // Touch accessed entries
    const now = new Date().toISOString();
    for (const { entry } of scored) {
      entry.lastAccessedAt = now;
      entry.accessCount += 1;
    }

    return scored.map((s) => s.entry);
  }

  /**
   * Get memories relevant to a given context string.
   * Combines text similarity with importance weighting.
   */
  getRelevant(agentId: string, context: string, limit = 5): MemoryEntry[] {
    return this.search(agentId, context, limit);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  remove(id: string): void {
    for (const [agentId, entries] of this.store) {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx !== -1) {
        entries.splice(idx, 1);
        this.store.set(agentId, entries);
        return;
      }
    }
  }

  /**
   * Prune least important / least accessed memories to stay under a cap.
   */
  prune(agentId: string, maxEntries = 200): number {
    const entries = this.store.get(agentId) ?? [];

    if (entries.length <= maxEntries) return 0;

    // Score each entry: higher = more worth keeping
    const scored = entries.map((entry) => ({
      entry,
      keepScore:
        entry.importance * 0.5 +
        Math.min(entry.accessCount / 20, 0.3) +
        // Recency bonus: entries from the last 24h get +0.2
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
// Singleton
// ---------------------------------------------------------------------------

export const agentMemory = new AgentMemory();
