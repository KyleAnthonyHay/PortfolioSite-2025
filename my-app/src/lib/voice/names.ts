import { catalog } from '../project-catalog';

/**
 * Speech recognition hears "SelahNote" as "Ceyl Note" or "Sela note", and
 * the agent then finds no such project. Before a spoken question reaches the
 * agent, runs of one to three words that sound like a project name are
 * replaced with the name itself.
 */

/** A rough sound-alike key: letters only, soft c as s, silent h dropped, vowel pairs and doubles collapsed. */
function soundKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/z/g, 's')
    .replace(/(?!^)h/g, '')
    .replace(/y/g, 'i')
    .replace(/(ei|ai|ea|ee)/g, 'e')
    .replace(/(.)\1+/g, '$1');
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

/** Ordinary words that sound like a project name on their own. */
const ORDINARY = new Set(['contract', 'contracts', 'contact', 'sound', 'script', 'scripts', 'note', 'notes', 'country', 'sentient', 'yarn']);
/** A name never starts or ends on these. */
const GLUE = new Set(['a', 'an', 'the', 'about', 'me', 'of', 'to', 'is', 'his', 'he', 'and', 'in', 'for', 'with', 'app']);

const names = catalog.flatMap((project) =>
  [project.title, ...project.aliases].map((alias) => ({ title: project.title, key: soundKey(alias) })).filter((name) => name.key.length >= 6)
);

export function correctProjectNames(text: string): string {
  const words = text.split(/(\s+)/);
  // Indices of the actual words in the split (odd entries are whitespace).
  const tokens = words.map((word, index) => ({ word, index })).filter(({ word }) => word.trim());
  for (let start = 0; start < tokens.length; start += 1) {
    for (let size = 3; size >= 1; size -= 1) {
      const window = tokens.slice(start, start + size);
      if (window.length < size) continue;
      const bare = (word: string) => word.toLowerCase().replace(/[^a-z]/g, '');
      if (size > 1 && (GLUE.has(bare(window[0].word)) || GLUE.has(bare(window[window.length - 1].word)))) continue;
      const raw = window.map((t) => t.word).join(' ');
      const key = soundKey(raw);
      if (key.length < 5) continue;
      if (size === 1 && ORDINARY.has(raw.toLowerCase().replace(/[^a-z]/g, ''))) continue;
      const allowed = size === 1 ? 1 : Math.max(1, Math.floor(key.length * 0.25));
      const match = names.find((name) => distance(key, name.key) <= allowed);
      if (!match) continue;
      const trailing = /[^\w]+$/.exec(window[window.length - 1].word)?.[0] ?? '';
      if (raw.replace(/[^\w]+$/, '') === match.title) break;
      words[window[0].index] = match.title + trailing;
      for (const t of window.slice(1)) words[t.index] = '';
      // Drop the whitespace between the merged words.
      for (let i = window[0].index + 1; i <= window[window.length - 1].index; i += 1) if (!words[i].trim()) words[i] = '';
      start += size - 1;
      break;
    }
  }
  return words.join('');
}
