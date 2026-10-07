// Bundle local TS/TSX as ESM so the existing PDF renderer's ESM dependencies
// behave as they do in Next.js. Generated output stays in ignored .data/.
import { build } from '../../backend/node_modules/esbuild/lib/main.js';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const outfile = path.resolve('.data/email-preview-run.mjs');
await build({ entryPoints: ['scripts/preview-emails.ts'], outfile, bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic', tsconfig: 'tsconfig.json' });
await import(pathToFileURL(outfile).href);
