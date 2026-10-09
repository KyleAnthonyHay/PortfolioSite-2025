import type { VisitorContext, Widget } from './chat-events';
import { describeVisitor, escapeHtml } from './email';
import { briefTitle, SITE_URL, type BriefView } from './recruiter-brief/view';

// FitReportWidget's emerald, muted purple and zinc palette, with inline styles and
// presentation tables so the card also reads well in Gmail and Outlook.
const statuses = {
  match: { label: 'Match', color: '#047857', background: '#ecfdf5' },
  related: { label: 'Related', color: '#6b4f8a', background: '#f3eff8' },
  gap: { label: 'Gap', color: '#71717a', background: '#f4f4f5' },
} as const;

function shell(title: string, context: VisitorContext | undefined, card: string, note: string): string {
  return `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:24px 12px;background:#fafafa;color:#18181b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto"><tr><td>
<p style="margin:0 0 8px;font-size:10px;letter-spacing:1.6px;color:#a1a1aa;text-transform:uppercase">Kyle-Anthony Hay / Portfolio agent</p>
<h1 style="margin:0 0 6px;font-size:22px;font-weight:600;letter-spacing:-0.5px">${escapeHtml(title)}</h1>
<p style="margin:0 0 20px;font-size:12px;color:#71717a">Visitor: ${escapeHtml(describeVisitor(context))}</p>
${card}
<p style="margin:16px 0 0;font-size:12px;color:#71717a">${escapeHtml(note)} Visitors stay anonymous unless they also leave you a note.</p>
<p style="margin:20px 0 0;font-size:11px"><a href="${escapeHtml(SITE_URL)}" style="color:#a1a1aa;text-decoration:none">kyleanthonyhay.com</a></p>
</td></tr></table></body></html>`;
}

const cardStyle = 'width:100%;border:1px solid #e4e4e7;border-radius:16px;background:#ffffff;border-spacing:0;overflow:hidden';
const eyebrowStyle = 'margin:0 0 3px;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:1.5px;color:#a1a1aa';

function postingLink(url?: string): string {
  if (!url || !/^https?:\/\//i.test(url)) return '';
  return `<p style="margin:8px 0 12px;font-size:12px;color:#71717a;overflow-wrap:anywhere"><strong>Job posting:</strong> <a href="${escapeHtml(url)}" style="color:#047857;text-decoration:underline;word-break:break-all">${escapeHtml(url)}</a></p>`;
}

export function fitReportEmailHtml(report: Extract<Widget, { kind: 'fit_report' }>, context: VisitorContext | undefined, note: string): string {
  const badges = (['match', 'related', 'gap'] as const).map((status) => {
    const meta = statuses[status];
    return `<span style="display:inline-block;margin:0 5px 4px 0;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:500;background:${meta.background};color:${meta.color}">${report.summary[status]} ${meta.label.toLowerCase()}</span>`;
  }).join('');
  const rows = report.requirements.map((row) => {
    const meta = { ...statuses[row.status], label: row.verificationStatus === 'unknown' ? 'Needs review' : statuses[row.status].label };
    const projects = row.projects.map((project) => `<a href="${escapeHtml(new URL(project.href, SITE_URL).href)}" style="display:inline-block;margin:6px 4px 0 0;padding:2px 8px;border:1px solid #e4e4e7;border-radius:999px;font-size:11px;color:#52525b;text-decoration:none">${escapeHtml(project.title)}</a>`).join('');
    return `<tr><td style="padding:14px 16px;border-top:1px solid #f4f4f5">
<span style="display:inline-block;padding:1px 7px;margin-bottom:5px;border-radius:999px;background:${meta.background};color:${meta.color};font-size:10px;font-weight:600">${meta.label}</span>
<p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#18181b">${escapeHtml(row.requirement)}</p>
<p style="margin:0;font-size:12px;line-height:1.65;color:#71717a">${escapeHtml(row.evidence)}</p>${projects}</td></tr>`;
  }).join('');
  const card = `<table role="presentation" cellpadding="0" cellspacing="0" style="${cardStyle}"><tr><td style="padding:16px">
<p style="${eyebrowStyle}">Fit report</p><h2 style="margin:0 0 10px;font-size:16px;font-weight:600">${escapeHtml(report.role || context?.role || 'Unspecified role')}</h2>${postingLink(report.jobUrl)}${badges}</td></tr>${rows}</table>`;
  return shell('Someone just ran a fit check', context, card, note);
}

export function recruiterBriefEmailHtml(view: BriefView, context: VisitorContext | undefined, note: string, jobUrl?: string): string {
  const { recommendation } = view.brief;
  const url = `${SITE_URL}/brief/${encodeURIComponent(view.publicId)}`;
  const card = `<table role="presentation" cellpadding="0" cellspacing="0" style="${cardStyle}"><tr><td style="padding:20px">
<p style="${eyebrowStyle}">Recruiter brief</p><h2 style="margin:0 0 12px;font-size:18px;font-weight:600">${escapeHtml(briefTitle(view))}</h2>
${postingLink(jobUrl)}
<p style="margin:0 0 8px;font-size:14px;font-weight:600">${escapeHtml(recommendation.nextStep)}</p>
<p style="margin:0 0 20px;font-size:13px;color:#71717a">${escapeHtml(recommendation.rationale)}</p>
<a href="${escapeHtml(url)}" style="display:inline-block;padding:9px 16px;background:#18181b;color:#ffffff;border-radius:999px;font-size:13px;font-weight:500;text-decoration:none">Open recruiter brief</a>
</td></tr></table>`;
  return shell('Someone created a recruiter brief', context, card, note);
}
