import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdminKey } from "./lib/admin";
import { DEFAULT_SETTINGS, DEFAULT_WEEK, getSettings, isSeeded } from "./lib/availability";
// (isSeeded ostaje za `status`; `init` proverava svakog frizera posebno)
import { staffMembers } from "../lib/booking";

/** Da li je baza inicijalizovana i da li Chris tek treba da podesi radno vreme. */
export const status = query({
  args: { key: v.string() },
  returns: v.object({ seeded: v.boolean(), hoursConfirmed: v.boolean() }),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    const seeded = await isSeeded(ctx);
    const settings = await getSettings(ctx);
    return { seeded, hoursConfirmed: settings.hoursConfirmed };
  },
});

/**
 * Idempotentni seed: frizeri, podrazumevano nedeljno radno vreme, podešavanja.
 * Admin panel ga poziva sam pri prvom otvaranju (postoji i dugme „Inicijalizuj").
 */
export const init = mutation({
  args: { key: v.string() },
  returns: v.object({ seededStaff: v.boolean(), seededSchedules: v.boolean(), seededSettings: v.boolean() }),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    const result = { seededStaff: false, seededSchedules: false, seededSettings: false };

    // Po frizeru, ne „sve ili ništa": kad se u lib/booking.ts doda drugi frizer,
    // sledeći init mu upiše red i podrazumevano radno vreme, a Chrisove ne dira.
    const existingStaff = await ctx.db.query("staff").take(10);
    const existingKeys = new Set(existingStaff.map((s) => s.key));
    for (const s of staffMembers) {
      if (existingKeys.has(s.key)) continue;
      await ctx.db.insert("staff", { key: s.key, name: s.name, active: true, order: s.order });
      result.seededStaff = true;
    }

    for (const s of staffMembers) {
      const anySchedule = await ctx.db
        .query("schedules")
        .withIndex("by_staff_weekday", (q) => q.eq("staffKey", s.key))
        .first();
      if (anySchedule) continue;
      for (let weekday = 0; weekday < 7; weekday++) {
        for (const r of DEFAULT_WEEK[weekday]) {
          await ctx.db.insert("schedules", { staffKey: s.key, weekday, startMin: r.startMin, endMin: r.endMin });
        }
      }
      result.seededSchedules = true;
    }

    const settings = await ctx.db.query("settings").first();
    if (!settings) {
      await ctx.db.insert("settings", { ...DEFAULT_SETTINGS, hoursConfirmed: false });
      result.seededSettings = true;
    }

    return result;
  },
});
