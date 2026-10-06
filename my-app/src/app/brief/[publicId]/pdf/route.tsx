import { renderToBuffer } from '@react-pdf/renderer';
import BriefPdf from '@/components/brief/BriefPdf';
import { getBrief } from '@/lib/recruiter-brief/store';
import { briefTitle, toBriefView } from '@/lib/recruiter-brief/view';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const record = await getBrief(publicId);
  if (!record) return new Response('Brief not found', { status: 404 });

  const view = toBriefView(record);
  const buffer = await renderToBuffer(<BriefPdf view={view} />);
  const filename = `Kyle-Anthony Hay - ${briefTitle(view)}`.replace(/[^\w\s.,-]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 90);

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
