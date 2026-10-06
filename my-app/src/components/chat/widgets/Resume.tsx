'use client';

import { ArrowUpRight, Download, FileText } from 'lucide-react';
import type { Widget } from '@/lib/chat-events';

/**
 * Résumé card. "View" opens the /resume page, which embeds the PDF so it
 * renders even for browsers set to download PDFs; "Download" saves the file.
 */
export function ResumeWidget({ widget }: { widget: Extract<Widget, { kind: 'resume' }> }) {
  const { name, headline, viewUrl, downloadUrl, pages, size } = widget;
  const facts = ['PDF', pages ? `${pages} ${pages === 1 ? 'page' : 'pages'}` : null, size].filter(Boolean).join(' · ');

  return (
    <div className="w-full max-w-[420px] overflow-hidden agent-card">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <FileText className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">{name}&apos;s résumé</p>
          <p className="text-xs text-zinc-500">
            {headline} · {facts}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-zinc-100 px-4 py-2.5">
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800"
        >
          View résumé
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
        <a
          href={downloadUrl}
          download="Kyle-Anthony_Hay_Resume.pdf"
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </a>
      </div>
    </div>
  );
}
