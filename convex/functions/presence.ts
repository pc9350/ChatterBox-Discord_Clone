import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./helpers";

export const upsert = authenticatedMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("user", ctx.user._id))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { online: true, lastSeen: Date.now() });
    } else {
      await ctx.db.insert("presence", {
        user: ctx.user._id,
        online: true,
        lastSeen: Date.now(),
      });
    }
  },
});

export const setOffline = authenticatedMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("user", ctx.user._id))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { online: false, lastSeen: Date.now() });
    }
  },
});

export const get = authenticatedQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const pres = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("user", userId))
      .unique();
    if (!pres) return { online: false, lastSeen: 0 };
    // Consider offline if last seen > 60 seconds ago
    const isOnline = pres.online && Date.now() - pres.lastSeen < 60_000;
    return { online: isOnline, lastSeen: pres.lastSeen };
  },
});
