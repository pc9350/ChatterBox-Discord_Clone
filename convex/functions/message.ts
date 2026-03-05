import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { authenticatedMutation, authenticatedQuery } from "./helpers";
import { internal } from "../_generated/api";

export const list = authenticatedQuery({
  args: {
    directMessage: v.id("directMessages"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { directMessage, paginationOpts }) => {
    const member = await ctx.db
      .query("directMessageMembers")
      .withIndex("by_direct_message_user", (q) =>
        q.eq("directMessage", directMessage).eq("user", ctx.user._id)
      )
      .first();
    if (!member) throw new Error("You are not a member of this direct message");
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_direct_message", (q) =>
        q.eq("directMessage", directMessage)
      )
      .order("desc")
      .paginate(paginationOpts);

    const page = await Promise.all(
      messages.page.map(async (message) => {
        const sender = await ctx.db.get(message.sender);
        const attachment = message.attachment
          ? await ctx.storage.getUrl(message.attachment)
          : undefined;
        return { ...message, sender, attachment };
      })
    );
    return { ...messages, page };
  },
});

export const create = authenticatedMutation({
  args: {
    content: v.string(),
    attachment: v.optional(v.id("_storage")),
    directMessage: v.id("directMessages"),
  },
  handler: async (ctx, { content, attachment, directMessage }) => {
    if (content.length > 2000)
      throw new Error("Message cannot exceed 2000 characters");
    const member = await ctx.db
      .query("directMessageMembers")
      .withIndex("by_direct_message_user", (q) =>
        q.eq("directMessage", directMessage).eq("user", ctx.user._id)
      )
      .first();
    if (!member) throw new Error("You are not a member of this direct message");
    await ctx.db.insert("messages", {
      content,
      attachment,
      directMessage,
      sender: ctx.user._id,
      reactions: [],
    });
    await ctx.scheduler.runAfter(0, internal.functions.typing.remove, {
      directMessage,
      user: ctx.user._id,
    });
  },
});

export const update = authenticatedMutation({
  args: {
    id: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, { id, content }) => {
    if (content.length > 2000)
      throw new Error("Message cannot exceed 2000 characters");
    const message = await ctx.db.get(id);
    if (!message) throw new Error("Message does not exist");
    if (message.sender !== ctx.user._id)
      throw new Error("You are not the sender of this message");
    await ctx.db.patch(id, { content, edited: true });
  },
});

export const remove = authenticatedMutation({
  args: {
    id: v.id("messages"),
  },
  handler: async (ctx, { id }) => {
    const message = await ctx.db.get(id);
    if (!message) throw new Error("Message does not exist");
    else if (message.sender !== ctx.user._id) {
      throw new Error("You are not the sender of this message");
    }
    await ctx.db.delete(id);
    if (message.attachment) {
      await ctx.storage.delete(message.attachment);
    }
  },
});

export const toggleReaction = authenticatedMutation({
  args: {
    id: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, { id, emoji }) => {
    const message = await ctx.db.get(id);
    if (!message) throw new Error("Message does not exist");
    const reactions = message.reactions ?? [];
    const existing = reactions.find((r) => r.emoji === emoji);
    if (existing) {
      const hasUser = existing.users.includes(ctx.user._id);
      const updatedUsers = hasUser
        ? existing.users.filter((u) => u !== ctx.user._id)
        : [...existing.users, ctx.user._id];
      const updatedReactions =
        updatedUsers.length === 0
          ? reactions.filter((r) => r.emoji !== emoji)
          : reactions.map((r) =>
              r.emoji === emoji ? { ...r, users: updatedUsers } : r
            );
      await ctx.db.patch(id, { reactions: updatedReactions });
    } else {
      await ctx.db.patch(id, {
        reactions: [...reactions, { emoji, users: [ctx.user._id] }],
      });
    }
  },
});

export const generateUploadUrl = authenticatedMutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
