import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    image: v.string(),
    clerkId: v.string(),
  }).index("by_clerk_id", ["clerkId"])
    .searchIndex("search_username", { searchField: "username" })
    .searchIndex("search_image", { searchField: "image" }),
  messages: defineTable({
    sender: v.string(),
    content: v.string(),
  }),
});