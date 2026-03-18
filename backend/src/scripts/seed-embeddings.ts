import path from "path";
import { fileURLToPath } from "url";
import {
  loadPortfolioChunks,
  PERSONAL_INFO_PROJECT_NAME,
} from "../lib/project-content.js";
import {
  clearProjectEmbeddings,
  insertProjectEmbeddings,
  type PineconeProjectRecord,
} from "../lib/pinecone.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESCRIPTIONS_DIR = path.join(__dirname, "../../project-descriptions");
const BATCH_SIZE = 96;

async function main() {
  console.log("Starting Pinecone indexing...\n");

  console.log("Reading project descriptions...");
  const chunks = await loadPortfolioChunks(DESCRIPTIONS_DIR);
  console.log(`   Found ${chunks.length} chunks\n`);

  console.log("Clearing existing Pinecone namespace...");
  await clearProjectEmbeddings();
  console.log("   Done\n");

  console.log("Upserting records into Pinecone...\n");

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const records: PineconeProjectRecord[] = batch.map((chunk) => ({
      id: chunk.id,
      text: chunk.content,
      project_name: chunk.projectName,
      chunk_index: chunk.chunkIndex,
      source_file: chunk.sourceFile,
      record_type: chunk.recordType,
    }));

    console.log(
      `   Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}...`
    );

    await insertProjectEmbeddings(records);
  }

  console.log(`\nIndexed ${chunks.length} records successfully.`);
  console.log("   Projects indexed:");

  const projectCounts = chunks.reduce(
    (acc, chunk) => {
      acc[chunk.projectName] = (acc[chunk.projectName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  Object.entries(projectCounts).forEach(([name, count]) => {
    const label =
      name === PERSONAL_INFO_PROJECT_NAME ? `${name} (section-based)` : name;
    console.log(`   - ${label}: ${count} chunks`);
  });
}

main().catch(console.error);
