/**
 * Formatiranje datuma (`YYYY-MM-DD`) na srpskom, latinicom. Europe/Belgrade se
 * podrazumeva — formatiramo fiksni UTC podnevni trenutak, pa se kalendarski dan
 * nikad ne pomera.
 */
const LOCALE = "sr-Latn-RS";

function noon(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

const dayLong = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" });
const weekdayShort = new Intl.DateTimeFormat(LOCALE, { weekday: "short", timeZone: "UTC" });
const weekdayLong = new Intl.DateTimeFormat(LOCALE, { weekday: "long", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", timeZone: "UTC" });
const numeric = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Belgrade",
});

/** "četvrtak, 3. septembar" */
export function formatDayLong(date: string): string {
  return dayLong.format(noon(date));
}

/** "3. septembar" */
export function formatDayMonth(date: string): string {
  return dayMonth.format(noon(date));
}

/** "septembar 2026." */
export function formatMonthYear(date: string): string {
  return monthYear.format(noon(date));
}

/** "ČET" */
export function formatWeekdayShort(date: string): string {
  return weekdayShort.format(noon(date)).replace(/\.$/, "").toUpperCase();
}

/** "četvrtak" */
export function formatWeekdayLong(date: string): string {
  return weekdayLong.format(noon(date));
}

/** "03" */
export function formatDayNumber(date: string): string {
  return date.slice(8, 10);
}

/** "03.09.2026." */
export function formatNumeric(date: string): string {
  return numeric.format(noon(date));
}

/** Trenutak (ms) → "03.09.2026. 17:33" po Beogradu — za „primljeno" u admin panelu. */
export function formatDateTime(ms: number): string {
  return dateTime.format(new Date(ms));
}

/** Nazivi dana od ponedeljka, za admin uređivač radnog vremena: ["ponedeljak", …, "nedelja"] */
export const WEEKDAYS_MON_FIRST: readonly { weekday: number; label: string }[] = [1, 2, 3, 4, 5, 6, 0].map((weekday) => ({
  weekday,
  // 2026-09-06 je nedelja; idemo unapred da svaki indeks dana dobije pravi datum.
  label: formatWeekdayLong(`2026-09-${String(6 + weekday).padStart(2, "0")}`),
}));
