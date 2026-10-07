import { Document, Link, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import type { VisitorContext, Widget } from './chat-events';
import { describeVisitor } from './email';
import { profile } from './profile';
import { PdfBrandHeader, pdfPalette, pdfTheme } from '@/components/brief/PdfTheme';

type FitReport = Extract<Widget, { kind: 'fit_report' }>;

const labels = { match: 'Supported match', related: 'Needs confirmation', gap: 'Confirmed gap' } as const;
const site = 'https://kyleanthonyhay.com';
const s = StyleSheet.create({
  page: pdfTheme.page,
  header: { ...pdfTheme.card, marginBottom: 10, padding: 12 },
  eyebrow: { ...pdfTheme.eyebrow, marginBottom: 6 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', lineHeight: 1.2, marginBottom: 7 },
  meta: { fontSize: 9, color: '#52525b', marginTop: 3 },
  tally: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  row: { ...pdfTheme.card, padding: 10, marginBottom: 6 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  requirement: { flex: 1, fontFamily: 'Helvetica-Bold', paddingRight: 16 },
  status: pdfTheme.badge,
  evidence: { color: '#71717a', fontSize: 9.5, lineHeight: 1.4 },
  projects: { marginTop: 5, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  link: { color: '#52525b', textDecoration: 'none', fontSize: 8, borderWidth: 0.6, borderColor: '#e4e4e7', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3 },
  note: { fontSize: 8.5, color: '#71717a', marginTop: 3 },
  footer: pdfTheme.footer,
});

/** A faithful export of the assessed report, without another model call or omitted rows. */
export function FitReportPdf({ report, context, createdAt }: { report: FitReport; context?: VisitorContext; createdAt: number }) {
  const role = report.role || context?.role || 'Unspecified role';
  const date = new Date(createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' });
  return (
    <Document title={`Fit check - ${role}`} author={profile.name} subject="Portfolio fit assessment">
      <Page size="LETTER" style={s.page}>
        <Text style={s.footer} fixed>kyleanthonyhay.com | Fit check for {role}</Text>
        <PdfBrandHeader kind="FIT CHECK" />
        <View style={s.header} wrap={false}>
          <Text style={s.eyebrow}>FIT REPORT</Text>
          <Text style={s.title}>{role}</Text>
          <Text style={s.meta}>Visitor: {describeVisitor(context)}</Text>
          <Text style={s.meta}>Generated {date} ET</Text>
          <View style={s.tally}>{(['match', 'related', 'gap'] as const).map((status) => (
            <Text key={status} style={[pdfTheme.badge, { color: pdfPalette[status].color, backgroundColor: pdfPalette[status].background }]}>{report.summary[status]} {labels[status]}</Text>
          ))}</View>
        </View>
        {report.requirements.map((row, index) => (
          <View key={index} style={s.row} wrap={false}>
            <View style={s.rowTop}>
              <Text style={s.requirement}>{index + 1}. {row.requirement}</Text>
              <Text style={[s.status, { color: pdfPalette[row.status].color, backgroundColor: pdfPalette[row.status].background }]}>{row.verificationStatus === 'unknown' ? 'Needs confirmation' : labels[row.status]}</Text>
            </View>
            <Text style={s.evidence}>{row.evidence}</Text>
            {row.projects.length > 0 && <View style={s.projects}>{row.projects.map((project) => (
              <Link key={project.id} style={s.link} src={`${site}${project.href}`}>{project.title}</Link>
            ))}</View>}
          </View>
        ))}
        <Text style={s.note}>The same results shown in the portfolio fit check. Generated from portfolio evidence; it can still make mistakes. Visitors remain anonymous unless they leave contact details.</Text>
      </Page>
    </Document>
  );
}

export function renderFitReportPdf(report: FitReport, context?: VisitorContext) {
  return renderToBuffer(<FitReportPdf report={report} context={context} createdAt={Date.now()} />);
}
