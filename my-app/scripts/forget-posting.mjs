// Forget saved posting extractions (Convex postingExtractions) so they are extracted again.
// npm run postings:forget -- regal        (role or company contains "regal")
// npm run postings:forget -- --all
// Uses NEXT_PUBLIC_CONVEX_URL and BRIEF_WRITE_KEY from .env.local, so it acts on that deployment.
import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';

const match = process.argv[2];
const { NEXT_PUBLIC_CONVEX_URL: url, BRIEF_WRITE_KEY: key } = process.env;
if (!match || !url || !key) {
  console.log('Usage: npm run postings:forget -- <role or company> | --all (needs NEXT_PUBLIC_CONVEX_URL and BRIEF_WRITE_KEY)');
  process.exit(1);
}
const forgotten = await new ConvexHttpClient(url).mutation(anyApi.postings.forget, { key, match });
console.log(forgotten.length ? `Forgot: ${forgotten.join(', ')}` : 'No saved posting matched.');
