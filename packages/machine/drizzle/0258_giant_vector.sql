-- Custom Migration: Expand all embedding columns from 1536 to 4096 dimensions
-- Reason: qwen/qwen3-embedding-8b and other models output 4096-dim vectors
-- Note: Existing 1536-dim vectors cannot be cast, so they are cleared first.
-- NOTE: pgvector HNSW/IVFFLAT indexes have a hard limit of 2000 dimensions,
-- so they cannot be recreated for 4096-dim vectors. Semantic search will work
-- but use sequential scans instead of index-accelerated lookups.

-- =============================================================================
-- STEP 1: Clear existing embeddings (dimension mismatch prevents ALTER TYPE)
-- =============================================================================
UPDATE "tribeNews" SET embedding = NULL;
UPDATE "document_chunks" SET embedding = NULL;
UPDATE "message_embeddings" SET embedding = NULL;
UPDATE "threadSummaries" SET embedding = NULL;
UPDATE "memories" SET embedding = NULL;
UPDATE "characterProfiles" SET embedding = NULL;
UPDATE "newsArticles" SET embedding = NULL;
UPDATE "codeEmbeddings" SET embedding = NULL;

-- =============================================================================
-- STEP 2: Drop HNSW/IVFFLAT indexes (they depend on the old vector type)
-- =============================================================================
DROP INDEX IF EXISTS "tribe_news_embedding_index";
DROP INDEX IF EXISTS "document_chunks_embedding_idx";
DROP INDEX IF EXISTS "message_embeddings_embedding_idx";
DROP INDEX IF EXISTS "thread_summaries_embedding_idx";
DROP INDEX IF EXISTS "user_memories_embedding_idx";
DROP INDEX IF EXISTS "character_profiles_embedding_idx";
DROP INDEX IF EXISTS "news_articles_embedding_idx";
DROP INDEX IF EXISTS "codeEmbeddings_embedding_idx";

-- =============================================================================
-- STEP 3: Alter column types to vector(4096)
-- =============================================================================
ALTER TABLE "tribeNews" ALTER COLUMN embedding TYPE vector(4096);
ALTER TABLE "document_chunks" ALTER COLUMN embedding TYPE vector(4096);
ALTER TABLE "message_embeddings" ALTER COLUMN embedding TYPE vector(4096);
ALTER TABLE "threadSummaries" ALTER COLUMN embedding TYPE vector(4096);
ALTER TABLE "memories" ALTER COLUMN embedding TYPE vector(4096);
ALTER TABLE "characterProfiles" ALTER COLUMN embedding TYPE vector(4096);
ALTER TABLE "newsArticles" ALTER COLUMN embedding TYPE vector(4096);
ALTER TABLE "codeEmbeddings" ALTER COLUMN embedding TYPE vector(4096);

-- =============================================================================
-- STEP 4: Skip index recreation (pgvector limit: 2000 max dimensions for HNSW)
-- =============================================================================
-- Intentionally left blank. Index-accelerated similarity search is not
-- supported for 4096-dimensional vectors in pgvector <= 0.8.2.
