import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as Record<string | symbol, unknown>)[prop];
  },
});

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
