import path from 'path';
import { Font, Image, Link, StyleSheet, Text, View } from '@react-pdf/renderer';
import { profile } from '@/lib/profile';

Font.registerHyphenationCallback((word) => [word]);

export const pdfPalette = {
  ink: '#18181b', muted: '#71717a', border: '#e4e4e7', canvas: '#fafafa', accent: '#10b981',
  match: { color: '#047857', background: '#ecfdf5' },
  related: { color: '#b45309', background: '#fffbeb' },
  gap: { color: '#71717a', background: '#f4f4f5' },
};

export const pdfTheme = StyleSheet.create({
  page: { padding: 36, paddingBottom: 48, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.4, color: pdfPalette.ink, backgroundColor: pdfPalette.canvas },
  card: { backgroundColor: '#ffffff', borderWidth: 0.7, borderColor: pdfPalette.border, borderRadius: 12, padding: 12 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.2, textTransform: 'uppercase', color: pdfPalette.muted },
  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, paddingTop: 8, borderTopWidth: 0.6, borderTopColor: pdfPalette.border, fontSize: 7, color: pdfPalette.muted },
  badge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3, fontSize: 8, fontFamily: 'Helvetica-Bold' },
});

/** Shared identity and document label for both attachment types. */
export function PdfBrandHeader({ kind, candidate = { ...profile, photo: '/profile.jpg', links: [{ label: 'Portfolio', href: 'https://kyleanthonyhay.com' }] } }: {
  kind: string;
  candidate?: { name: string; headline: string; location: string; photo: string; email: string; links: { label: string; href: string }[] };
}) {
  const photo = candidate.photo === '/profile.jpg' ? 'profile.jpg' : candidate.photo.replace(/^\//, '').replace(/\//g, '-').replace(/\.png$/i, '.jpg');
  return (
    <View style={{ marginBottom: 14 }} wrap={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={path.join(process.cwd(), 'public', 'brief', photo)} style={{ width: 38, height: 38, borderRadius: 10, marginRight: 10, objectFit: 'cover' }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 19, letterSpacing: -0.5, lineHeight: 1.15 }}>{candidate.name}</Text>
          <Text style={{ fontSize: 8.5, color: pdfPalette.muted, marginTop: 3 }}>{candidate.headline} · {candidate.location}</Text>
        </View>
        <Text style={[pdfTheme.badge, { backgroundColor: '#18181b', color: '#ffffff', fontSize: 7.5 }]}>{kind}</Text>
      </View>
      <View style={{ flexDirection: 'row', borderTopWidth: 2, borderTopColor: pdfPalette.accent, paddingTop: 7 }}>
        {candidate.links.map((link) => <Link key={link.label} src={link.href} style={{ fontSize: 8, color: pdfPalette.muted, textDecoration: 'none', marginRight: 14 }}>{link.label}</Link>)}
        <Link src={`mailto:${candidate.email}?cc=${encodeURIComponent(profile.emailCc)}`} style={{ fontSize: 8, color: pdfPalette.muted, textDecoration: 'none' }}>Email Kyle-Anthony</Link>
      </View>
    </View>
  );
}
