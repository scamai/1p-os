/**
 * Mem0 Memory Layer — semantic, LLM-powered memory for agents.
 *
 * Wraps the mem0ai OSS SDK configured to use:
 * - Supabase (pgvector) as the vector store
 * - OpenAI embeddings (or configurable)
 * - Anthropic Claude as the LLM for fact extraction
 *
 * Provides the same interface as the old AgentMemory class so existing
 * code (runner, API routes) can migrate without breaking.
 */

import type { MemoryConfig, MemoryItem, SearchResult } from "mem0ai/oss";
import type { MemoryEntry } from "./memory";

// ---------------------------------------------------------------------------
// Config builder
// ---------------------------------------------------------------------------

function buildMem0Config(): Partial<MemoryConfig> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Mem0 requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  const config: Partial<MemoryConfig> = {
    vectorStore: {
      provider: "supabase",
      config: {
        supabaseUrl,
        supabaseKey,
        tableName: "mem0_memories",
        collectionName: "agent_memories",
      },
    },
    // LLM for fact extraction & deduplication
    llm: {
      provider: "anthropic",
      config: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: "claude-haiku-4-5-20251001",
      },
    },
    // Embeddings — use OpenAI if key available, otherwise Anthropic-compatible
    embedder: {
      provider: "openai",
      config: {
        apiKey: process.env.OPENAI_API_KEY,
        model: "text-embedding-3-small",
      },
    },
    // Store history in Supabase too
    historyStore: {
      provider: "supabase",
      config: {
        supabaseUrl,
        supabaseKey,
        tableName: "mem0_history",
      },
    },
  };

  return config;
}

// ---------------------------------------------------------------------------
// Lazy singleton — avoids importing mem0ai at module load time
// ---------------------------------------------------------------------------

let _memory: InstanceType<typeof import("mem0ai/oss").Memory> | null = null;

async function getMem0(): Promise<
  InstanceType<typeof import("mem0ai/oss").Memory>
> {
  if (_memory) return _memory;

  const { Memory } = await import("mem0ai/oss");
  const config = buildMem0Config();
  _memory = new Memory(config);

  return _memory;
}

// ---------------------------------------------------------------------------
// Adapter — maps mem0 results to MemoryEntry format
// ---------------------------------------------------------------------------

function toMemoryEntry(item: MemoryItem, agentId: string, businessId: string): MemoryEntry {
  return {
    id: item.id,
    agentId: item.metadata?.agentId ?? agentId,
    businessId: item.metadata?.businessId ?? businessId,
    category: item.metadata?.category ?? "fact",
    content: item.memory,
    metadata: item.metadata,
    importance: item.score ?? item.metadata?.importance ?? 0.5,
    createdAt: item.createdAt ?? new Date().toISOString(),
    lastAccessedAt: item.updatedAt ?? new Date().toISOString(),
    accessCount: item.metadata?.accessCount ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Mem0AgentMemory — drop-in replacement for AgentMemory
// ---------------------------------------------------------------------------

export class Mem0AgentMemory {
  /**
   * Add a memory from a conversation or explicit content.
   * Uses mem0's LLM-powered fact extraction for automatic deduplication.
   */
  async add(
    agentId: string,
    businessId: string,
    input: {
      content: string;
      category?: string;
      importance?: number;
      metadata?: Record<string, unknown>;
    },
  ): Promise<MemoryEntry> {
    const mem0 = await getMem0();

    const result: SearchResult = await mem0.add(input.content, {
      agentId,
      metadata: {
        businessId,
        category: input.category ?? "fact",
        importance: input.importance ?? 0.5,
        ...input.metadata,
      },
    });

    const firstResult = result.results[0];
    if (firstResult) {
      return toMemoryEntry(firstResult, agentId, businessId);
    }

    // Fallback if mem0 deduplicated (no new memory created)
    return {
      id: crypto.randomUUID(),
      agentId,
      businessId,
      category: (input.category as MemoryEntry["category"]) ?? "fact",
      content: input.content,
      metadata: input.metadata as Record<string, unknown>,
      importance: input.importance ?? 0.5,
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      accessCount: 0,
    };
  }

  /**
   * Add memories from a full conversation (array of messages).
   * mem0 automatically extracts facts, deduplicates, and resolves conflicts.
   */
  async addFromConversation(
    agentId: string,
    businessId: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<SearchResult> {
    const mem0 = await getMem0();

    return mem0.add(messages, {
      agentId,
      metadata: { businessId },
    });
  }

  /**
   * Semantic search — uses vector similarity instead of keyword overlap.
   */
  async search(
    agentId: string,
    query: string,
    limit = 10,
  ): Promise<MemoryEntry[]> {
    const mem0 = await getMem0();

    const result: SearchResult = await mem0.search(query, {
      agentId,
      limit,
    });

    return result.results.map((item) =>
      toMemoryEntry(item, agentId, ""),
    );
  }

  /**
   * Get memories relevant to a context string.
   */
  async getRelevant(
    agentId: string,
    context: string,
    limit = 5,
  ): Promise<MemoryEntry[]> {
    return this.search(agentId, context, limit);
  }

  /**
   * List all memories for an agent.
   */
  async list(
    agentId: string,
    category?: string,
  ): Promise<MemoryEntry[]> {
    const mem0 = await getMem0();

    const result: SearchResult = await mem0.getAll({
      agentId,
      limit: 100,
    });

    let entries = result.results.map((item) =>
      toMemoryEntry(item, agentId, ""),
    );

    if (category) {
      entries = entries.filter((e) => e.category === category);
    }

    return entries;
  }

  /**
   * Get a specific memory by ID.
   */
  async get(memoryId: string): Promise<MemoryEntry | null> {
    const mem0 = await getMem0();
    const item = await mem0.get(memoryId);
    if (!item) return null;
    return toMemoryEntry(item, "", "");
  }

  /**
   * Delete a specific memory.
   */
  async remove(id: string): Promise<void> {
    const mem0 = await getMem0();
    await mem0.delete(id);
  }

  /**
   * Delete all memories for an agent.
   */
  async removeAll(agentId: string): Promise<void> {
    const mem0 = await getMem0();
    await mem0.deleteAll({ agentId });
  }

  /**
   * Get the change history for a memory.
   */
  async history(memoryId: string): Promise<unknown[]> {
    const mem0 = await getMem0();
    return mem0.history(memoryId);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const mem0Memory = new Mem0AgentMemory();
