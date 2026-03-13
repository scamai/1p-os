-- ============================================================================
-- 004_mem0_memory.sql — Mem0 semantic memory layer
--
-- Creates tables and functions required by mem0ai OSS (Supabase vector store).
-- Provides LLM-powered semantic memory with vector similarity search,
-- automatic fact extraction, deduplication, and conflict resolution.
-- ============================================================================

-- Enable the pgvector extension for embedding storage
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- mem0_memories — vector store for agent memories
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mem0_memories (
  id TEXT PRIMARY KEY,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for metadata-based filtering (agent_id, business_id, user_id)
CREATE INDEX IF NOT EXISTS idx_mem0_memories_metadata
  ON mem0_memories USING gin(metadata);

-- Index for fast vector similarity search (IVFFlat)
-- Using cosine distance; list size tuned for moderate data volumes.
-- Recreate with more lists as data grows beyond 100k rows.
CREATE INDEX IF NOT EXISTS idx_mem0_memories_embedding
  ON mem0_memories USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ---------------------------------------------------------------------------
-- mem0_history — memory change history (updates, deletions)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mem0_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id TEXT NOT NULL,
  prev_value TEXT,
  new_value TEXT,
  event TEXT NOT NULL, -- 'ADD', 'UPDATE', 'DELETE'
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_mem0_history_memory_id
  ON mem0_history(memory_id);

-- ---------------------------------------------------------------------------
-- memory_migrations — mem0 internal tracking table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS memory_migrations (
  user_id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- match_vectors — semantic similarity search function
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION match_vectors(
  query_embedding vector(1536),
  match_count INT,
  filter JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  id TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id::TEXT,
    1 - (t.embedding <=> query_embedding) AS similarity,
    t.metadata
  FROM mem0_memories t
  WHERE CASE
    WHEN filter::TEXT = '{}'::TEXT THEN TRUE
    ELSE t.metadata @> filter
  END
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS policies — scoped to business via metadata
-- ---------------------------------------------------------------------------

ALTER TABLE mem0_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mem0_history ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by mem0 SDK server-side)
CREATE POLICY "service_role_full_access" ON mem0_memories
  FOR ALL
  USING (current_setting('request.jwt.claim.role', TRUE) = 'service_role');

CREATE POLICY "service_role_full_access" ON mem0_history
  FOR ALL
  USING (current_setting('request.jwt.claim.role', TRUE) = 'service_role');
