import fs from "fs/promises";
import path from "path";
import { chunkBySection, PERSONAL_INFO_PROJECT_NAME } from "./project-content.js";

/**
 * Loads the section-chunked knowledge files in project-descriptions/knowledge.
 * Each `## Heading` is one chunk, carrying the JSON metadata from the
 * `<!-- meta: {...} -->` line under it.
 */

/** Catalog ids from my-app/src/lib/projects.ts, keyed by knowledge file slug. */
export const PROJECT_IDS: Record<string, number> = {
  selahnote: 1,
  ontract: 5,
  "sentio-plus": 6,
  yarnscript: 8,
  soundsnag: 9,
  "selahnote-creator-dashboard": 10,
  "v1-prodbot": 11,
};

export interface KnowledgeChunk {
  id: string;
  text: string;
  recordType: "project" | "personal_info";
  projectName: string;
  projectId: number;
  slug: string;
  section: string;
  category: string;
  technologies: string[];
  chunkIndex: number;
  sourceFile: string;
}

function parseFrontmatter(raw: string): { fields: Record<string, string>; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  if (!match) return { fields: {}, body: raw };
  const fields: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const at = line.indexOf(":");
    if (at > 0) fields[line.slice(0, at).trim()] = line.slice(at + 1).trim().replace(/^"|"$/g, "");
  }
  return { fields, body: raw.slice(match[0].length) };
}

const META = /<!--\s*meta:\s*(\{[\s\S]*?\})\s*-->/;

export function parseKnowledgeFile(raw: string, sourceFile: string): KnowledgeChunk[] {
  const { fields, body } = parseFrontmatter(raw);
  const slug = fields.slug ?? path.basename(sourceFile, ".md");
  const projectName = fields.project ?? slug;
  const projectId = PROJECT_IDS[slug];
  if (projectId === undefined) throw new Error(`No catalog id for knowledge file ${sourceFile}`);

  return body
    .split(/\n(?=## )/)
    .filter((part) => part.startsWith("## "))
    .map((part, chunkIndex) => {
      const [headingLine, ...rest] = part.split("\n");
      const section = headingLine.replace(/^##\s+/, "").trim();
      let meta: { category?: string; technologies?: string[] } = {};
      const metaMatch = META.exec(part);
      if (metaMatch) {
        try {
          meta = JSON.parse(metaMatch[1]);
        } catch {
          meta = {};
        }
      }
      const content = rest.join("\n").replace(META, "").trim();
      return {
        id: `${slug}:${chunkIndex}`,
        text: `${projectName} — ${section}\n\n${content}`,
        recordType: "project" as const,
        projectName,
        projectId,
        slug,
        section,
        category: meta.category ?? "general",
        technologies: (meta.technologies ?? []).slice(0, 40),
        chunkIndex,
        sourceFile,
      };
    })
    .filter((chunk) => chunk.text.length > 80);
}

export async function loadKnowledgeChunks(descriptionsDir: string): Promise<KnowledgeChunk[]> {
  const knowledgeDir = path.join(descriptionsDir, "knowledge");
  const files = (await fs.readdir(knowledgeDir)).filter((f) => f.endsWith(".md") && f !== "README.md").sort();

  const projectChunks = (
    await Promise.all(
      files.map(async (file) => parseKnowledgeFile(await fs.readFile(path.join(knowledgeDir, file), "utf-8"), file))
    )
  ).flat();

  const personal = await fs.readFile(path.join(descriptionsDir, "personal-info.txt"), "utf-8");
  const personalChunks: KnowledgeChunk[] = chunkBySection(personal).map((content, chunkIndex) => {
    const heading = /^([A-Z][A-Z &/()'-]+):/.exec(content)?.[1] ?? "Background";
    return {
      id: `personal-info:${chunkIndex}`,
      text: `Kyle-Anthony Hay — ${heading}\n\n${content}`,
      recordType: "personal_info",
      projectName: PERSONAL_INFO_PROJECT_NAME,
      projectId: 0,
      slug: "personal-info",
      section: heading,
      category: "background",
      technologies: [],
      chunkIndex,
      sourceFile: "personal-info.txt",
    };
  });

  return [...projectChunks, ...personalChunks];
}
