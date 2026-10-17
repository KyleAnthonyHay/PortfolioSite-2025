import { getBrief } from '@/lib/recruiter-brief/store';
import { briefText } from '@/lib/recruiter-brief/text';
import { toBriefView } from '@/lib/recruiter-brief/view';

/** The brief as plain text, for the chat card's Copy button. */
export async function GET(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const record = await getBrief(publicId);
  if (!record) return new Response('Not found', { status: 404 });
  return new Response(briefText(toBriefView(record), new URL(request.url).origin), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  });
}
