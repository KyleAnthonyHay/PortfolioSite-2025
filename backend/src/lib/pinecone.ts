import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";

export interface PineconeProjectRecord {
  [key: string]: string | number | boolean | string[];
  id: string;
  text: string;
  project_name: string;
  chunk_index: number;
  source_file: string;
  record_type: "project" | "personal_info";
}

const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX_NAME;
const namespace = process.env.PINECONE_NAMESPACE || "portfolio";

if (!apiKey || !indexName) {
  throw new Error("Missing Pinecone environment variables");
}

const pinecone = new Pinecone({ apiKey });

function getBaseIndex() {
  if (!indexName) {
    throw new Error("Missing PINECONE_INDEX_NAME environment variable");
  }

  return pinecone.index(indexName);
}

function getIndex() {
  return getBaseIndex().namespace(namespace);
}

export async function clearProjectEmbeddings() {
  try {
    await getBaseIndex().deleteNamespace(namespace);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "PineconeNotFoundError"
    ) {
      return;
    }

    throw error;
  }
}

export async function insertProjectEmbeddings(
  records: PineconeProjectRecord[]
) {
  await getIndex().upsertRecords({ records });
}
