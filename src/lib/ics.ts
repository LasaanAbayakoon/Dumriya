/**
 * Minimal iCalendar (.ics, RFC 5545) export so reminders still go off when the
 * app is closed: the phone's calendar app fires the alarm.
 */

export interface IcsEvent {
  uid: string;
  start: Date;
  durationMin: number;
  title: string;
  description?: string;
  url?: string;
}

/** UTC timestamp in iCalendar basic format, e.g. 20261108T143000Z. */
export function icsTime(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);
}

/** Fold lines at 75 octets (UTF-8), never splitting a character: Sinhala/Tamil are 3 bytes each. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + n > limit) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function buildIcs(events: IcsEvent[], now: Date = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dumriya (unofficial)//Reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const e of events) {
    const end = new Date(e.start.getTime() + e.durationMin * 60_000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${icsTime(now)}`,
      `DTSTART:${icsTime(e.start)}`,
      `DTEND:${icsTime(end)}`,
      `SUMMARY:${escapeText(e.title)}`,
      ...(e.description ? [`DESCRIPTION:${escapeText(e.description)}`] : []),
      ...(e.url ? [`URL:${e.url}`] : []),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:PT0M',
      `DESCRIPTION:${escapeText(e.title)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** Offer the .ics file to the user (opens the calendar app on most phones). */
export function downloadIcs(filename: string, ics: string): void {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
