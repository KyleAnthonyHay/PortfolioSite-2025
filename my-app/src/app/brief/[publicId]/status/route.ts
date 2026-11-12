import { getBrief } from '@/lib/recruiter-brief/store';
import { toBriefView } from '@/lib/recruiter-brief/view';

/**
 * Whether a brief is saved yet, for the chat's fit check card, which goes out
 * while its brief is still being written. 404 until it is saved.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const record = await getBrief(publicId);
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
  if (!record) return Response.json({ ready: false }, { status: 404, headers });
  const { recommendation } = toBriefView(record).brief;
  return Response.json({ ready: true, nextStep: recommendation.nextStep, level: recommendation.level }, { headers });
}
