import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { assertAdminKey } from "./lib/admin";
import { serviceByKey, type ServiceOverride } from "./lib/availability";
import { MESSAGES } from "./lib/validate";

export const MAX_PRICE = 1_000_000;

/**
 * Javno: izmene usluga iz admin panela (trajanje, cena „od", sakriveno), da
 * birač termina prikazuje isto što motor dostupnosti koristi.
 * Vraća samo polja koja su promenjena u odnosu na lib/booking.ts.
 */
export const overrides = query({
  args: {},
  returns: v.array(
    v.object({
      serviceKey: v.string(),
      durationMin: v.optional(v.number()),
      priceFrom: v.optional(v.number()),
      hidden: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db.query("serviceOverrides").take(100);
    return rows.map((r) => ({
      serviceKey: r.serviceKey,
      ...(r.durationMin !== undefined ? { durationMin: r.durationMin } : {}),
      ...(r.priceFrom !== undefined ? { priceFrom: r.priceFrom } : {}),
      ...(r.hidden ? { hidden: true } : {}),
    }));
  },
});

/**
 * Upiše izmenu i normalizuje red: polje jednako podrazumevanom se briše, a red
 * bez ijednog odstupanja se uklanja — tako `overrides` vraća samo prave izmene.
 */
async function patchOverride(ctx: MutationCtx, serviceKey: string, patch: ServiceOverride): Promise<void> {
  const service = serviceByKey(serviceKey);
  if (!service) throw new ConvexError(MESSAGES.service);
  const existing = await ctx.db
    .query("serviceOverrides")
    .withIndex("by_serviceKey", (q) => q.eq("serviceKey", serviceKey))
    .first();

  const merged: ServiceOverride = {
    durationMin: "durationMin" in patch ? patch.durationMin : existing?.durationMin,
    priceFrom: "priceFrom" in patch ? patch.priceFrom : existing?.priceFrom,
    hidden: "hidden" in patch ? patch.hidden : existing?.hidden,
  };
  const durationMin = merged.durationMin === service.durationMin ? undefined : merged.durationMin;
  const priceFrom = merged.priceFrom === (service.priceFrom ?? undefined) ? undefined : merged.priceFrom;
  const hidden = merged.hidden ? true : undefined;

  if (durationMin === undefined && priceFrom === undefined && hidden === undefined) {
    if (existing) await ctx.db.delete("serviceOverrides", existing._id);
    return;
  }
  const doc = { serviceKey, durationMin, priceFrom, hidden };
  if (existing) await ctx.db.replace("serviceOverrides", existing._id, doc);
  else await ctx.db.insert("serviceOverrides", doc);
}

export const setDuration = mutation({
  args: { key: v.string(), serviceKey: v.string(), durationMin: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    if (!Number.isInteger(args.durationMin) || args.durationMin < 5 || args.durationMin > 8 * 60) {
      throw new ConvexError(MESSAGES.range);
    }
    await patchOverride(ctx, args.serviceKey, { durationMin: args.durationMin });
    return null;
  },
});

/** Cena „od" u dinarima; `null` briše cenu (usluga se prikazuje bez cene). */
export const setPrice = mutation({
  args: { key: v.string(), serviceKey: v.string(), priceFrom: v.union(v.number(), v.null()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    if (args.priceFrom !== null && (!Number.isInteger(args.priceFrom) || args.priceFrom < 0 || args.priceFrom > MAX_PRICE)) {
      throw new ConvexError(MESSAGES.price);
    }
    await patchOverride(ctx, args.serviceKey, { priceFrom: args.priceFrom ?? undefined });
    return null;
  },
});

/** `hidden: true` sklanja uslugu iz zakazivanja na sajtu (ručni upis u kalendar i dalje radi). */
export const setHidden = mutation({
  args: { key: v.string(), serviceKey: v.string(), hidden: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    await patchOverride(ctx, args.serviceKey, { hidden: args.hidden });
    return null;
  },
});
