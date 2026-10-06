'use client';

import ReactMarkdown from 'react-markdown';
import { mentionAliases } from '@/lib/project-catalog';
import ProjectMention from './ProjectMention';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const MENTION_PATTERN = new RegExp(
  `(^|[^\\w\\[/])(${mentionAliases.map(({ alias }) => escapeRegExp(alias)).join('|')})(?=[^\\w+]|$)`,
  'g'
);
const aliasToId = new Map(mentionAliases.map(({ alias, id }) => [alias, id]));

/**
 * Turns bare project names in the model's prose into `project:` links so
 * they render as hover cards. Code spans and existing links are left alone.
 */
function linkifyProjects(markdown: string): string {
  const segments = markdown.split(/(```[\s\S]*?```|`[^`\n]*`|\[[^\]\n]*\]\([^)\n]*\))/g);
  return segments
    .map((segment, index) =>
      index % 2 === 1
        ? segment
        : segment.replace(MENTION_PATTERN, (_match, before: string, alias: string) => {
            const id = aliasToId.get(alias);
            return id ? `${before}[${alias}](project:${id})` : `${before}${alias}`;
          })
    )
    .join('');
}

export default function Markdown({ content, streaming = false }: { content: string; streaming?: boolean }) {
  return (
    <div className="chat-prose" data-streaming={streaming}>
      <ReactMarkdown
        urlTransform={(url) => url}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0 text-[15.5px] leading-[1.7] text-zinc-800">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 last:mb-0 pl-5 list-disc space-y-1 marker:text-zinc-300">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 last:mb-0 pl-5 list-decimal space-y-1 marker:text-zinc-400">{children}</ol>,
          li: ({ children }) => <li className="text-[15.5px] leading-[1.7] text-zinc-800 pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => <p className="mb-2 text-[15px] font-semibold text-zinc-900">{children}</p>,
          h2: ({ children }) => <p className="mb-2 text-[15px] font-semibold text-zinc-900">{children}</p>,
          h3: ({ children }) => <p className="mb-1 text-[15px] font-semibold text-zinc-900">{children}</p>,
          hr: () => <hr className="my-4 border-zinc-100" />,
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-zinc-200 pl-3 text-zinc-500">{children}</blockquote>
          ),
          code: ({ children, className }) =>
            className ? (
              <code className={className}>{children}</code>
            ) : (
              <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] text-zinc-800">{children}</code>
            ),
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-xl bg-zinc-900 p-4 font-mono text-xs leading-relaxed text-zinc-100">
              {children}
            </pre>
          ),
          a: ({ href, children }) => {
            if (href?.startsWith('project:')) {
              const id = Number(href.slice('project:'.length));
              return <ProjectMention id={id}>{children}</ProjectMention>;
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-[3px] hover:decoration-zinc-900"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {linkifyProjects(content)}
      </ReactMarkdown>
    </div>
  );
}
