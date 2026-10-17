import { Document, Link, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import type { FitStatus } from '@/lib/chat-events';
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/fit-status';
import { SITE_URL, type BriefView } from '@/lib/recruiter-brief/view';
import { VERDICT_WORD, toFitSheet } from '@/lib/recruiter-brief/sheet';

import { PdfBadge, PdfBrandHeader, pdfTheme } from './PdfTheme';

/**
 * The brief as a PDF: the same fit check rows as the web page, from
 * toFitSheet(), set in Helvetica with the site's cards and status palette.
 */

const zinc = { 900: '#18181b', 700: '#3f3f46', 600: '#52525b', 500: '#71717a', 400: '#a1a1aa', 300: '#d4d4d8', 200: '#e4e4e7', 100: '#f4f4f5' };
const ICON_COLOR: Record<FitStatus, string> = { match: '#059669', related: '#6b4f8a', gap: '#a1a1aa' };

const s = StyleSheet.create({
  page: { ...pdfTheme.page, paddingTop: 28, paddingBottom: 40, paddingHorizontal: 32 },
  eyebrow: pdfTheme.eyebrow,
  title: { fontSize: 15, letterSpacing: -0.3 },
  row: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10, borderTopWidth: 0.6, borderTopColor: zinc[100] },
  req: { flex: 1, fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: zinc[900], lineHeight: 1.3, paddingRight: 10 },
  evid: { fontSize: 8.5, color: zinc[500], lineHeight: 1.4, marginTop: 2 },
  chip: { fontSize: 7.5, color: zinc[600], textDecoration: 'none', borderWidth: 0.6, borderColor: zinc[200], borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginTop: 4 },
  footer: pdfTheme.footer,
});

/** The chat card's status icons, drawn: a filled check disc, a ringed dot, a ringed dash. */
function StatusIcon({ status }: { status: FitStatus }) {
  const color = ICON_COLOR[status];
  return (
    <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: color, marginTop: 1, marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
      {status === 'match' && (
        <Svg width={6} height={6} viewBox="0 0 24 24">
          <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
      {status === 'related' && <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />}
      {status === 'gap' && <View style={{ width: 4, height: 1, backgroundColor: color }} />}
    </View>
  );
}

export default function BriefPdf({ view }: { view: BriefView }) {
  const { candidate } = view;
  const sheet = toFitSheet(view);
  const positive = sheet.verdict.level === 'advance' || sheet.verdict.level === 'screen';
  const date = new Date(view.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Document title={`Kyle-Anthony Hay · ${sheet.title}`} author="Kyle-Anthony Hay" subject="Fit check" creator={SITE_URL}>
      <Page size="LETTER" style={s.page}>
        <Text style={s.footer} fixed>
          Generated {date} by the AI agent on his portfolio, from his write-ups and résumé · {SITE_URL.replace(/^https?:\/\//, '')}/brief/{view.publicId}
        </Text>
        <PdfBrandHeader kind="FIT CHECK" candidate={candidate} />

        <View style={pdfTheme.card} wrap={false}>
          <Text style={s.eyebrow}>Fit check</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <Text style={[s.title, { flex: 1, paddingRight: 12 }]}>{sheet.general ? 'General profile, not a role match' : sheet.title}</Text>
            <PdfBadge color={positive ? STATUS_COLOR.match.color : zinc[700]} background={positive ? STATUS_COLOR.match.background : zinc[100]} size={8.5}>
              {VERDICT_WORD[sheet.verdict.level]}
            </PdfBadge>
          </View>
          <View style={{ marginTop: 10, paddingLeft: 9, borderLeftWidth: 2, borderLeftColor: positive ? '#10b981' : zinc[300] }}>
            <Text style={{ fontSize: 9.5, color: zinc[700], lineHeight: 1.45 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: zinc[900] }}>Recommendation: {sheet.verdict.nextStep}. </Text>
              {sheet.verdict.reason}
            </Text>
          </View>
        </View>

        {sheet.rows.length > 0 && (
          <View style={[pdfTheme.card, { marginTop: 8, padding: 0 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 }}>
              <Text style={s.eyebrow}>Requirements</Text>
              <View style={{ flexDirection: 'row' }}>
                {(['match', 'related', 'gap'] as FitStatus[]).map((status) => (
                  <View key={status} style={{ marginLeft: 5 }}>
                    <PdfBadge color={STATUS_COLOR[status].color} background={STATUS_COLOR[status].background} size={7.5}>
                      {sheet.summary[status]} {STATUS_LABEL[status].toLowerCase()}
                    </PdfBadge>
                  </View>
                ))}
              </View>
            </View>
            <Text style={{ fontSize: 8, color: zinc[500], paddingHorizontal: 10, paddingBottom: 6 }}>Based on documented evidence. Confirm unrecorded experience with Kyle-Anthony.</Text>
            {sheet.rows.map((row) => (
              <View key={row.requirement} style={s.row} wrap={false}>
                <StatusIcon status={row.status} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Text style={s.req}>{row.requirement}</Text>
                    <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: STATUS_COLOR[row.status].color, marginTop: 1 }}>{STATUS_LABEL[row.status]}</Text>
                  </View>
                  <Text style={s.evid}>{row.evidence}</Text>
                  {row.projects.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {row.projects.map((project) => (
                        <Link key={project.id} src={`${SITE_URL}${project.href}`} style={s.chip}>
                          {project.title}
                        </Link>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
