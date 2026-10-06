import path from "path";
import { fileURLToPath } from "url";
import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";
import { loadKnowledgeChunks } from "../lib/knowledge.js";

/**
 * Seeds the section-chunked knowledge base (project-descriptions/knowledge/*.md
 * plus personal-info.txt) into its own namespace, so the older "portfolio"
 * namespace stays intact until the site has fully switched over.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESCRIPTIONS_DIR = path.join(__dirname, "../../project-descriptions");
const NAMESPACE = process.env.PINECONE_KNOWLEDGE_NAMESPACE || "knowledge";
const BATCH_SIZE = 90;

async function main() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;
  if (!apiKey || !indexName) throw new Error("Missing Pinecone environment variables");

  const chunks = await loadKnowledgeChunks(DESCRIPTIONS_DIR);
  console.log(`Loaded ${chunks.length} chunks`);

  const pinecone = new Pinecone({ apiKey });
  const base = pinecone.index(indexName);
  try {
    await base.deleteNamespace(NAMESPACE);
    console.log(`Cleared namespace "${NAMESPACE}"`);
  } catch {
    // First run: nothing to clear.
  }
  const index = base.namespace(NAMESPACE);

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE).map((chunk) => ({
      id: chunk.id,
      text: chunk.text,
      record_type: chunk.recordType,
      project_name: chunk.projectName,
      project_id: chunk.projectId,
      slug: chunk.slug,
      section: chunk.section,
      category: chunk.category,
      technologies: chunk.technologies,
      chunk_index: chunk.chunkIndex,
      source_file: chunk.sourceFile,
    }));
    await index.upsertRecords({ records: batch });
    console.log(`Upserted ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}`);
  }

  const counts = chunks.reduce<Record<string, number>>((acc, chunk) => {
    acc[chunk.projectName] = (acc[chunk.projectName] ?? 0) + 1;
    return acc;
  }, {});
  Object.entries(counts).forEach(([name, count]) => console.log(`  ${name}: ${count}`));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
