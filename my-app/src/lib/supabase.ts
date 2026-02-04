import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RetrievedChunk {
  id: number;
  project_name: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, unknown>;
  similarity: number;
}

export async function searchProjectEmbeddings(
  queryEmbedding: number[],
  matchCount: number = 5,
  matchThreshold: number = 0.5
): Promise<RetrievedChunk[]> {
  const { data, error } = await supabase.rpc("match_project_embeddings", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    match_threshold: matchThreshold,
  });

  if (error) throw error;
  return data ?? [];
}
