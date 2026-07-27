/**
 * Which projects have a showcase. Kept in a plain module (no 'use client') so
 * the server-rendered project page can branch on it — a function exported from
 * a client module can only be rendered, not called, from the server.
 */
export const SHOWCASE_PROJECT_IDS = [1, 2, 3, 4, 5, 6, 7] as const;

export function hasShowcase(projectId: number) {
  return (SHOWCASE_PROJECT_IDS as readonly number[]).includes(projectId);
}
