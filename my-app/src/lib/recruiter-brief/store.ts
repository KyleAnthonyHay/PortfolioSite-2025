import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import type { StoredBrief } from './types';

/**
 * Where briefs live. The portfolio has no database yet, so this writes one
 * JSON file per brief under my-app/.data/recruiter-briefs. That persists on a
 * local or long-running server but not on Vercel, whose filesystem is
 * read-only and per-request. Moving to Convex means reimplementing these two
 * functions against a recruiterBriefs table with the same fields.
 */
const dir = process.env.RECRUITER_BRIEF_DIR || path.resolve(process.cwd(), '.data/recruiter-briefs');

const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Ten characters from an unambiguous alphabet: unguessable enough for an unlisted link. */
export function newPublicId(): string {
  const bytes = randomBytes(10);
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

function fileFor(publicId: string): string | null {
  return /^[A-Za-z0-9]{6,32}$/.test(publicId) ? path.join(dir, `${publicId}.json`) : null;
}

export async function saveBrief(brief: StoredBrief): Promise<void> {
  const file = fileFor(brief.publicId);
  if (!file) throw new Error('Invalid brief id');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify(brief, null, 2), 'utf-8');
}

export async function getBrief(publicId: string): Promise<StoredBrief | null> {
  const file = fileFor(publicId);
  if (!file) return null;
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8')) as StoredBrief;
  } catch {
    return null;
  }
}
