-- Migration: add_policy_embeddings
-- Adds the policy_embeddings table for FAQ/policy RAG retrieval (spec-08)

-- UP

CREATE TABLE "policy_embeddings" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "section"    VARCHAR(100) NOT NULL,   -- shipping | returns | faq
    "topic"      VARCHAR(255) NOT NULL,
    "content"    TEXT NOT NULL,
    "embedding"  vector(1024),
    "metadata"   JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "policy_embeddings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "policy_embeddings_section_topic_key" ON "policy_embeddings"("section", "topic");
CREATE INDEX "idx_policy_embeddings_section" ON "policy_embeddings"("section");

-- HNSW index for cosine similarity — works correctly at any dataset size unlike IVFFlat
CREATE INDEX ON "policy_embeddings" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- DOWN
-- DROP TABLE "policy_embeddings";
