/**
 * Booking a conversation with Kyle-Anthony through his Calendly, embedded on
 * the chat page. Calendly owns availability, timezones and the invitee's
 * details; this side only builds the embed link, prefills what the visitor
 * already gave us, and listens for the embed's postMessage events.
 *
 * https://developer.calendly.com/api-docs/overview/embedding/getting-started
 */

const DETAILS_KEY = 'portfolio-visitor-details';

export interface VisitorDetails {
  name?: string;
  email?: string;
}

/** Name and email the visitor typed into the note card or the brief's email popup, for prefilling Calendly. */
export function loadVisitorDetails(): VisitorDetails {
  try {
    const raw = localStorage.getItem(DETAILS_KEY);
    return raw ? (JSON.parse(raw) as VisitorDetails) : {};
  } catch {
    return {};
  }
}

export function rememberVisitorDetails(details: VisitorDetails) {
  const name = details.name?.trim();
  const email = details.email?.trim();
  if (!name && !email) return;
  try {
    const current = loadVisitorDetails();
    localStorage.setItem(DETAILS_KEY, JSON.stringify({ name: name || current.name, email: email || current.email }));
  } catch {
    // Storage unavailable; Calendly just asks for them.
  }
}

/** The Calendly page as an inline embed, prefilled. Calendly only posts its events to the embed_domain it was given. */
export function calendlyEmbedUrl(base: string, details: VisitorDetails): string {
  const url = new URL(base);
  url.searchParams.set('embed_domain', window.location.host);
  url.searchParams.set('embed_type', 'Inline');
  url.searchParams.set('hide_gdpr_banner', '1');
  url.searchParams.set('primary_color', '0a84ff');
  if (details.name) url.searchParams.set('name', details.name);
  if (details.email) url.searchParams.set('email', details.email);
  return url.toString();
}

export type CalendlyEvent = 'loaded' | 'scheduled';

/** Calendly's embed events, narrowed to the two this page acts on. Opening the scheduler is never a booking. */
export function readCalendlyEvent(event: MessageEvent): CalendlyEvent | null {
  if (event.origin !== 'https://calendly.com') return null;
  const name = (event.data as { event?: unknown } | null)?.event;
  if (name === 'calendly.event_scheduled') return 'scheduled';
  if (name === 'calendly.profile_page_viewed' || name === 'calendly.event_type_viewed') return 'loaded';
  return null;
}
