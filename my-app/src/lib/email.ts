import { profile } from './profile';
import type { ConversationMessage, VisitorContext } from './chat-events';

/**
 * Email to Kyle-Anthony through Resend's REST API. Everything is behind
 * RESEND_API_KEY: without it, isEmailConfigured() is false, the note card
 * falls back to a mailto link, and fit checks go unannounced.
 *
 * RESEND_FROM must be on a domain verified in Resend. The default,
 * onboarding@resend.dev, works without a domain but only delivers to the
 * Resend account's own address, which is fine for mail to Kyle-Anthony.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface EmailAttachment {
  filename: string;
  content: string;
}

export async function emailKyle(message: {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'not_configured' };
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Kyle's Agent <onboarding@resend.dev>",
        to: [process.env.NOTIFY_EMAIL || profile.email],
        cc: [profile.emailCc].filter((email) => email !== (process.env.NOTIFY_EMAIL || profile.email)),
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo,
        attachments: message.attachments?.map((file) => ({
          filename: file.filename,
          content: Buffer.from(file.content, 'utf8').toString('base64'),
        })),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('Resend error', response.status, detail.slice(0, 300));
      return { ok: false, error: `resend_${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    console.error('Resend request failed', error);
    return { ok: false, error: 'network' };
  }
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function describeVisitor(context?: VisitorContext): string {
  if (!context) return 'Skipped the opening question';
  if (!context.hiring) return 'Just exploring';
  return `Hiring for ${context.role ?? 'an unnamed role'}${context.jobUrl ? ` (${context.jobUrl})` : ''}`;
}

/** The conversation as Markdown, for the attachment. */
export function transcriptMarkdown(messages: ConversationMessage[], context?: VisitorContext): string {
  const when = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' });
  const lines = [`# Chat with Kyle's Agent`, '', `- When: ${when} ET`, `- Visitor: ${describeVisitor(context)}`, ''];
  for (const message of messages) {
    lines.push(`## ${message.role === 'user' ? 'Visitor' : 'Agent'}`, '', message.content.trim(), '');
  }
  return lines.join('\n');
}

/** A small, plain HTML email: a heading, a few labelled rows, and an optional body. */
export function simpleEmailHtml(title: string, rows: [string, string][], body?: string): string {
  const rowHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#71717a;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:4px 0;color:#18181b">${escapeHtml(value)}</td></tr>`
    )
    .join('');
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:14px;line-height:1.55;color:#18181b;max-width:560px">
<h2 style="font-size:17px;margin:0 0 12px">${escapeHtml(title)}</h2>
<table style="border-collapse:collapse;margin-bottom:14px">${rowHtml}</table>
${body ?? ''}
</div>`;
}
