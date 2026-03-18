import fs from "fs/promises";
import path from "path";

export const CHUNK_SIZE = 1500;
export const CHUNK_OVERLAP = 200;
export const PERSONAL_INFO_PROJECT_NAME = "Personal Info";

export type RecordType = "project" | "personal_info";

export interface PortfolioDocument {
  projectName: string;
  sourceFile: string;
  fullContent: string;
  chunks: PortfolioChunk[];
  recordType: RecordType;
}

export interface PortfolioChunk {
  id: string;
  projectName: string;
  content: string;
  chunkIndex: number;
  sourceFile: string;
  recordType: RecordType;
}

export function extractProjectName(filename: string): string {
  return filename
    .replace(".txt", "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): string[] {
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

  return chunks.filter((chunk) => chunk.length > 50);
}

export function chunkBySection(text: string): string[] {
  return text
    .split(/\n---\n/)
    .map((section) => section.trim())
    .filter((section) => section.length > 50);
}

export async function loadPortfolioDocuments(
  descriptionsDir: string
): Promise<PortfolioDocument[]> {
  const files = await fs.readdir(descriptionsDir);
  const txtFiles = files.filter((file) => file.endsWith(".txt")).sort();

  return Promise.all(
    txtFiles.map(async (filename) => {
      const filepath = path.join(descriptionsDir, filename);
      const fullContent = await fs.readFile(filepath, "utf-8");
      const projectName = extractProjectName(filename);
      const isPersonalInfo = filename === "personal-info.txt";
      const recordType: RecordType = isPersonalInfo ? "personal_info" : "project";
      const rawChunks = isPersonalInfo
        ? chunkBySection(fullContent)
        : chunkText(fullContent);

      const chunks = rawChunks.map((content, chunkIndex) => ({
        id: `${projectName}:${chunkIndex}`,
        projectName,
        content,
        chunkIndex,
        sourceFile: filename,
        recordType,
      }));

      return {
        projectName,
        sourceFile: filename,
        fullContent,
        chunks,
        recordType,
      };
    })
  );
}

export async function loadPortfolioChunks(
  descriptionsDir: string
): Promise<PortfolioChunk[]> {
  const documents = await loadPortfolioDocuments(descriptionsDir);
  return documents.flatMap((document) => document.chunks);
}
