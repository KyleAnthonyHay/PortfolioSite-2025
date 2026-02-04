import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { generateEmbeddings } from "../lib/openai.js";
import {
  clearProjectEmbeddings,
  insertProjectEmbeddings,
  type ProjectEmbedding,
} from "../lib/supabase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESCRIPTIONS_DIR = path.join(__dirname, "../../project-descriptions");
const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

function extractProjectName(filename: string): string {
  return filename
    .replace(".txt", "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);

    if (end < text.length) {
      const lastNewline = chunk.lastIndexOf("\n\n");
      if (lastNewline > chunkSize / 2) {
        chunk = chunk.slice(0, lastNewline);
      }
    }

    chunks.push(chunk.trim());
    start = start + chunk.length - overlap;

    if (start >= text.length - overlap) break;
  }

  return chunks.filter((c) => c.length > 50);
}

async function readProjectDescriptions(): Promise<
  { filename: string; content: string }[]
> {
  const files = await fs.readdir(DESCRIPTIONS_DIR);
  const txtFiles = files.filter((f) => f.endsWith(".txt"));

  const descriptions = await Promise.all(
    txtFiles.map(async (filename) => {
      const filepath = path.join(DESCRIPTIONS_DIR, filename);
      const content = await fs.readFile(filepath, "utf-8");
      return { filename, content };
    })
  );

  return descriptions;
}

async function main() {
  console.log("🚀 Starting project embeddings seed...\n");

  console.log("📖 Reading project descriptions...");
  const descriptions = await readProjectDescriptions();
  console.log(`   Found ${descriptions.length} project files\n`);

  console.log("🧹 Clearing existing embeddings...");
  await clearProjectEmbeddings();
  console.log("   Done\n");

  const allChunks: { projectName: string; chunk: string; index: number }[] = [];

  for (const { filename, content } of descriptions) {
    const projectName = extractProjectName(filename);
    const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP);

    console.log(`📄 ${projectName}: ${chunks.length} chunks`);

    chunks.forEach((chunk, index) => {
      allChunks.push({ projectName, chunk, index });
    });
  }

  console.log(`\n📊 Total chunks to embed: ${allChunks.length}`);
  console.log("🔄 Generating embeddings (this may take a moment)...\n");

  const BATCH_SIZE = 20;
  const embeddings: Omit<ProjectEmbedding, "id">[] = [];

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.chunk);

    console.log(
      `   Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allChunks.length / BATCH_SIZE)}...`
    );

    const batchEmbeddings = await generateEmbeddings(texts);

    for (let j = 0; j < batch.length; j++) {
      embeddings.push({
        project_name: batch[j].projectName,
        content: batch[j].chunk,
        chunk_index: batch[j].index,
        metadata: {
          source_file: descriptions.find(
            (d) => extractProjectName(d.filename) === batch[j].projectName
          )?.filename,
        },
        embedding: batchEmbeddings[j],
      });
    }
  }

  console.log("\n💾 Inserting embeddings into Supabase...");
  await insertProjectEmbeddings(embeddings);

  console.log(`\n✅ Successfully seeded ${embeddings.length} embeddings!`);
  console.log("   Projects indexed:");
  const projectCounts = embeddings.reduce(
    (acc, e) => {
      acc[e.project_name] = (acc[e.project_name] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  Object.entries(projectCounts).forEach(([name, count]) => {
    console.log(`   - ${name}: ${count} chunks`);
  });
}

main().catch(console.error);
