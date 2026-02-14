import OpenAI from "openai";
import "dotenv/config";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({ apiKey });

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}
