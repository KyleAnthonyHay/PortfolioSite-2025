import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ProjectEmbedding {
  id?: number;
  project_name: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, unknown>;
  embedding: number[];
}

export async function insertProjectEmbedding(
  embedding: Omit<ProjectEmbedding, "id">
) {
  const { data, error } = await supabase
    .from("project_embeddings")
    .insert(embedding)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertProjectEmbeddings(
  embeddings: Omit<ProjectEmbedding, "id">[]
) {
  const { data, error } = await supabase
    .from("project_embeddings")
    .insert(embeddings)
    .select();

  if (error) throw error;
  return data;
}

export async function clearProjectEmbeddings() {
  const { error } = await supabase
    .from("project_embeddings")
    .delete()
    .neq("id", 0);

  if (error) throw error;
}
