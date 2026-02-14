import OpenAI from "openai";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function generateChatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1000,
  });

  return response.choices[0].message.content ?? "";
}
