/**
 * Whether a GitHub repository can be opened by anyone. A private or deleted
 * repo answers 404 to an anonymous request, so the agent must not hand its
 * link to a visitor. Answers are cached for a few hours; the anonymous API
 * allows 60 requests an hour, which this stays well under.
 */
const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { isPublic: boolean; checkedAt: number }>();

const REPO_URL = /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?(?:[#?].*)?$/;

export function isGitHubRepoUrl(url: string): boolean {
  return REPO_URL.test(url);
}

export async function isPublicRepo(url: string): Promise<boolean> {
  const match = REPO_URL.exec(url);
  if (!match) return false;
  const key = `${match[1]}/${match[2]}`.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.checkedAt < TTL_MS) return hit.isPublic;

  let isPublic = false;
  try {
    const token = process.env.GITHUB_TOKEN;
    const response = await fetch(`https://api.github.com/repos/${match[1]}/${match[2]}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'kyleanthonyhay.com', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      const data = (await response.json()) as { private?: boolean; visibility?: string };
      isPublic = data.private === false || data.visibility === 'public';
    } else if (response.status !== 404 && response.status !== 403) {
      // An outage or rate limit says nothing about visibility: keep the last answer, if any.
      return hit?.isPublic ?? false;
    }
  } catch {
    return hit?.isPublic ?? false;
  }
  cache.set(key, { isPublic, checkedAt: Date.now() });
  return isPublic;
}
