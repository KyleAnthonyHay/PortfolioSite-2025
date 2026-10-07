/** The voice allowance's day: New York's calendar, so it resets at midnight there. */

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });

/** The New York calendar day, YYYY-MM-DD. */
export function nyDay(ms: number): string {
  return dayFormat.format(ms);
}

/** The next New York midnight after `ms`, DST included. */
export function nextReset(ms: number): number {
  const today = nyDay(ms);
  // Walk forward an hour at a time into the next day, then back a minute at a time to its first minute.
  let t = ms - (ms % 60_000);
  while (nyDay(t) === today) t += 3_600_000;
  while (nyDay(t - 60_000) !== today) t -= 60_000;
  return t;
}
