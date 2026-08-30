-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 知识库切片表
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id          BIGSERIAL PRIMARY KEY,
  source_type VARCHAR(32) NOT NULL,
  source_id   VARCHAR(64) NOT NULL,
  chunk_index INT NOT NULL DEFAULT 0,
  content     TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding   vector(1024),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ivfflat 索引(余弦相似度)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 按 source 查询索引
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source
  ON knowledge_chunks (source_type, source_id);

-- 按 source 删除索引(幂等入库用)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source_chunk
  ON knowledge_chunks (source_type, source_id, chunk_index);
