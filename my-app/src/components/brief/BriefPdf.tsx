import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { MatchLevel } from '@/lib/recruiter-brief/types';
import { SITE_URL, type BriefView } from '@/lib/recruiter-brief/view';
import { ACCENT, LEVEL_WORD, VERDICT_WORD, toOnePager } from '@/lib/recruiter-brief/onepager';

import { PdfBrandHeader, pdfPalette, pdfTheme } from './PdfTheme';

/**
 * The one-page PDF: the web brief's content and layout from toOnePager(),
 * set in Helvetica (the PDF's built-in face, closest to the site's Helvetica
 * Neue) with the site's cards and status badge palette.
 */

const zinc = { 900: '#18181b', 800: '#27272a', 700: '#3f3f46', 600: '#52525b', 500: '#71717a', 400: '#a1a1aa', 300: '#d4d4d8', 100: '#f4f4f5' };

const s = StyleSheet.create({
  page: { ...pdfTheme.page, paddingTop: 28, paddingBottom: 40, paddingHorizontal: 32 },
  eyebrow: pdfTheme.eyebrow,
  section: { ...pdfTheme.card, marginTop: 8, padding: 8 },
  title: { fontSize: 15, letterSpacing: -0.3 },
  body: { fontSize: 9.5, color: zinc[600], lineHeight: 1.45 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 0.6, borderBottomColor: zinc[100] },
  req: { width: '50%', paddingRight: 12, fontSize: 9.5, color: zinc[900], lineHeight: 1.3 },
  level: { width: '18%', flexDirection: 'row', alignItems: 'center' },
  evid: { width: '32%', fontSize: 9, color: zinc[600], lineHeight: 1.3 },
  cols: { flexDirection: 'row', marginTop: 8 },
  col: { ...pdfTheme.card, flex: 1, padding: 8, marginRight: 8 },
  item: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  itemText: { flex: 1, fontSize: 9, color: zinc[800], lineHeight: 1.35 },
  footer: pdfTheme.footer,
});

function absolute(href: string): string {
  return /^https?:|^mailto:/.test(href) ? href : `${SITE_URL}${href}`;
}

/** Compact status pills use the same palette as the fit-check email. */
function Level({ level, size = 8 }: { level: MatchLevel; size?: number }) {
  const tone = pdfPalette[level === 'strong' ? 'match' : level === 'relevant' ? 'related' : 'gap'];
  return <Text style={[pdfTheme.badge, { color: tone.color, fontSize: size, backgroundColor: tone.background, paddingVertical: 2, lineHeight: 1 }]}>{LEVEL_WORD[level]}</Text>;
}

function Bullet({ color, hollow }: { color: string; hollow?: boolean }) {
  return <View style={{ width: 4.5, height: 4.5, borderRadius: 3, marginTop: 4.2, marginRight: 7, borderWidth: hollow ? 0.8 : 0, borderColor: color, backgroundColor: hollow ? 'transparent' : color }} />;
}

export default function BriefPdf({ view }: { view: BriefView }) {
  const { candidate } = view;
  const page = toOnePager(view);
  const positive = page.verdict.level === 'advance' || page.verdict.level === 'screen';
  const date = new Date(view.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Document title={`Kyle-Anthony Hay · ${page.title}`} author="Kyle-Anthony Hay" subject="Recruiter brief" creator={SITE_URL}>
      <Page size="LETTER" style={s.page}>
        <Text style={s.footer} fixed>
          Generated {date} by the AI agent on his portfolio, from his write-ups and résumé · {SITE_URL.replace(/^https?:\/\//, '')}/brief/{view.publicId}
        </Text>
        <PdfBrandHeader kind="RECRUITER BRIEF" candidate={candidate} />

        <View style={pdfTheme.card} wrap={false}>
          <Text style={s.eyebrow}>{page.general ? 'Candidate profile' : 'Prepared for'}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <Text style={[s.title, { flex: 1, paddingRight: 12 }]}>{page.general ? 'General profile, not a role match' : page.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: '45%', backgroundColor: positive ? '#ecfdf5' : '#f4f4f5', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: positive ? ACCENT : zinc[400], marginRight: 5, marginTop: 2.2 }} />
              <Text style={{ fontSize: 9, lineHeight: 1, marginTop: 1, fontFamily: 'Helvetica-Bold', color: positive ? ACCENT : zinc[700] }}>{VERDICT_WORD[page.verdict.level]}</Text>
            </View>
          </View>
          <Text style={[s.body, { marginTop: 8 }]}>{page.snapshot}</Text>
          <View style={{ marginTop: 10, paddingLeft: 9, borderLeftWidth: 2, borderLeftColor: positive ? ACCENT : zinc[300] }}>
            <Text style={{ fontSize: 9.5, color: zinc[700], lineHeight: 1.45 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: zinc[900] }}>Recommendation: {page.verdict.nextStep}. </Text>
              {page.verdict.reason}
            </Text>
          </View>
        </View>

        {page.rows.length > 0 && (
          <View style={s.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={s.eyebrow}>Role match</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {(['strong', 'relevant', 'gap'] as MatchLevel[]).map((level) => (
                  <View key={level} style={{ marginLeft: 10 }}>
                    <Level level={level} size={8} />
                  </View>
                ))}
              </View>
            </View>
            <View style={{ borderTopWidth: 0.6, borderTopColor: zinc[100] }}>
              {page.rows.map((row) => (
                <View key={row.requirement} style={s.row} wrap={false}>
                  <Text style={s.req}>{row.requirement}</Text>
                  <View style={s.level}>
                    <Level level={row.level} />
                  </View>
                  <Text style={[s.evid, row.level === 'gap' ? { color: zinc[400] } : {}]}>{row.evidence}</Text>
                </View>
              ))}
            </View>
            {page.moreRows > 0 && <Text style={{ fontSize: 8, color: zinc[400], marginTop: 4 }}>+{page.moreRows} more lower-priority requirements not shown</Text>}
          </View>
        )}

        <View style={s.cols} wrap={false}>
          {page.why.length > 0 && (
            <View style={s.col}>
              <Text style={s.eyebrow}>Why consider him</Text>
              {page.why.map((line) => (
                <View key={line} style={s.item}>
                  <Bullet color={ACCENT} />
                  <Text style={s.itemText}>{line}</Text>
                </View>
              ))}
            </View>
          )}
          {page.work.length > 0 && (
            <View style={[s.col, { marginRight: 0 }]}>
              <Text style={s.eyebrow}>Most relevant work</Text>
              {page.work.map((project) => (
                <Link key={project.title} src={absolute(project.href)} style={{ marginTop: 5, textDecoration: 'none' }}>
                  <Text style={{ fontSize: 9.5, color: zinc[900], lineHeight: 1.35 }}>{project.title}</Text>
                </Link>
              ))}
            </View>
          )}
        </View>

        <View style={s.cols} wrap={false}>
          {page.validate.length > 0 && (
            <View style={s.col}>
              <Text style={s.eyebrow}>To validate</Text>
              {page.validate.map((line) => (
                <View key={line} style={s.item}>
                  <Bullet color={zinc[400]} hollow />
                  <Text style={[s.itemText, { color: zinc[700] }]}>{line}</Text>
                </View>
              ))}
            </View>
          )}
          {page.questions.length > 0 && (
            <View style={[s.col, { marginRight: 0 }]}>
              <Text style={s.eyebrow}>Ask in the interview</Text>
              {page.questions.map((question, i) => (
                <View key={question} style={s.item}>
                  <Text style={{ width: 10, fontSize: 10, color: zinc[300] }}>{i + 1}</Text>
                  <Text style={[s.itemText, { color: zinc[700] }]}>{question}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

      </Page>
    </Document>
  );
}
