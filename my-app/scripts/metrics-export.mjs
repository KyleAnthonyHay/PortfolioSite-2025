/** Saves the agent's metric rows as JSON for the dashboard: node --env-file=.env.local scripts/metrics-export.mjs [days] [out.json] */
import { writeFileSync } from 'node:fs';
import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';

const days = Number(process.argv[2] ?? 30);
const out = process.argv[3] ?? 'agent-metrics.json';
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
const rows = await client.query(anyApi.metrics.since, { key: process.env.BRIEF_WRITE_KEY, since: Date.now() - days * 86_400_000 });
writeFileSync(out, JSON.stringify(rows.map(({ _id, _creationTime, ...row }) => row), null, 2));
console.log(`${rows.length} rows from ${process.env.NEXT_PUBLIC_CONVEX_URL} written to ${out}`);
