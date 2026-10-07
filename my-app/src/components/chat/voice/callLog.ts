'use client';

/**
 * A structured record of one voice call, so a call that misbehaves can be
 * described precisely: connection state changes, every event on the data
 * channel, gaps in the agent's audio, transport stats, reconnects, and
 * anything the console printed while the call ran.
 *
 * It is on outside production builds. On a production build it turns on when
 * localStorage.voiceLog is "1". The last call's log is kept in sessionStorage
 * so it survives a reload; "Copy call log" on the card or on the "Call ended"
 * row copies it as plain text. On a phone, open the chat with ?voicelog=1.
 */

const STORAGE_KEY = 'voice:last-call-log';
const MAX_LINES = 5000;
const MAX_DETAIL = 400;

export function callLogEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NODE_ENV !== 'production') return true;
  try {
    // ?voicelog=1 in the address bar turns it on for this browser (handy on a phone); ?voicelog=0 turns it off.
    const flag = new URLSearchParams(window.location.search).get('voicelog');
    if (flag === '1') window.localStorage.setItem('voiceLog', '1');
    else if (flag === '0') window.localStorage.removeItem('voiceLog');
    return window.localStorage.getItem('voiceLog') === '1';
  } catch {
    return false;
  }
}

function short(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (value instanceof Event) return value.type;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function stamp(ms: number): string {
  const total = Math.max(0, ms);
  const minutes = Math.floor(total / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  const millis = Math.floor(total % 1000);
  return `+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

class CallLog {
  private lines: string[] = [];
  private startedAt = 0;
  private running = false;
  private unhook: (() => void) | null = null;

  /** A new call: clear the previous log and note where it runs. */
  begin(): void {
    this.lines = [];
    this.startedAt = performance.now();
    this.running = true;
    const nav = navigator as Navigator & { connection?: { effectiveType?: string; rtt?: number; downlink?: number } };
    this.add('call.begin', new Date().toISOString());
    this.add('env.page', `${location.protocol}//${location.host} secureContext=${window.isSecureContext} online=${nav.onLine} visible=${document.visibilityState}`);
    this.add('env.agent', nav.userAgent);
    if (nav.connection) this.add('env.network', `type=${nav.connection.effectiveType ?? '?'} rtt=${nav.connection.rtt ?? '?'}ms downlink=${nav.connection.downlink ?? '?'}Mbps`);
    this.add('env.build', process.env.NODE_ENV ?? 'unknown');
    this.hook();
  }

  add(kind: string, detail?: unknown): void {
    if (!this.running) return;
    const text = detail === undefined ? '' : short(detail);
    this.lines.push(`${stamp(performance.now() - this.startedAt)}  ${kind.padEnd(24)} ${text.length > MAX_DETAIL ? `${text.slice(0, MAX_DETAIL)}…` : text}`);
    if (this.lines.length > MAX_LINES) this.lines.splice(0, this.lines.length - MAX_LINES);
  }

  /** The call is over: stop listening to the page and keep the text for copying. */
  end(): void {
    if (!this.running) return;
    this.running = false;
    this.unhook?.();
    this.unhook = null;
    try {
      sessionStorage.setItem(STORAGE_KEY, this.text());
    } catch {
      // Storage unavailable; the text stays in memory until the next call.
    }
  }

  text(): string {
    if (this.lines.length) return this.lines.join('\n');
    try {
      return sessionStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  }

  hasText(): boolean {
    return this.text().length > 0;
  }

  async copy(): Promise<boolean> {
    const text = this.text();
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard API refused (no focus, or an older browser): fall through.
    }
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }

  /** Console warnings, errors and page errors while the call runs, so the browser's own complaints land in the log too. */
  private hook(): void {
    const warn = console.warn;
    const error = console.error;
    console.warn = (...args: unknown[]) => {
      this.add('console.warn', args.map(short).join(' '));
      warn.apply(console, args);
    };
    console.error = (...args: unknown[]) => {
      this.add('console.error', args.map(short).join(' '));
      error.apply(console, args);
    };
    const onError = (event: ErrorEvent) => this.add('page.error', event.message);
    const onRejection = (event: PromiseRejectionEvent) => this.add('page.rejection', short(event.reason));
    const onVisibility = () => this.add('page.visibility', document.visibilityState);
    const onOnline = () => this.add('page.online', String(navigator.onLine));
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOnline);
    this.unhook = () => {
      console.warn = warn;
      console.error = error;
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOnline);
    };
  }
}

export const callLog = new CallLog();
