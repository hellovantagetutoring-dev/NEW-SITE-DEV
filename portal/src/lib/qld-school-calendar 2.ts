/** Queensland state school terms / holidays (Australia/Brisbane dates). Update yearly from education.qld.gov.au */

export type QldDayKind = "term" | "holiday" | "student_free" | "public_holiday";

export type QldTerm = {
  id: string;
  label: string;
  year: number;
  term: 1 | 2 | 3 | 4;
  /** Inclusive local dates YYYY-MM-DD */
  start: string;
  end: string;
};

export type QldClosedRange = {
  id: string;
  label: string;
  kind: Exclude<QldDayKind, "term">;
  start: string;
  end: string;
};

export const QLD_TERMS: QldTerm[] = [
  { id: "2026-t1", label: "Term 1 2026", year: 2026, term: 1, start: "2026-01-27", end: "2026-04-02" },
  { id: "2026-t2", label: "Term 2 2026", year: 2026, term: 2, start: "2026-04-20", end: "2026-06-26" },
  { id: "2026-t3", label: "Term 3 2026", year: 2026, term: 3, start: "2026-07-13", end: "2026-09-18" },
  { id: "2026-t4", label: "Term 4 2026", year: 2026, term: 4, start: "2026-10-06", end: "2026-12-11" },
  { id: "2027-t1", label: "Term 1 2027", year: 2027, term: 1, start: "2027-01-27", end: "2027-04-01" },
  { id: "2027-t2", label: "Term 2 2027", year: 2027, term: 2, start: "2027-04-19", end: "2027-06-25" },
  { id: "2027-t3", label: "Term 3 2027", year: 2027, term: 3, start: "2027-07-12", end: "2027-09-17" },
  { id: "2027-t4", label: "Term 4 2027", year: 2027, term: 4, start: "2027-10-05", end: "2027-12-10" },
];

/** School holidays + common statewide public holidays / student-free style closures */
export const QLD_CLOSED: QldClosedRange[] = [
  { id: "2026-summer", label: "Summer holidays", kind: "holiday", start: "2025-12-13", end: "2026-01-26" },
  { id: "2026-aut", label: "Autumn holidays", kind: "holiday", start: "2026-04-03", end: "2026-04-19" },
  { id: "2026-win", label: "Winter holidays", kind: "holiday", start: "2026-06-27", end: "2026-07-12" },
  { id: "2026-spr", label: "Spring holidays", kind: "holiday", start: "2026-09-19", end: "2026-10-05" },
  { id: "2026-end", label: "Summer holidays", kind: "holiday", start: "2026-12-12", end: "2027-01-26" },
  { id: "2026-anu", label: "Australia Day", kind: "public_holiday", start: "2026-01-26", end: "2026-01-26" },
  { id: "2026-gf", label: "Good Friday", kind: "public_holiday", start: "2026-04-03", end: "2026-04-03" },
  { id: "2026-em", label: "Easter Monday", kind: "public_holiday", start: "2026-04-06", end: "2026-04-06" },
  { id: "2026-anz", label: "Anzac Day", kind: "public_holiday", start: "2026-04-25", end: "2026-04-25" },
  { id: "2026-lab", label: "Labour Day", kind: "public_holiday", start: "2026-05-04", end: "2026-05-04" },
  { id: "2026-ekka", label: "Ekka / RNA Show", kind: "public_holiday", start: "2026-08-12", end: "2026-08-12" },
  { id: "2026-kr", label: "King's Birthday", kind: "public_holiday", start: "2026-10-05", end: "2026-10-05" },
  { id: "2026-xmas", label: "Christmas Day", kind: "public_holiday", start: "2026-12-25", end: "2026-12-25" },
  { id: "2026-box", label: "Boxing Day", kind: "public_holiday", start: "2026-12-26", end: "2026-12-26" },
  { id: "2027-aut", label: "Autumn holidays", kind: "holiday", start: "2027-04-02", end: "2027-04-18" },
  { id: "2027-win", label: "Winter holidays", kind: "holiday", start: "2027-06-26", end: "2027-07-11" },
  { id: "2027-spr", label: "Spring holidays", kind: "holiday", start: "2027-09-18", end: "2027-10-04" },
  { id: "2027-end", label: "Summer holidays", kind: "holiday", start: "2027-12-11", end: "2028-01-26" },
  { id: "2027-anu", label: "Australia Day", kind: "public_holiday", start: "2027-01-26", end: "2027-01-26" },
  { id: "2027-gf", label: "Good Friday", kind: "public_holiday", start: "2027-03-26", end: "2027-03-26" },
  { id: "2027-em", label: "Easter Monday", kind: "public_holiday", start: "2027-03-29", end: "2027-03-29" },
  { id: "2027-anz", label: "Anzac Day", kind: "public_holiday", start: "2027-04-25", end: "2027-04-25" },
  { id: "2027-lab", label: "Labour Day", kind: "public_holiday", start: "2027-05-03", end: "2027-05-03" },
  { id: "2027-ekka", label: "Ekka / RNA Show", kind: "public_holiday", start: "2027-08-11", end: "2027-08-11" },
  { id: "2027-kr", label: "King's Birthday", kind: "public_holiday", start: "2027-10-04", end: "2027-10-04" },
  { id: "2027-xmas", label: "Christmas Day", kind: "public_holiday", start: "2027-12-25", end: "2027-12-25" },
  { id: "2027-box", label: "Boxing Day", kind: "public_holiday", start: "2027-12-27", end: "2027-12-27" },
];

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function inRange(ymd: string, start: string, end: string): boolean {
  return ymd >= start && ymd <= end;
}

export function getQldTerm(termId: string): QldTerm | undefined {
  return QLD_TERMS.find((t) => t.id === termId);
}

export function isQldNonTeachingDay(ymd: string): QldClosedRange | null {
  for (const r of QLD_CLOSED) {
    if (inRange(ymd, r.start, r.end)) return r;
  }
  return null;
}

export function isQldTermDay(ymd: string): QldTerm | null {
  if (isQldNonTeachingDay(ymd)) return null;
  for (const t of QLD_TERMS) {
    if (inRange(ymd, t.start, t.end)) return t;
  }
  return null;
}

/** Weekday: 0=Sun … 6=Sat (UTC calendar day = Brisbane calendar day for YMD lists) */
export function listTermWeekdayDates(
  termId: string,
  weekday: number
): { dates: string[]; skipped: { date: string; reason: string }[] } {
  const term = getQldTerm(termId);
  if (!term) return { dates: [], skipped: [] };

  const dates: string[] = [];
  const skipped: { date: string; reason: string }[] = [];
  let cur = parseYmd(term.start);
  const end = parseYmd(term.end);

  while (cur.getTime() <= end.getTime()) {
    const ymd = formatYmd(cur);
    if (cur.getUTCDay() === weekday) {
      const closed = isQldNonTeachingDay(ymd);
      if (closed) skipped.push({ date: ymd, reason: closed.label });
      else dates.push(ymd);
    }
    cur = new Date(cur.getTime() + 86400000);
  }

  return { dates, skipped };
}

export function brisbaneLocalToUtcIso(ymd: string, hhmm: string): string {
  // Brisbane is UTC+10 year-round (no DST)
  const [h, m] = hhmm.split(":").map(Number);
  const [y, mo, d] = ymd.split("-").map(Number);
  const utc = Date.UTC(y, mo - 1, d, h - 10, m || 0, 0);
  return new Date(utc).toISOString();
}

export function overlayKindForDay(ymd: string): QldDayKind | "none" {
  const closed = isQldNonTeachingDay(ymd);
  if (closed) return closed.kind;
  if (isQldTermDay(ymd)) return "term";
  return "none";
}

export function mondayOfWeek(ymd: string): string {
  const d = parseYmd(ymd);
  const dow = d.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + diff);
  return formatYmd(d);
}

export type QldWeekInfo = {
  kind: "term" | "holiday" | "public_holiday" | "none";
  label: string;
  shortLabel: string;
  term?: number;
  week?: number;
};

/** QLD school week for the Monday-start week containing `ymd`. */
export function getQldWeekInfo(ymd: string): QldWeekInfo {
  const mon = mondayOfWeek(ymd);
  const fri = formatYmd(new Date(parseYmd(mon).getTime() + 4 * 86400000));

  for (const t of QLD_TERMS) {
    const termMon = mondayOfWeek(t.start);
    const termEndMon = mondayOfWeek(t.end);
    if (mon >= termMon && mon <= termEndMon) {
      // If this Monday falls in a holiday that interrupts terms, prefer holiday label
      const closedMon = isQldNonTeachingDay(mon);
      if (closedMon && closedMon.kind === "holiday") {
        return {
          kind: "holiday",
          label: closedMon.label,
          shortLabel: "Holidays",
        };
      }
      const week =
        Math.floor((parseYmd(mon).getTime() - parseYmd(termMon).getTime()) / (7 * 86400000)) + 1;
      return {
        kind: "term",
        term: t.term,
        week,
        label: `Term ${t.term} · Week ${week}`,
        shortLabel: `T${t.term} W${week}`,
      };
    }
  }

  const closed = isQldNonTeachingDay(mon) || isQldNonTeachingDay(fri) || isQldNonTeachingDay(ymd);
  if (closed) {
    const short =
      closed.kind === "public_holiday"
        ? closed.label
        : closed.label.replace(/\s+holidays$/i, " hols");
    return {
      kind: closed.kind === "public_holiday" ? "public_holiday" : "holiday",
      label: closed.label,
      shortLabel: short.length > 14 ? "Holidays" : short,
    };
  }

  return { kind: "none", label: "", shortLabel: "" };
}
