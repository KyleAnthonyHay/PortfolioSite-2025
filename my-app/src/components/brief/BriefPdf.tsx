import path from 'path';
import { Document, Font, Image, Link, Page, StyleSheet, Text, View, type Styles } from '@react-pdf/renderer';

// Whole words only: hyphenated breaks read as a generated document.
Font.registerHyphenationCallback((word) => [word]);
import type { MatchLevel, RecommendationLevel } from '@/lib/recruiter-brief/types';
import { MATCH_LABEL, RECOMMENDATION_LABEL, SITE_URL, briefTitle, type BriefView } from '@/lib/recruiter-brief/view';

/**
 * The typeset PDF: the web brief's layout in vector text, set in Helvetica
 * (the PDF's built-in face, closest to the site's Helvetica Neue). Images are
 * the small copies in public/brief so the file stays light.
 */

const zinc = { 900: '#18181b', 700: '#3f3f46', 600: '#52525b', 500: '#71717a', 400: '#a1a1aa', 300: '#d4d4d8', 200: '#e4e4e7', 100: '#f4f4f5', 50: '#fafafa' };

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 44, paddingHorizontal: 44, fontFamily: 'Helvetica', fontSize: 8.8, color: zinc[900], lineHeight: 1.4 },
  eyebrow: { fontSize: 7, letterSpacing: 1.4, textTransform: 'uppercase', color: zinc[400], marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  photo: { width: 46, height: 46, borderRadius: 12, marginRight: 14, objectFit: 'cover' },
  name: { fontSize: 22, fontFamily: 'Helvetica', letterSpacing: -0.9, lineHeight: 1 },
  sub: { fontSize: 9, color: zinc[500], marginTop: 5 },
  links: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2, marginBottom: 2 },
  link: { fontSize: 8.5, color: zinc[500], marginRight: 14, textDecoration: 'none' },
  card: { borderWidth: 0.75, borderColor: zinc[200], borderRadius: 10, padding: 12 },
  section: { borderTopWidth: 0.75, borderTopColor: zinc[200], paddingTop: 10, marginTop: 11 },
  role: { fontSize: 13, letterSpacing: -0.3 },
  body: { fontSize: 8.7, color: zinc[500], lineHeight: 1.42 },
  row: { flexDirection: 'row', paddingVertical: 4.5, borderBottomWidth: 0.5, borderBottomColor: zinc[100] },
  req: { width: '38%', paddingRight: 10, fontSize: 8.2, fontFamily: 'Helvetica-Bold', color: zinc[900], lineHeight: 1.35 },
  chipCol: { width: '14%', paddingRight: 8 },
  evid: { width: '48%', fontSize: 7.9, color: zinc[500], lineHeight: 1.38 },
  chip: { fontSize: 7, paddingTop: 2.6, paddingBottom: 1.6, paddingHorizontal: 6, borderRadius: 8, alignSelf: 'flex-start' },
  tag: { fontSize: 6.3, letterSpacing: 1, textTransform: 'uppercase', color: zinc[400], fontFamily: 'Helvetica' },
  reasonRow: { flexDirection: 'row', gap: 8 },
  reason: { flex: 1, borderWidth: 0.75, borderColor: zinc[200], borderRadius: 10, padding: 9 },
  h3: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4, letterSpacing: -0.1 },
  project: { flexDirection: 'row', borderWidth: 0.75, borderColor: zinc[200], borderRadius: 10, padding: 9, marginBottom: 6 },
  thumb: { width: 100, height: 62, borderRadius: 6, objectFit: 'cover', objectPosition: 'top', marginRight: 12, backgroundColor: zinc[50] },
  bullet: { flexDirection: 'row', marginTop: 2.5 },
  dot: { width: 2.5, height: 2.5, borderRadius: 2, backgroundColor: zinc[300], marginTop: 4.5, marginRight: 6 },
  standout: { fontSize: 15, letterSpacing: -0.6, lineHeight: 1.2, marginBottom: 6 },
  footer: { position: 'absolute', bottom: 24, left: 46, right: 46, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: zinc[400] },
});

const chipStyle: Record<MatchLevel, Styles[string]> = {
  strong: { backgroundColor: zinc[900], color: '#ffffff' },
  relevant: { backgroundColor: zinc[100], color: zinc[700] },
  gap: { borderWidth: 0.6, borderStyle: 'dashed', borderColor: zinc[300], color: zinc[400] },
};

const verdictStyle: Record<RecommendationLevel, Styles[string]> = {
  advance: { backgroundColor: zinc[900], color: '#ffffff' },
  screen: { backgroundColor: zinc[100], color: zinc[700] },
  conditional: { backgroundColor: zinc[100], color: zinc[700] },
  decline: { borderWidth: 0.6, borderColor: zinc[300], color: zinc[600] },
};

function asset(webPath: string): string {
  const name = webPath === '/profile.jpg' ? 'profile.jpg' : webPath.replace(/^\//, '').replace(/\//g, '-').replace(/\.png$/i, '.jpg');
  return path.join(process.cwd(), 'public', 'brief', name);
}

function absolute(href: string): string {
  return /^https?:|^mailto:/.test(href) ? href : `${SITE_URL}${href}`;
}

/** `whole` keeps a short section on one page, so its label is never left behind. */
function Section({ label, children, whole }: { label: string; children: React.ReactNode; whole?: boolean }) {
  return (
    <View style={s.section} wrap={!whole}>
      <Text style={s.eyebrow} minPresenceAhead={90}>
        {label}
      </Text>
      {children}
    </View>
  );
}

export default function BriefPdf({ view }: { view: BriefView }) {
  const { candidate, brief, projects } = view;
  const title = briefTitle(view);
  const date = new Date(view.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const matches = [...brief.roleMatches.filter((m) => m.required), ...brief.roleMatches.filter((m) => !m.required)];

  return (
    <Document title={`Kyle-Anthony Hay · ${title}`} author="Kyle-Anthony Hay" subject="Recruiter brief" creator={SITE_URL}>
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Recruiter brief · {date}</Text>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={asset(candidate.photo)} style={s.photo} />
          <View>
            <Text style={s.name}>{candidate.name}</Text>
            <Text style={s.sub}>
              {candidate.headline} · {candidate.location}
            </Text>
          </View>
        </View>
        <View style={s.links}>
          {candidate.links.map((link) => (
            <Link key={link.label} src={link.href} style={s.link}>
              {link.display}
            </Link>
          ))}
          <Link src={`mailto:${candidate.email}`} style={s.link}>
            {candidate.email}
          </Link>
        </View>

        <View style={[s.card, { marginTop: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={s.eyebrow}>{view.roleTitle ? 'Prepared for' : 'Candidate snapshot'}</Text>
              <Text style={s.role}>{title}</Text>
            </View>
            <Text style={[s.chip, verdictStyle[brief.recommendation.level], { fontSize: 7.5, paddingHorizontal: 8, paddingVertical: 3 }]}>{brief.recommendation.nextStep}</Text>
          </View>
          <Text style={[s.body, { marginTop: 8 }]}>{brief.candidateSummary}</Text>
        </View>

        {matches.length > 0 && (
          <Section label="Role match">
            {matches.map((match) => (
              <View key={match.requirement} style={s.row} wrap={false}>
                <View style={{ width: '38%', paddingRight: 10 }}>
                  <Text style={[s.req, { width: '100%', paddingRight: 0 }]}>{match.requirement}</Text>
                  {(match.core || !match.required) && <Text style={[s.tag, { marginTop: 2 }]}>{match.core ? 'The role' : 'Nice to have'}</Text>}
                </View>
                <View style={s.chipCol}>
                  <Text style={[s.chip, chipStyle[match.assessment]]}>{MATCH_LABEL[match.assessment]}</Text>
                </View>
                <View style={{ width: '48%' }}>
                  <Text style={[s.evid, { width: '100%' }]}>{match.evidence}</Text>
                  {match.projectIds.length > 0 && (
                    <Text style={{ fontSize: 7.2, color: zinc[700], marginTop: 1.5 }}>{match.projectIds.map((id) => view.projectNames[id]?.title).filter(Boolean).join('  ·  ')}</Text>
                  )}
                </View>
              </View>
            ))}
          </Section>
        )}

        {brief.reasonsToConsider.length > 0 && (
          <Section label={view.roleTitle ? 'Why Kyle-Anthony for this role' : 'Why Kyle-Anthony'} whole>
            <View style={s.reasonRow} wrap={false}>
              {brief.reasonsToConsider.map((reason) => (
                <View key={reason.title} style={s.reason}>
                  <Text style={s.h3}>{reason.title}</Text>
                  <Text style={[s.body, { fontSize: 8.1 }]}>{reason.explanation}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {projects.length > 0 && (
          <Section label="Most relevant work">
            {projects.map((project, index) => (
              <View key={project.id} style={[s.project, index === 0 ? { marginTop: 0 } : {}]} wrap={false} minPresenceAhead={index === 0 ? 0 : undefined}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={asset(project.image)} style={s.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.tag, { marginBottom: 2 }]}>{project.category}</Text>
                  <Text style={{ fontSize: 11.5, letterSpacing: -0.3 }}>{project.title}</Text>
                  <Text style={[s.body, { fontSize: 8.3, marginTop: 1 }]}>{project.tagline}</Text>
                  <Text style={{ fontSize: 8.2, color: zinc[700], marginTop: 4, lineHeight: 1.38 }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', color: zinc[900] }}>Why it matters: </Text>
                    {project.relevance}
                  </Text>
                  {project.evidence.map((line) => (
                    <View key={line} style={s.bullet}>
                      <View style={s.dot} />
                      <Text style={{ flex: 1, fontSize: 7.8, color: zinc[500], lineHeight: 1.32 }}>{line}</Text>
                    </View>
                  ))}
                  <Link src={absolute(project.href)} style={{ fontSize: 8.3, color: zinc[900], marginTop: 4, textDecoration: 'underline' }}>
                    View project
                  </Link>
                </View>
              </View>
            ))}
          </Section>
        )}

        {brief.standoutSignal && (
          <Section label="What stands out" whole>
            <View wrap={false}>
              <Text style={s.standout}>{brief.standoutSignal.title}</Text>
              <Text style={s.body}>{brief.standoutSignal.explanation}</Text>
            </View>
          </Section>
        )}

        {brief.validationAreas.length > 0 && (
          <Section label="Areas to validate">
            {brief.validationAreas.map((area) => (
              <View key={area} style={[s.bullet, { marginTop: 3 }]} wrap={false}>
                <View style={{ width: 5, height: 5, borderRadius: 3, borderWidth: 0.6, borderColor: zinc[400], marginTop: 3.5, marginRight: 8 }} />
                <Text style={{ flex: 1, fontSize: 8.7, color: zinc[600], lineHeight: 1.4 }}>{area}</Text>
              </View>
            ))}
          </Section>
        )}

        {brief.interviewQuestions.length > 0 && (
          <Section label="Suggested interview questions">
            {brief.interviewQuestions.map((question, i) => (
              <View key={question.question} style={{ flexDirection: 'row', marginBottom: 6 }} wrap={false}>
                <Text style={{ width: 18, fontSize: 8.5, color: zinc[300] }}>{String(i + 1).padStart(2, '0')}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9.4, letterSpacing: -0.15, lineHeight: 1.33 }}>“{question.question}”</Text>
                  {question.rationale ? (
                    <Text style={[s.body, { fontSize: 8.3, marginTop: 2 }]}>
                      <Text style={{ fontFamily: 'Helvetica-Bold', color: zinc[700] }}>Why ask: </Text>
                      {question.rationale}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </Section>
        )}

        <Section label="Recommendation" whole>
          <View style={s.card} wrap={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, letterSpacing: -0.4, marginRight: 8 }}>{brief.recommendation.nextStep}</Text>
              <Text style={[s.chip, verdictStyle[brief.recommendation.level]]}>{RECOMMENDATION_LABEL[brief.recommendation.level]}</Text>
            </View>
            <Text style={[s.body, { marginTop: 6 }]}>{brief.recommendation.rationale}</Text>
          </View>
          <Text style={{ fontSize: 7, color: zinc[400], marginTop: 12, lineHeight: 1.45 }}>
            Prepared by the AI agent on {candidate.name}&apos;s portfolio from his project write-ups. Every claim cites a write-up and was checked by a second model
            {brief.verification ? ` (${brief.verification.checked} checked, ${brief.verification.rewritten} rewritten, ${brief.verification.removed} removed)` : ''}. No scores, because a portfolio can&apos;t support that precision.
            Live version: {SITE_URL}/brief/{view.publicId}
          </Text>
        </Section>

        <View style={s.footer} fixed>
          <Text>Kyle-Anthony Hay · {title}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
