import fs from 'fs/promises';
import path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import { findProjectByName, type CatalogProject } from './project-catalog';

/**
 * The section-chunked knowledge base in backend/project-descriptions/knowledge.
 * Pinecone (namespace "knowledge", seeded by `npm run seed:knowledge` in
 * backend/) holds the same chunks for semantic search; the local files back
 * keyword evidence and full project reads.
 */

export interface KnowledgeSection {
  projectId: number;
  projectName: string;
  section: string;
  category: string;
  technologies: string[];
  text: string;
}

export interface KnowledgeHit extends KnowledgeSection {
  recordType: 'project' | 'personal_info';
  score: number;
}

const knowledgeDir =
  process.env.PORTFOLIO_KNOWLEDGE_DIR || path.resolve(process.cwd(), '../backend/project-descriptions/knowledge');
const NAMESPACE = process.env.PINECONE_KNOWLEDGE_NAMESPACE || 'knowledge';

const META = /<!--\s*meta:\s*(\{[\s\S]*?\})\s*-->/;

function parseFile(raw: string): KnowledgeSection[] {
  const front = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  const name = front ? /^project:\s*(.+)$/m.exec(front[1])?.[1].trim().replace(/^"|"$/g, '') : undefined;
  const project: CatalogProject | null = name ? findProjectByName(name) : null;
  if (!project) return [];
  const body = front ? raw.slice(front[0].length) : raw;

  return body
    .split(/\n(?=## )/)
    .filter((part) => part.startsWith('## '))
    .map((part) => {
      const [heading, ...rest] = part.split('\n');
      let meta: { category?: string; technologies?: string[] } = {};
      const match = META.exec(part);
      if (match) {
        try {
          meta = JSON.parse(match[1]);
        } catch {
          meta = {};
        }
      }
      return {
        projectId: project.id,
        projectName: project.title,
        section: heading.replace(/^##\s+/, '').trim(),
        category: meta.category ?? 'general',
        technologies: meta.technologies ?? [],
        text: rest.join('\n').replace(META, '').trim(),
      };
    });
}

let sectionsPromise: Promise<KnowledgeSection[]> | null = null;

export function getKnowledgeSections(): Promise<KnowledgeSection[]> {
  if (!sectionsPromise) {
    sectionsPromise = fs
      .readdir(knowledgeDir)
      .then((files) =>
        Promise.all(
          files
            .filter((file) => file.endsWith('.md') && file !== 'README.md')
            .sort()
            .map(async (file) => parseFile(await fs.readFile(path.join(knowledgeDir, file), 'utf-8')))
        )
      )
      .then((all) => all.flat())
      .catch((error) => {
        console.error('knowledge: could not read', knowledgeDir, error);
        sectionsPromise = null;
        return [];
      });
  }
  return sectionsPromise;
}

export async function getProjectSections(projectId: number): Promise<KnowledgeSection[]> {
  return (await getKnowledgeSections()).filter((section) => section.projectId === projectId);
}

let pinecone: Pinecone | null = null;

function knowledgeIndex() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;
  if (!apiKey || !indexName) throw new Error('Missing Pinecone environment variables');
  pinecone ??= new Pinecone({ apiKey });
  return pinecone.index(indexName).namespace(NAMESPACE);
}

interface HitFields {
  text?: string;
  record_type?: 'project' | 'personal_info';
  project_name?: string;
  project_id?: number;
  section?: string;
  category?: string;
  technologies?: string[];
}

/**
 * Dense semantic search over the knowledge chunks (llama-text-embed-v2,
 * cosine). Scores run roughly 0.15 (loosely related) to 0.6 (direct answer).
 * A reranker was tried and dropped: it scored broad recruiter questions such
 * as "deep learning" near zero across every chunk.
 */
export async function searchKnowledge(
  query: string,
  options: { projectId?: number; recordType?: 'project' | 'personal_info'; topK?: number; minScore?: number } = {}
): Promise<KnowledgeHit[]> {
  const { projectId, recordType, topK = 8, minScore = 0 } = options;
  const filter: Record<string, unknown> = {};
  if (projectId !== undefined) filter.project_id = { $eq: projectId };
  if (recordType) filter.record_type = { $eq: recordType };

  const response = await knowledgeIndex().searchRecords({
    query: {
      topK,
      inputs: { text: query },
      ...(Object.keys(filter).length > 0 ? { filter } : {}),
    },
    fields: ['text', 'record_type', 'project_name', 'project_id', 'section', 'category', 'technologies'],
  });

  return response.result.hits
    .map((hit) => {
      const fields = hit.fields as HitFields;
      const text = fields.text ?? '';
      return {
        recordType: fields.record_type ?? 'project',
        projectId: fields.project_id ?? 0,
        projectName: fields.project_name ?? '',
        section: fields.section ?? '',
        category: fields.category ?? '',
        technologies: fields.technologies ?? [],
        // Stored text starts with "Project — Section"; the reader only needs the body.
        text: text.replace(/^[^\n]*\n\n/, ''),
        score: hit._score,
      };
    })
    .filter((hit) => hit.score >= minScore);
}

export interface RawResource {
  type: string;
  title: string;
  url: string;
}

/** Links from <slug>.resources.json, keyed by catalog project id. */
export async function getProjectResources(projectId: number): Promise<RawResource[]> {
  try {
    const files = await fs.readdir(knowledgeDir);
    for (const file of files.filter((name) => name.endsWith('.md') && name !== 'README.md')) {
      const raw = await fs.readFile(path.join(knowledgeDir, file), 'utf-8');
      const name = /^project:\s*(.+)$/m.exec(raw)?.[1].trim().replace(/^"|"$/g, '');
      if (!name || findProjectByName(name)?.id !== projectId) continue;
      const resources = await fs
        .readFile(path.join(knowledgeDir, file.replace(/\.md$/, '.resources.json')), 'utf-8')
        .then((text) => JSON.parse(text) as RawResource[])
        .catch(() => [] as RawResource[]);
      return resources.filter((r) => typeof r.url === 'string' && /^https:\/\//.test(r.url));
    }
  } catch (error) {
    console.error('knowledge: could not read resources', error);
  }
  return [];
}
