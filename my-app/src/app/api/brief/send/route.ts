import { NextResponse } from 'next/server';
import { isEmailConfigured, kyleInbox, sendEmail } from '@/lib/email';
import { profile } from '@/lib/profile';
import { briefForVisitorEmailHtml } from '@/lib/report-email';
import { getBrief, recordBriefRequest } from '@/lib/recruiter-brief/store';
import { briefText } from '@/lib/recruiter-brief/text';
import { briefTitle, toBriefView } from '@/lib/recruiter-brief/view';

/**
 * "Send me this": emails a brief to the visitor who asked for it and keeps
 * their address in Convex (briefRequests) as an opt-in, so Kyle-Anthony can
 * follow up. Kyle-Anthony is bcc'd. Without RESEND_API_KEY the address is
 * still saved and the visitor is told the email could not go out.
 */

const EMAIL = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[A-Za-z]{2,}$/;
const WINDOW_MS = 60 * 60 * 1000;
const PER_IP = 5;
const recent = new Map<string, number[]>();

function allowed(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  if (hits.length >= PER_IP) return false;
  recent.set(ip, [...hits, now]);
  if (recent.size > 1000) recent.delete(recent.keys().next().value!);
  return true;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { publicId?: unknown; email?: unknown } | null;
  const publicId = typeof body?.publicId === 'string' ? body.publicId : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL.test(email) || email.length > 254) return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!allowed(ip)) return NextResponse.json({ ok: false, error: 'Too many requests. Try again in a little while.' }, { status: 429 });

  const record = await getBrief(publicId);
  if (!record) return NextResponse.json({ ok: false, error: 'That brief could not be found.' }, { status: 404 });
  const view = toBriefView(record);
  const origin = new URL(request.url).origin;
  const url = `${origin}/brief/${encodeURIComponent(view.publicId)}`;

  let sent = false;
  if (isEmailConfigured()) {
    const pdf = await import('@/lib/recruiter-brief/pdf')
      .then(async ({ renderBriefPdf, briefPdfFilename }) => ({ filename: briefPdfFilename(view), content: await renderBriefPdf(view), contentType: 'application/pdf' }))
      .catch((error) => {
        console.error('brief send: PDF could not be generated', error);
        return undefined;
      });
    const result = await sendEmail({
      to: [email],
      bcc: [kyleInbox()],
      replyTo: profile.email,
      subject: `Kyle-Anthony Hay: ${briefTitle(view)}`,
      text: `${briefText(view, origin)}\n\nThe PDF is attached. Reply to this email to reach Kyle-Anthony directly.`,
      html: briefForVisitorEmailHtml(view, url),
      attachments: pdf ? [pdf] : undefined,
    });
    sent = result.ok;
  }

  try {
    await recordBriefRequest({ publicId: view.publicId, email, roleTitle: view.roleTitle, companyName: view.companyName, sent });
  } catch (error) {
    console.error('brief send: could not save the request', error);
    if (!sent) return NextResponse.json({ ok: false, error: 'Something went wrong. Try again.' }, { status: 500 });
  }

  return sent
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ ok: false, error: 'The email could not be sent right now. Use Download instead.' }, { status: 503 });
}
