import { Pinecone } from "@pinecone-database/pinecone";

interface PineconeRecordFields {
  text?: string;
  project_name?: string;
  chunk_index?: number;
  source_file?: string;
  record_type?: "project" | "personal_info";
}

export interface RetrievedChunk {
  id: number;
  project_name: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, unknown>;
  similarity: number;
}

let _pinecone: Pinecone | null = null;

function getPinecone(): Pinecone {
  if (_pinecone) return _pinecone;

  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing PINECONE_API_KEY environment variable");
  }

  _pinecone = new Pinecone({ apiKey });
  return _pinecone;
}

function getIndex() {
  const indexName = process.env.PINECONE_INDEX_NAME;
  const namespace = process.env.PINECONE_NAMESPACE || "portfolio";

  if (!indexName) {
    throw new Error("Missing PINECONE_INDEX_NAME environment variable");
  }

  return getPinecone().index(indexName).namespace(namespace);
}

export async function searchProjectEmbeddings(
  queryText: string,
  matchCount: number = 5,
  matchThreshold: number = 0.5,
  filter?: object
): Promise<RetrievedChunk[]> {
  const response = await getIndex().searchRecords({
    query: {
      topK: matchCount,
      inputs: { text: queryText },
      filter,
    },
    fields: ["text", "project_name", "chunk_index", "source_file", "record_type"],
  });

  return response.result.hits
    .map((hit, index) => {
      const fields = hit.fields as PineconeRecordFields;

      return {
        id: index,
        project_name: fields.project_name ?? "Unknown Project",
        content: fields.text ?? "",
        chunk_index: fields.chunk_index ?? 0,
        metadata: {
          source_file: fields.source_file,
          record_type: fields.record_type,
        },
        similarity: hit._score,
      };
    })
    .filter((hit) => hit.similarity >= matchThreshold);
}
