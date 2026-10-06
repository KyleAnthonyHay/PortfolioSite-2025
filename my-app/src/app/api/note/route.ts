import { NextRequest } from 'next/server';
import { describeVisitor, emailKyle, escapeHtml, isEmailConfigured, simpleEmailHtml, transcriptMarkdown } from '@/lib/email';
import { sanitizeContext, sanitizeHistory } from '@/lib/chat-request';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

/** A few notes an hour per address is plenty for a person and little for a script. */
function allow(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) return false;
  recent.set(ip, [...hits, now]);
  return true;
}

/**
 * The note card's Send button: emails the visitor's message to Kyle-Anthony,
 * reply-to set to the visitor, with the chat so far attached.
 */
export async function POST(request: NextRequest) {
  if (!isEmailConfigured()) return Response.json({ error: 'not_configured' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Bots fill every field; people never see this one.
  if (typeof body.website === 'string' && body.website.trim()) return Response.json({ ok: true });

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : '';
  if (!EMAIL_PATTERN.test(email)) return Response.json({ error: 'invalid_email' }, { status: 400 });
  if (message.length < 2) return Response.json({ error: 'empty_message' }, { status: 400 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!allow(ip)) return Response.json({ error: 'rate_limited' }, { status: 429 });

  const context = sanitizeContext(body.context);
  const transcript = body.includeTranscript === false ? [] : sanitizeHistory(body.transcript, 40);
  const from = name ? `${name} <${email}>` : email;

  const result = await emailKyle({
    subject: `Note from ${name || email} via your portfolio agent`,
    replyTo: email,
    text: `${message}\n\nFrom: ${from}\nVisitor: ${describeVisitor(context)}${transcript.length > 0 ? '\n\nThe chat is attached.' : ''}`,
    html: simpleEmailHtml(
      'A visitor left you a note',
      [
        ['From', from],
        ['Visitor', describeVisitor(context)],
        ['Transcript', transcript.length > 0 ? `Attached (${transcript.length} messages)` : 'Not included'],
      ],
      `<div style="white-space:pre-wrap;border-left:3px solid #e4e4e7;padding:4px 0 4px 12px">${escapeHtml(message)}</div>
<p style="color:#71717a;font-size:12px;margin-top:16px">Reply to this email to answer ${escapeHtml(name || email)} directly.</p>`
    ),
    attachments: transcript.length > 0 ? [{ filename: 'chat-transcript.md', content: transcriptMarkdown(transcript, context) }] : undefined,
  });

  if (!result.ok) return Response.json({ error: 'send_failed' }, { status: 502 });
  return Response.json({ ok: true });
}
