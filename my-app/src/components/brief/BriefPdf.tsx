import path from 'path';
import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { MatchLevel } from '@/lib/recruiter-brief/types';
import { SITE_URL, type BriefView } from '@/lib/recruiter-brief/view';
import { ACCENT, LEVEL_WORD, VERDICT_WORD, toOnePager } from '@/lib/recruiter-brief/onepager';

// Whole words only: hyphenated breaks read as a generated document.
Font.registerHyphenationCallback((word) => [word]);

/**
 * The one-page PDF: the web brief's content and layout from toOnePager(),
 * set in Helvetica (the PDF's built-in face, closest to the site's Helvetica
 * Neue) with the site's single accent colour.
 */

const zinc = { 900: '#18181b', 800: '#27272a', 700: '#3f3f46', 600: '#52525b', 500: '#71717a', 400: '#a1a1aa', 300: '#d4d4d8', 100: '#f4f4f5' };

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 38, paddingHorizontal: 50, fontFamily: 'Helvetica', fontSize: 10, color: zinc[900], lineHeight: 1.4 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.2, textTransform: 'uppercase', color: zinc[400] },
  header: { flexDirection: 'row', alignItems: 'center' },
  photo: { width: 44, height: 44, borderRadius: 10, marginRight: 12, objectFit: 'cover' },
  name: { fontSize: 20, letterSpacing: -0.7, lineHeight: 1 },
  sub: { fontSize: 9.5, color: zinc[500], marginTop: 4 },
  links: { flexDirection: 'row', marginLeft: 'auto' },
  link: { fontSize: 9.5, color: zinc[500], marginLeft: 12, textDecoration: 'none' },
  section: { marginTop: 16 },
  title: { fontSize: 15, letterSpacing: -0.3 },
  body: { fontSize: 10.5, color: zinc[600], lineHeight: 1.45 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4.5, borderBottomWidth: 0.6, borderBottomColor: zinc[100] },
  req: { width: '50%', paddingRight: 12, fontSize: 10, color: zinc[900], lineHeight: 1.3 },
  level: { width: '16%', flexDirection: 'row', alignItems: 'center' },
  evid: { width: '34%', fontSize: 9.5, color: zinc[600], lineHeight: 1.3 },
  cols: { flexDirection: 'row', marginTop: 14 },
  col: { flex: 1, paddingRight: 18 },
  item: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 5 },
  itemText: { flex: 1, fontSize: 10, color: zinc[800], lineHeight: 1.35 },
  footer: { position: 'absolute', bottom: 18, left: 50, right: 50, fontSize: 7.5, color: zinc[400] },
});

function asset(webPath: string): string {
  const name = webPath === '/profile.jpg' ? 'profile.jpg' : webPath.replace(/^\//, '').replace(/\//g, '-').replace(/\.png$/i, '.jpg');
  return path.join(process.cwd(), 'public', 'brief', name);
}

function absolute(href: string): string {
  return /^https?:|^mailto:/.test(href) ? href : `${SITE_URL}${href}`;
}

/** Same 7pt circle for every level, so the three read as one set: filled, ring, grey ring. */
function Dot({ level }: { level: MatchLevel }) {
  const color = level === 'gap' ? zinc[300] : ACCENT;
  return (
    <View
      style={{ width: 7, height: 7, borderRadius: 3.5, borderWidth: level === 'strong' ? 0 : 1.3, borderColor: color, backgroundColor: level === 'strong' ? ACCENT : 'transparent', marginRight: 5 }}
    />
  );
}

/** A dot and its word on one baseline: fixed row height, text with no line-height slack. */
function Level({ level, size = 9.5, color = zinc[700] }: { level: MatchLevel; size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: size + 2 }}>
      <Dot level={level} />
      <Text style={{ fontSize: size, lineHeight: 1, color, marginTop: 1 }}>{LEVEL_WORD[level]}</Text>
    </View>
  );
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
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={asset(candidate.photo)} style={s.photo} />
          <View>
            <Text style={s.name}>{candidate.name}</Text>
            <Text style={s.sub}>
              {candidate.headline} · {candidate.location}
            </Text>
          </View>
          <View style={s.links}>
            {candidate.links.map((link) => (
              <Link key={link.label} src={link.href} style={s.link}>
                {link.label}
              </Link>
            ))}
            <Link src={`mailto:${candidate.email}`} style={s.link}>
              Email
            </Link>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={s.eyebrow}>{page.general ? 'Candidate profile' : 'Prepared for'}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <Text style={[s.title, { flex: 1, paddingRight: 12 }]}>{page.general ? 'General profile, not a role match' : page.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 12, maxWidth: '45%' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: positive ? ACCENT : zinc[400], marginRight: 5 }} />
              <Text style={{ fontSize: 10.5, lineHeight: 1, marginTop: 1, fontFamily: 'Helvetica-Bold', color: positive ? ACCENT : zinc[700] }}>{VERDICT_WORD[page.verdict.level]}</Text>
            </View>
          </View>
          <Text style={[s.body, { marginTop: 8 }]}>{page.snapshot}</Text>
          <View style={{ marginTop: 10, paddingLeft: 9, borderLeftWidth: 2, borderLeftColor: positive ? ACCENT : zinc[300] }}>
            <Text style={{ fontSize: 10.5, color: zinc[700], lineHeight: 1.45 }}>
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
                    <Level level={level} size={8} color={zinc[400]} />
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

        <View style={s.cols}>
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
            <View style={[s.col, { paddingRight: 0 }]}>
              <Text style={s.eyebrow}>Most relevant work</Text>
              {page.work.map((project) => (
                <Link key={project.title} src={absolute(project.href)} style={{ marginTop: 5, textDecoration: 'none' }}>
                  <Text style={{ fontSize: 10, color: zinc[900], lineHeight: 1.35 }}>{project.title}</Text>
                </Link>
              ))}
            </View>
          )}
        </View>

        <View style={s.cols}>
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
            <View style={[s.col, { paddingRight: 0 }]}>
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
