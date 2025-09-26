import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user profile already exists
    const existingProfile = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, {
        email: args.email || existingProfile.email,
        firstName: args.name?.split(" ")[0] || existingProfile.firstName,
        lastName: args.name?.split(" ").slice(1).join(" ") || existingProfile.lastName,
        profilePicture: args.image || existingProfile.profilePicture,
        lastLoginAt: Date.now(),
      });
      return existingProfile._id;
    }

    // Create new profile
    const names = args.name?.split(" ") || [];
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";

    const profileId = await ctx.db.insert("users", {
      userId,
      email: args.email || "",
      firstName,
      lastName,
      profilePicture: args.image,
      role: args.role || "customer",
      accountStatus: "active",
      provider: "oauth",
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    });

    return profileId;
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    return userProfile;
  },
});