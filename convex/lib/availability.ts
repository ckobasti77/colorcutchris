/**
 * Jezgro dostupnosti: iz baze razrešava radno vreme, zauzeća i podešavanja i
 * prosleđuje ih čistom `buildDaySlots` iz lib/slots.ts.
 * Koriste ga i upiti (čitanje) i mutacija `bookings.request` (ponovna provera
 * slota unutar transakcije — to je ono što čini dupli termin nemogućim).
 */
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { bookableServices, staffMembers, type StaffKey } from "../../lib/booking";
import { site } from "../../lib/site";
import { belgradeNow, buildDaySlots, diffDays, minStartFor, toMin, weekdayOf, type Range } from "../../lib/slots";

export type Ctx = QueryCtx | MutationCtx;

export const DEFAULT_SETTINGS = {
  slotStepMin: 30,
  leadTimeMin: 120,
  horizonDays: 30,
  holdHours: 48,
} as const;

export type Settings = {
  slotStepMin: number;
  leadTimeMin: number;
  horizonDays: number;
  holdHours: number;
  hoursConfirmed: boolean;
};

/** Podrazumevano nedeljno radno vreme iz lib/site.ts (uto–pet 09–19, sub 10–17, ned i pon zatvoreno). */
export const DEFAULT_WEEK: readonly (readonly Range[])[] = site.workWeek.map((day) =>
  day.map((r) => ({ startMin: toMin(r.start), endMin: toMin(r.end) })),
);

export const MAX_SCHEDULE_ROWS = 10;
export const MAX_BLOCKS_PER_DAY = 50;
export const MAX_BOOKINGS_PER_DAY = 200;

export async function getSettings(ctx: Ctx): Promise<Settings> {
  const doc = await ctx.db.query("settings").first();
  if (!doc) return { ...DEFAULT_SETTINGS, hoursConfirmed: false };
  return {
    slotStepMin: doc.slotStepMin,
    leadTimeMin: doc.leadTimeMin,
    horizonDays: doc.horizonDays,
    holdHours: doc.holdHours,
    hoursConfirmed: doc.hoursConfirmed ?? false,
  };
}

/** true kad je `admin.init` prošao (postoje redovi u `staff`). Pre toga važe podrazumevane vrednosti iz koda. */
export async function isSeeded(ctx: Ctx): Promise<boolean> {
  return (await ctx.db.query("staff").first()) !== null;
}

export async function activeStaffKeys(ctx: Ctx): Promise<StaffKey[]> {
  const rows = await ctx.db.query("staff").take(10);
  if (rows.length === 0) return staffMembers.map((s) => s.key);
  return rows
    .filter((r) => r.active)
    .sort((a, b) => a.order - b.order)
    .map((r) => r.key);
}

export function serviceByKey(serviceKey: string) {
  return bookableServices.find((s) => s.key === serviceKey);
}

export type ServiceOverride = { durationMin?: number; priceFrom?: number; hidden?: boolean };

export async function getServiceOverride(ctx: Ctx, serviceKey: string): Promise<ServiceOverride | null> {
  const row = await ctx.db
    .query("serviceOverrides")
    .withIndex("by_serviceKey", (q) => q.eq("serviceKey", serviceKey))
    .first();
  if (!row) return null;
  return { durationMin: row.durationMin, priceFrom: row.priceFrom, hidden: row.hidden };
}

/** Admin izmena (serviceOverrides) ili podrazumevano iz lib/booking.ts. `null` za nepoznatu uslugu. */
export async function resolveDuration(ctx: Ctx, serviceKey: string): Promise<number | null> {
  const service = serviceByKey(serviceKey);
  if (!service) return null;
  const override = await getServiceOverride(ctx, serviceKey);
  return override?.durationMin ?? service.durationMin;
}

/** Cena „od" (din) — admin izmena ili podrazumevano; `null` kad cena nije određena. */
export async function resolvePrice(ctx: Ctx, serviceKey: string): Promise<number | null> {
  const service = serviceByKey(serviceKey);
  if (!service) return null;
  const override = await getServiceOverride(ctx, serviceKey);
  return override?.priceFrom ?? service.priceFrom;
}

/** Usluga isključena iz zakazivanja na sajtu (admin je i dalje može ručno upisati). */
export async function isServiceHidden(ctx: Ctx, serviceKey: string): Promise<boolean> {
  const override = await getServiceOverride(ctx, serviceKey);
  return override?.hidden === true;
}

/** Radno vreme frizera za datum: izuzetak ima prednost, pa nedeljni raspored, pa podrazumevano pre seed-a. */
export async function workRangesFor(ctx: Ctx, staffKey: StaffKey, date: string): Promise<Range[]> {
  const override = await ctx.db
    .query("scheduleOverrides")
    .withIndex("by_staff_date", (q) => q.eq("staffKey", staffKey).eq("date", date))
    .first();
  if (override) {
    if (override.kind === "off") return [];
    if (override.startMin === undefined || override.endMin === undefined) return [];
    return [{ startMin: override.startMin, endMin: override.endMin }];
  }
  const weekday = weekdayOf(date);
  const rows = await ctx.db
    .query("schedules")
    .withIndex("by_staff_weekday", (q) => q.eq("staffKey", staffKey).eq("weekday", weekday))
    .take(MAX_SCHEDULE_ROWS);
  if (rows.length === 0 && !(await isSeeded(ctx))) {
    return DEFAULT_WEEK[weekday].map((r) => ({ ...r }));
  }
  return rows.map((r) => ({ startMin: r.startMin, endMin: r.endMin }));
}

/** Pauze + zahtevi na čekanju + potvrđeni termini frizera tog dana. */
export async function busyRangesFor(ctx: Ctx, staffKey: StaffKey, date: string): Promise<Range[]> {
  const blocks = await ctx.db
    .query("blocks")
    .withIndex("by_staff_date", (q) => q.eq("staffKey", staffKey).eq("date", date))
    .take(MAX_BLOCKS_PER_DAY);
  const bookings = await ctx.db
    .query("bookings")
    .withIndex("by_staff_date", (q) => q.eq("staffKey", staffKey).eq("date", date))
    .take(MAX_BOOKINGS_PER_DAY);
  const busy: Range[] = blocks.map((b) => ({ startMin: b.startMin, endMin: b.endMin }));
  for (const b of bookings) {
    if (b.status !== "nov" && b.status !== "potvrdjen") continue;
    busy.push({ startMin: b.startMin, endMin: b.endMin });
  }
  return busy;
}

export type SlotsForArgs = {
  staffKey: StaffKey;
  date: string;
  durationMin: number;
  settings: Settings;
  /** Sat u ms — prosleđuje pozivalac (klijent za upite, Date.now() u mutacijama). */
  nowMs: number;
};

/** Slobodni počeci (minuti) za jednog frizera na jedan datum. */
export async function slotsFor(ctx: Ctx, { staffKey, date, durationMin, settings, nowMs }: SlotsForArgs): Promise<number[]> {
  const now = belgradeNow(nowMs);
  const minStartMin = minStartFor(now, date, settings.leadTimeMin);
  if (minStartMin === null) return [];
  if (diffDays(now.date, date) > settings.horizonDays) return [];
  const workRanges = await workRangesFor(ctx, staffKey, date);
  if (workRanges.length === 0) return [];
  const busyRanges = await busyRangesFor(ctx, staffKey, date);
  return buildDaySlots({ workRanges, busyRanges, durationMin, stepMin: settings.slotStepMin, minStartMin });
}

/** Broj zahteva na čekanju + potvrđenih termina frizera tog dana (balansiranje „Svejedno" kad ima više frizera). */
export async function countBookingsOn(ctx: Ctx, staffKey: StaffKey, date: string): Promise<number> {
  const rows = await ctx.db
    .query("bookings")
    .withIndex("by_staff_date", (q) => q.eq("staffKey", staffKey).eq("date", date))
    .take(MAX_BOOKINGS_PER_DAY);
  return rows.filter((b) => b.status === "nov" || b.status === "potvrdjen").length;
}

/** Frizeri koji rade uslugu, suženo na traženog ako je zadat. */
export async function candidateStaff(
  ctx: Ctx,
  serviceKey: string,
  staffKey: StaffKey | "any" | undefined,
): Promise<StaffKey[]> {
  const service = serviceByKey(serviceKey);
  if (!service) return [];
  const active = await activeStaffKeys(ctx);
  const allowed = service.staff.filter((k) => active.includes(k));
  if (!staffKey || staffKey === "any") return [...allowed];
  return allowed.includes(staffKey) ? [staffKey] : [];
}
