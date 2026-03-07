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

-- IVFFlat index for cosine similarity (lists = 10 for small policy corpus)
CREATE INDEX ON "policy_embeddings"
    USING ivfflat ("embedding" vector_cosine_ops)
    WITH (lists = 10);

-- DOWN
-- DROP TABLE "policy_embeddings";
