import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TopHeader from '@/components/TopHeader';
import BriefDocument from '@/components/brief/BriefDocument';
import BriefActions from '@/components/brief/BriefActions';
import { getBrief } from '@/lib/recruiter-brief/store';
import { briefTitle, toBriefView } from '@/lib/recruiter-brief/view';

/**
 * Read-only shared brief. Kept as its own route with the brief loaded on the
 * server, so the agent can later be mounted beside it with the brief as
 * context without changing the URL.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ publicId: string }> }): Promise<Metadata> {
  const { publicId } = await params;
  const record = await getBrief(publicId);
  if (!record) return { title: 'Brief not found' };
  return {
    title: `Kyle-Anthony Hay · ${briefTitle(record)}`,
    description: 'Recruiter brief prepared from Kyle-Anthony Hay’s portfolio.',
    robots: { index: false, follow: false },
  };
}

export default async function BriefPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const record = await getBrief(publicId);
  if (!record) notFound();
  const view = toBriefView(record);

  return (
    <>
      <TopHeader />
      <main className="pt-6 pb-24 sm:pt-16 md:pt-24">
        <div className="max-w-[920px] mx-auto px-4 sm:px-6 md:px-10">
          <div className="mb-6 flex justify-end md:mb-10">
            <BriefActions publicId={view.publicId} />
          </div>
          <BriefDocument view={view} />
        </div>
      </main>
    </>
  );
}
