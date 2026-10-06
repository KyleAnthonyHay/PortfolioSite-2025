import { randomBytes } from 'crypto';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import type { StoredBrief } from './types';

/**
 * Briefs live in the portfolio's Convex project (convex/recruiterBriefs.ts),
 * so share links survive deploys. Saving needs BRIEF_WRITE_KEY, which only
 * the server has; reading needs the brief's unguessable id.
 */

const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Ten characters from an unambiguous alphabet: unguessable enough for an unlisted link. */
export function newPublicId(): string {
  const bytes = randomBytes(10);
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

let client: ConvexHttpClient | null = null;
function convex(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL is not set');
  client ??= new ConvexHttpClient(url);
  return client;
}

function validId(publicId: string): boolean {
  return /^[A-Za-z0-9]{6,32}$/.test(publicId);
}

export async function saveBrief(brief: StoredBrief): Promise<void> {
  const key = process.env.BRIEF_WRITE_KEY;
  if (!key) throw new Error('BRIEF_WRITE_KEY is not set');
  if (!validId(brief.publicId)) throw new Error('Invalid brief id');
  await convex().mutation(api.recruiterBriefs.save, { key, ...brief });
}

export async function getBrief(publicId: string): Promise<StoredBrief | null> {
  if (!validId(publicId)) return null;
  try {
    return ((await convex().query(api.recruiterBriefs.get, { publicId })) as StoredBrief | null) ?? null;
  } catch (error) {
    console.error('recruiter brief: could not load', publicId, error);
    return null;
  }
}
