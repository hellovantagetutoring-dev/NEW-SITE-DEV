import type { SessionRow } from "@/lib/types";

function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  return parts.join("\r\n");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toIcsUtc(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const sec = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${h}${min}${sec}Z`;
}

export function sessionsToIcs(
  sessions: SessionRow[],
  opts?: { calendarName?: string; prodId?: string }
): string {
  const name = opts?.calendarName || "Vantage Tutoring";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    fold(`PRODID:${opts?.prodId || "-//Vantage Tutoring//Portal//EN"}`),
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${escapeText(name)}`),
    "X-WR-TIMEZONE:Australia/Brisbane",
  ];

  for (const s of sessions) {
    lines.push("BEGIN:VEVENT");
    lines.push(fold(`UID:${s.id}@learn.vantagetutoring.com.au`));
    lines.push(fold(`DTSTAMP:${toIcsUtc(new Date().toISOString())}`));
    lines.push(fold(`DTSTART:${toIcsUtc(s.starts_at)}`));
    lines.push(fold(`DTEND:${toIcsUtc(s.ends_at)}`));
    lines.push(fold(`SUMMARY:${escapeText(s.title || "Session")}`));
    if (s.location_or_link) {
      lines.push(fold(`LOCATION:${escapeText(s.location_or_link)}`));
    }
    lines.push(fold(`DESCRIPTION:${escapeText(`${s.type} session · Vantage Tutoring`)}`));
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
