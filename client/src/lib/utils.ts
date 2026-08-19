/** "14:30" -> "2:30 PM" */
export function format12Hour(time: string): string {
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** "07:30" -> { hm: "07:30", mer: "AM" } (zero-padded 12-hour, PDF style). */
function parse12Hour(time: string): { hm: string; mer: 'AM' | 'PM' } | null {
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const hour = ((h + 11) % 12) + 1;
  return { hm: `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`, mer: h >= 12 ? 'PM' : 'AM' };
}

// Non-breaking space + en dash, so the time-range formatter below can decide
// exactly where a range is allowed to wrap.
const NB = ' ';
const DASH = '–';

/**
 * Rundown time as it reads on the official PDF:
 *   - start + end, same half of day -> "07:30 - 08:00 AM" (meridiem shown once)
 *   - start + end crossing noon      -> "09:00 AM - 01:00 PM"
 *   - start only                     -> "08:30 AM"
 * Falls back to the raw string if a value can't be parsed.
 *
 * Every space is non-breaking except the single ordinary space after the dash,
 * so in the narrow time gutter a range always wraps the same way,
 * "07:30 -" / "08:00 AM", and a meridiem never orphans onto its own line.
 */
export function formatTimeRange(start: string, end?: string | null): string {
  const s = parse12Hour(start);
  if (!s) return start;
  if (!end) return `${s.hm}${NB}${s.mer}`;
  const e = parse12Hour(end);
  if (!e) return `${s.hm}${NB}${s.mer}`;
  return s.mer === e.mer
    ? `${s.hm}${NB}${DASH} ${e.hm}${NB}${e.mer}`
    : `${s.hm}${NB}${s.mer}${NB}${DASH} ${e.hm}${NB}${e.mer}`;
}

/** Address / query -> Google Maps search link (passes URLs through untouched). */
export function mapsLink(query: string | null | undefined): string | null {
  if (!query) return null;
  if (/^https?:\/\//.test(query)) return query;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** "2026-08-20" -> "Aug 20" (safe fallback to the raw string). */
export function shortDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
