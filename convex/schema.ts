import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Frizeri koji primaju termine. Trenutno samo Chris; kad dođe drugi, ovde se
 * doda literal (npr. `v.union(v.literal("chris"), v.literal("ana"))`) i red u
 * `lib/booking.ts → staffMembers`. Sav ostali kod je već generički.
 */
export const staffKeyValidator = v.literal("chris");

export const statusValidator = v.union(
  v.literal("nov"),
  v.literal("potvrdjen"),
  v.literal("otkazan"),
  v.literal("odbijen"),
);
export const sourceValidator = v.union(v.literal("web"), v.literal("admin"));
export const overrideKindValidator = v.union(v.literal("off"), v.literal("custom"));

export const rangeValidator = v.object({ startMin: v.number(), endMin: v.number() });

export default defineSchema({
  staff: defineTable({
    key: staffKeyValidator,
    name: v.string(),
    active: v.boolean(),
    order: v.number(),
  }).index("by_key", ["key"]),

  /** Nedeljno radno vreme. Više redova za isti dan = podeljena smena. */
  schedules: defineTable({
    staffKey: staffKeyValidator,
    /** 0 = nedelja … 6 = subota */
    weekday: v.number(),
    startMin: v.number(),
    endMin: v.number(),
  }).index("by_staff_weekday", ["staffKey", "weekday"]),

  /** Izuzetak za datum: slobodan dan ili posebno radno vreme (npr. radna nedelja). Ima prednost nad `schedules`. */
  scheduleOverrides: defineTable({
    staffKey: staffKeyValidator,
    /** YYYY-MM-DD */
    date: v.string(),
    kind: overrideKindValidator,
    startMin: v.optional(v.number()),
    endMin: v.optional(v.number()),
    note: v.optional(v.string()),
  })
    .index("by_staff_date", ["staffKey", "date"])
    .index("by_date", ["date"]),

  /** Pauze / blokirano vreme unutar radnog dana. */
  blocks: defineTable({
    staffKey: staffKeyValidator,
    date: v.string(),
    startMin: v.number(),
    endMin: v.number(),
    reason: v.optional(v.string()),
  }).index("by_staff_date", ["staffKey", "date"]),

  bookings: defineTable({
    name: v.string(),
    /** Normalizovan broj (bez razmaka/crtica); prazan string za ručne termine bez telefona. */
    phone: v.string(),
    serviceKey: v.string(),
    /** Naslov usluge u trenutku zahteva (da istorija ostane čitljiva i ako se lista promeni). */
    serviceTitle: v.string(),
    durationMin: v.number(),
    staffKey: staffKeyValidator,
    /** YYYY-MM-DD */
    date: v.string(),
    startMin: v.number(),
    endMin: v.number(),
    note: v.optional(v.string()),
    status: statusValidator,
    createdAt: v.number(),
    decidedAt: v.optional(v.number()),
    source: sourceValidator,
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status"])
    .index("by_phone", ["phone"])
    .index("by_staff_date", ["staffKey", "date"])
    .index("by_date", ["date"]),

  /** Jedan dokument. */
  settings: defineTable({
    slotStepMin: v.number(),
    leadTimeMin: v.number(),
    horizonDays: v.number(),
    holdHours: v.number(),
    /** Postavlja se kad Chris prvi put sačuva radno vreme (skriva baner „Podesi radno vreme"). */
    hoursConfirmed: v.optional(v.boolean()),
  }),

  /** Izmene usluga iz admin panela; podrazumevane vrednosti su u lib/booking.ts. */
  serviceOverrides: defineTable({
    serviceKey: v.string(),
    durationMin: v.optional(v.number()),
    /** Cena „od" u dinarima. */
    priceFrom: v.optional(v.number()),
    /** true = usluga se ne nudi u zakazivanju na sajtu (admin je i dalje može upisati ručno). */
    hidden: v.optional(v.boolean()),
  }).index("by_serviceKey", ["serviceKey"]),
});
