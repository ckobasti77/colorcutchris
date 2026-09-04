import { v } from "convex/values";
import { query } from "./_generated/server";
import { staffKeyValidator } from "./schema";
import { candidateStaff, getSettings, isServiceHidden, resolveDuration, slotsFor, workRangesFor } from "./lib/availability";
import { addDays, isValidDate } from "../lib/slots";

const staffArg = v.optional(v.union(staffKeyValidator, v.literal("any")));

/**
 * Slobodni počeci (minuti od ponoći) po frizeru za jedan datum.
 * `now` šalje klijent (zaokružen na 5 min) da upit ostane keširan i reaktivan
 * bez čitanja sata na serveru.
 */
export const day = query({
  args: {
    date: v.string(),
    serviceKey: v.string(),
    staffKey: staffArg,
    now: v.number(),
  },
  returns: v.array(v.object({ staffKey: staffKeyValidator, slots: v.array(v.number()) })),
  handler: async (ctx, args) => {
    if (!isValidDate(args.date)) return [];
    if (await isServiceHidden(ctx, args.serviceKey)) return [];
    const durationMin = await resolveDuration(ctx, args.serviceKey);
    if (durationMin === null) return [];
    const settings = await getSettings(ctx);
    const staff = await candidateStaff(ctx, args.serviceKey, args.staffKey);
    const out: { staffKey: (typeof staff)[number]; slots: number[] }[] = [];
    for (const staffKey of staff) {
      const slots = await slotsFor(ctx, { staffKey, date: args.date, durationMin, settings, nowMs: args.now });
      out.push({ staffKey, slots });
    }
    return out;
  },
});

/**
 * Za 7 dana od `startDate`: broj slobodnih početaka (unija po frizerima) i da li
 * salon tog dana uopšte radi — WeekStrip po tome zatamnjuje dane i ispisuje
 * „zatvoreno" naspram „nema termina".
 */
export const week = query({
  args: {
    startDate: v.string(),
    serviceKey: v.string(),
    staffKey: staffArg,
    now: v.number(),
  },
  returns: v.array(v.object({ date: v.string(), count: v.number(), open: v.boolean() })),
  handler: async (ctx, args) => {
    if (!isValidDate(args.startDate)) return [];
    const hidden = await isServiceHidden(ctx, args.serviceKey);
    const durationMin = hidden ? null : await resolveDuration(ctx, args.serviceKey);
    const settings = await getSettings(ctx);
    const staff = durationMin === null ? [] : await candidateStaff(ctx, args.serviceKey, args.staffKey);
    const out: { date: string; count: number; open: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(args.startDate, i);
      const union = new Set<number>();
      let open = false;
      for (const staffKey of staff) {
        if ((await workRangesFor(ctx, staffKey, date)).length > 0) open = true;
        if (durationMin !== null) {
          const slots = await slotsFor(ctx, { staffKey, date, durationMin, settings, nowMs: args.now });
          for (const s of slots) union.add(s);
        }
      }
      out.push({ date, count: union.size, open });
    }
    return out;
  },
});
