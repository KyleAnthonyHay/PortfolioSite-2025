import { renderToBuffer } from '@react-pdf/renderer';
import BriefPdf from '@/components/brief/BriefPdf';
import { briefTitle, type BriefView } from './view';

/** The download route and notification attach the same document and filename. */
export function briefPdfFilename(view: BriefView): string {
  const name = `Kyle-Anthony Hay - ${briefTitle(view)}`.replace(/[^\w\s.,-]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 90);
  return `${name}.pdf`;
}

export function renderBriefPdf(view: BriefView) {
  return renderToBuffer(<BriefPdf view={view} />);
}
