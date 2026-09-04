import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import schema, { staffKeyValidator } from "./schema";
import { assertAdminKey } from "./lib/admin";
import { MESSAGES, validateRanges } from "./lib/validate";
import { staffMembers } from "../lib/booking";
import { isValidDate } from "../lib/slots";

/** Pauze svih frizera za jedan datum (dnevni prikaz u admin kalendaru). */
export const listDay = query({
  args: { key: v.string(), date: v.string() },
  returns: v.array(schema.doc("blocks")),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    const out = [];
    for (const { key: staffKey } of staffMembers) {
      const rows = await ctx.db
        .query("blocks")
        .withIndex("by_staff_date", (q) => q.eq("staffKey", staffKey).eq("date", args.date))
        .take(50);
      out.push(...rows);
    }
    return out;
  },
});

export const add = mutation({
  args: {
    key: v.string(),
    staffKey: staffKeyValidator,
    date: v.string(),
    startMin: v.number(),
    endMin: v.number(),
    reason: v.optional(v.string()),
  },
  returns: v.id("blocks"),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    if (!isValidDate(args.date)) throw new ConvexError(MESSAGES.dateFormat);
    validateRanges([{ startMin: args.startMin, endMin: args.endMin }]);
    return await ctx.db.insert("blocks", {
      staffKey: args.staffKey,
      date: args.date,
      startMin: args.startMin,
      endMin: args.endMin,
      reason: args.reason?.trim().slice(0, 120) || undefined,
    });
  },
});

export const remove = mutation({
  args: { key: v.string(), id: v.id("blocks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    const doc = await ctx.db.get("blocks", args.id);
    if (doc) await ctx.db.delete("blocks", args.id);
    return null;
  },
});
