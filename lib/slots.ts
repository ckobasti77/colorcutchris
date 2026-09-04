/**
 * Čista aritmetika termina — deli je Convex backend i klijent.
 * Bez Convex importa, bez DOM-a. Vreme je u minutima od ponoći (Europe/Belgrade),
 * datumi su `YYYY-MM-DD` stringovi. Nikad JS Date za termin.
 */

export type Range = { startMin: number; endMin: number };

export const MINUTES_PER_DAY = 24 * 60;

/** "10:30" → 630 */
export function toMin(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) throw new Error(`Bad time: ${hhmm}`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) throw new Error(`Bad time: ${hhmm}`);
  return h * 60 + min;
}

/** 630 → "10:30" */
export function fmt(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** 630, 705 → "10:30–11:45" */
export function fmtRange(startMin: number, endMin: number): string {
  return `${fmt(startMin)}–${fmt(endMin)}`;
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const t = Date.parse(`${date}T12:00:00Z`);
  if (Number.isNaN(t)) return false;
  return new Date(t).toISOString().slice(0, 10) === date;
}

/** Dan u nedelji nezavisan od vremenske zone: 0 = nedelja … 6 = subota. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** `YYYY-MM-DD` + n dana (n može biti negativan). */
export function addDays(date: string, n: number): string {
  const t = Date.parse(`${date}T12:00:00Z`) + n * 24 * 60 * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Broj dana od `a` do `b` (b − a). */
export function diffDays(a: string, b: string): number {
  const ta = Date.parse(`${a}T12:00:00Z`);
  const tb = Date.parse(`${b}T12:00:00Z`);
  return Math.round((tb - ta) / (24 * 60 * 60 * 1000));
}

/** Ponedeljak nedelje u kojoj je `date`. */
export function startOfWeek(date: string): string {
  const wd = weekdayOf(date); // 0 = nedelja
  const back = wd === 0 ? 6 : wd - 1;
  return addDays(date, -back);
}

/**
 * Trenutni datum i minuti od ponoći u Europe/Belgrade.
 * Radi u Node-u, browseru i Convex runtime-u (svi imaju Intl sa tz podacima).
 */
export function belgradeNow(nowMs: number = Date.now()): { date: string; minutes: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(nowMs));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "00";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return { date, minutes: hour * 60 + minute, weekday: weekdayOf(date) };
}

export function overlaps(a: Range, b: Range): boolean {
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

/** Sortira opsege i spaja one koji se dodiruju ili preklapaju. */
export function normalizeRanges(ranges: readonly Range[]): Range[] {
  const sorted = ranges
    .filter((r) => r.endMin > r.startMin)
    .map((r) => ({ startMin: r.startMin, endMin: r.endMin }))
    .sort((a, b) => a.startMin - b.startMin);
  const out: Range[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.startMin <= last.endMin) {
      last.endMin = Math.max(last.endMin, r.endMin);
    } else {
      out.push({ ...r });
    }
  }
  return out;
}

export type BuildDaySlotsArgs = {
  /** Radno vreme tog dana (već razrešeno: izuzetak ili nedeljni raspored). */
  workRanges: readonly Range[];
  /** Pauze + zahtevi na čekanju + potvrđeni termini tog frizera. */
  busyRanges: readonly Range[];
  durationMin: number;
  stepMin: number;
  /** Najraniji dozvoljeni početak (najava za današnji dan); izostavi ili 0 za ostale dane. */
  minStartMin?: number;
};

/**
 * Svi počeci `s` takvi da `[s, s + durationMin)` leži unutar JEDNOG radnog opsega,
 * ne seče nijedan zauzet opseg i `s >= minStartMin`. Počeci su poravnati na
 * mrežu `stepMin` računato od ponoći.
 */
export function buildDaySlots({ workRanges, busyRanges, durationMin, stepMin, minStartMin = 0 }: BuildDaySlotsArgs): number[] {
  if (!(durationMin > 0) || !(stepMin > 0)) return [];
  const work = normalizeRanges(workRanges);
  const busy = normalizeRanges(busyRanges);
  const out: number[] = [];
  for (const w of work) {
    // Poravnanje na mrežu od ponoći, pa je 10:00 → 10:00, 10:30 … i kad opseg
    // počinje u "čudnom" minutu.
    let s = Math.ceil(w.startMin / stepMin) * stepMin;
    for (; s + durationMin <= w.endMin; s += stepMin) {
      if (s < minStartMin) continue;
      const slot = { startMin: s, endMin: s + durationMin };
      if (busy.some((b) => overlaps(slot, b))) continue;
      out.push(s);
    }
  }
  return Array.from(new Set(out)).sort((a, b) => a - b);
}

/** Zaokruži `minutes` naviše na sledeći umnožak `stepMin`. */
export function ceilToStep(minutes: number, stepMin: number): number {
  return Math.ceil(minutes / stepMin) * stepMin;
}

/** Najraniji početak za dan uz najavu (ili 0 ako nije danas; null ako je dan prošao). */
export function minStartFor(now: { date: string; minutes: number }, date: string, leadTimeMin: number): number | null {
  if (date < now.date) return null; // prošli dan: ništa se ne može zakazati
  if (date > now.date) return 0;
  return now.minutes + leadTimeMin;
}

export const PREPODNE_END_MIN = 14 * 60;

/** Podeli početke na „Prepodne" (< 14:00) i „Popodne". */
export function groupByPartOfDay(starts: readonly number[]): { prepodne: number[]; popodne: number[] } {
  const prepodne: number[] = [];
  const popodne: number[] = [];
  for (const s of starts) (s < PREPODNE_END_MIN ? prepodne : popodne).push(s);
  return { prepodne, popodne };
}
