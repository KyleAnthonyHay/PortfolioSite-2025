import { Document, Link, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import type { VisitorContext, Widget } from './chat-events';
import { describeVisitor } from './email';
import { profile } from './profile';

type FitReport = Extract<Widget, { kind: 'fit_report' }>;

const labels = { match: 'Match', related: 'Related', gap: 'Gap' } as const;
const colors = { match: '#047857', related: '#92400e', gap: '#b91c1c' } as const;
const site = 'https://kyleanthonyhay.com';
const s = StyleSheet.create({
  page: { padding: 42, paddingBottom: 54, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.45, color: '#18181b' },
  header: { paddingBottom: 14, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: '#e4e4e7' },
  eyebrow: { fontSize: 8, color: '#71717a', letterSpacing: 1.2, marginBottom: 6 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', lineHeight: 1.2, marginBottom: 7 },
  meta: { fontSize: 9, color: '#52525b', marginTop: 3 },
  tally: { marginTop: 10, fontSize: 11, fontFamily: 'Helvetica-Bold' },
  row: { paddingBottom: 11, marginBottom: 11, borderBottomWidth: 0.5, borderBottomColor: '#e4e4e7' },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  requirement: { flex: 1, fontFamily: 'Helvetica-Bold', paddingRight: 16 },
  status: { width: 48, fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  evidence: { color: '#3f3f46' },
  projects: { marginTop: 5, fontSize: 8.5, color: '#71717a' },
  link: { color: '#047857', textDecoration: 'none' },
  note: { fontSize: 8.5, color: '#71717a', marginTop: 3 },
  footer: { position: 'absolute', bottom: 24, left: 42, right: 42, fontSize: 8, color: '#71717a' },
});

/** A faithful export of the assessed report, without another model call or omitted rows. */
export function FitReportPdf({ report, context, createdAt }: { report: FitReport; context?: VisitorContext; createdAt: number }) {
  const role = report.role || context?.role || 'Unspecified role';
  const date = new Date(createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' });
  return (
    <Document title={`Fit check - ${role}`} author={profile.name} subject="Portfolio fit assessment">
      <Page size="LETTER" style={s.page}>
        <Text style={s.footer} fixed>kyleanthonyhay.com | Fit check for {role}</Text>
        <View style={s.header}>
          <Text style={s.eyebrow}>KYLE-ANTHONY HAY / FIT CHECK</Text>
          <Text style={s.title}>{role}</Text>
          <Text style={s.meta}>Visitor: {describeVisitor(context)}</Text>
          <Text style={s.meta}>Generated {date} ET</Text>
          <Text style={s.tally}>{report.summary.match} match / {report.summary.related} related / {report.summary.gap} gap</Text>
        </View>
        {report.requirements.map((row, index) => (
          <View key={index} style={s.row} wrap={false}>
            <View style={s.rowTop}>
              <Text style={s.requirement}>{index + 1}. {row.requirement}</Text>
              <Text style={[s.status, { color: colors[row.status] }]}>{labels[row.status]}</Text>
            </View>
            <Text style={s.evidence}>{row.evidence}</Text>
            {row.projects.length > 0 && <Text style={s.projects}>Evidence projects: {row.projects.map((project, projectIndex) => (
              <Link key={project.id} style={s.link} src={`${site}${project.href}`}>{projectIndex > 0 ? ', ' : ''}{project.title}</Link>
            ))}</Text>}
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
