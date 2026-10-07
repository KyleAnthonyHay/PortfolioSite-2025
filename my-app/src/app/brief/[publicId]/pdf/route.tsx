import { briefPdfFilename, renderBriefPdf } from '@/lib/recruiter-brief/pdf';
import { getBrief } from '@/lib/recruiter-brief/store';
import { toBriefView } from '@/lib/recruiter-brief/view';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const record = await getBrief(publicId);
  if (!record) return new Response('Brief not found', { status: 404 });

  const view = toBriefView(record);
  const buffer = await renderBriefPdf(view);
  const filename = briefPdfFilename(view);

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
