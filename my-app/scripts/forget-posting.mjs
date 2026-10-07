// Forget saved posting extractions so they are read fresh next time.
// npm run postings:forget -- regal        (role or company contains "regal")
// npm run postings:forget -- --all
import fs from 'fs/promises';
import path from 'path';

const dir = process.env.PORTFOLIO_POSTINGS_DIR || path.resolve(process.cwd(), '.cache/postings');
const term = process.argv[2]?.toLowerCase();
if (!term) {
  console.log('Usage: npm run postings:forget -- <role or company> | --all');
  process.exit(1);
}
const files = (await fs.readdir(dir).catch(() => [])).filter((name) => name.endsWith('.json'));
let removed = 0;
for (const name of files) {
  const file = path.join(dir, name);
  const { extracted } = JSON.parse(await fs.readFile(file, 'utf-8'));
  const label = `${extracted.roleTitle ?? ''} ${extracted.companyName ?? ''}`.trim();
  if (term === '--all' || label.toLowerCase().includes(term)) {
    await fs.unlink(file);
    console.log(`Forgot ${label || name}`);
    removed++;
  }
}
console.log(removed ? `${removed} posting(s) will be extracted again.` : 'No saved posting matched.');
process.exit(0);
