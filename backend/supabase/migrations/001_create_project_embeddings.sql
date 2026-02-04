-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create project embeddings table
CREATE TABLE IF NOT EXISTS project_embeddings (
  id BIGSERIAL PRIMARY KEY,
  project_name TEXT NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster similarity search
CREATE INDEX IF NOT EXISTS project_embeddings_embedding_idx 
  ON project_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create index on project_name for filtering
CREATE INDEX IF NOT EXISTS project_embeddings_project_name_idx 
  ON project_embeddings (project_name);

-- Function to search for similar embeddings
CREATE OR REPLACE FUNCTION match_project_embeddings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id BIGINT,
  project_name TEXT,
  content TEXT,
  chunk_index INTEGER,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.project_name,
    pe.content,
    pe.chunk_index,
    pe.metadata,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM project_embeddings pe
  WHERE 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search within a specific project
CREATE OR REPLACE FUNCTION match_project_embeddings_by_project(
  query_embedding VECTOR(1536),
  target_project TEXT,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id BIGINT,
  project_name TEXT,
  content TEXT,
  chunk_index INTEGER,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.project_name,
    pe.content,
    pe.chunk_index,
    pe.metadata,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM project_embeddings pe
  WHERE pe.project_name = target_project
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
