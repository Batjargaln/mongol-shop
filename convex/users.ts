import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple hash function for demo purposes - in production use proper bcrypt
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

export const registerUser = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.optional(v.string()), // "customer", "seller" - admin created separately
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Seller-specific fields
    businessName: v.optional(v.string()),
    businessType: v.optional(v.string()),
    businessDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if username already exists
    const existingUserByUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existingUserByUsername) {
      throw new Error("Username already exists");
    }

    // Check if email already exists
    const existingUserByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUserByEmail) {
      throw new Error("Email already exists");
    }

    // Hash the password (simple hash for demo - use bcrypt in production)
    const passwordHash = simpleHash(args.password);

    // Set default role if not provided
    const role = args.role || "customer";

    // Validate role
    if (!["customer", "seller"].includes(role)) {
      throw new Error("Invalid role. Must be 'customer' or 'seller'");
    }

    // Set account status
    let accountStatus = "active";
    if (role === "seller") {
      accountStatus = "pending_verification"; // Sellers need verification
    }

    // Create the user
    const userData: any = {
      username: args.username,
      email: args.email,
      passwordHash,
      provider: "local",
      role,
      accountStatus,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      createdAt: Date.now(),
    };

    // Add seller-specific fields if role is seller
    if (role === "seller") {
      userData.businessName = args.businessName;
      userData.businessType = args.businessType || "individual";
      userData.businessDescription = args.businessDescription;
      userData.businessVerified = false;
      userData.rating = 0;
      userData.totalSales = 0;
      userData.totalOrders = 0;
    }

    const userId = await ctx.db.insert("users", userData);

    return {
      userId,
      username: args.username,
      role,
      accountStatus
    };
  },
});

export const registerOAuthUser = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePicture: v.optional(v.string()),
    provider: v.string(), // "google" or "facebook"
    providerId: v.string(),
    role: v.optional(v.string()), // Default to "customer"
  },
  handler: async (ctx, args) => {
    // Check if user already exists with this provider
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_provider_id", (q) =>
        q.eq("provider", args.provider).eq("providerId", args.providerId)
      )
      .first();

    if (existingUser) {
      // Update last login time
      await ctx.db.patch(existingUser._id, {
        lastLoginAt: Date.now(),
      });
      return {
        userId: existingUser._id,
        username: existingUser.username,
        role: existingUser.role
      };
    }

    // Check if email already exists with different provider
    const existingUserByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUserByEmail) {
      throw new Error("An account with this email already exists");
    }

    // Generate username from email or name
    let username = args.firstName || args.email.split('@')[0];

    // Ensure username is unique
    let counter = 1;
    let finalUsername = username;
    while (await ctx.db.query("users").withIndex("by_username", (q) => q.eq("username", finalUsername)).first()) {
      finalUsername = `${username}${counter}`;
      counter++;
    }

    const role = args.role || "customer";

    // Create the user
    const userId = await ctx.db.insert("users", {
      username: finalUsername,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      profilePicture: args.profilePicture,
      provider: args.provider,
      providerId: args.providerId,
      role,
      accountStatus: "active", // OAuth users start as active
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    });

    return { userId, username: finalUsername, role };
  },
});

// Admin functions
export const createAdmin = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    adminPermissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // This would typically require admin authentication
    const passwordHash = simpleHash(args.password);

    const userId = await ctx.db.insert("users", {
      username: args.username,
      email: args.email,
      passwordHash,
      firstName: args.firstName,
      lastName: args.lastName,
      provider: "local",
      role: "admin",
      accountStatus: "active",
      adminPermissions: args.adminPermissions,
      createdAt: Date.now(),
    });

    return { userId, username: args.username, role: "admin" };
  },
});

// Utility queries
export const getUsersByRole = query({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();
  },
});

export const getPendingSellers = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_account_status", (q) => q.eq("accountStatus", "pending_verification"))
      .filter((q) => q.eq(q.field("role"), "seller"))
      .collect();
  },
});

export const loginUser = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by username
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) {
      throw new Error("Invalid username or password");
    }

    // Check if user uses local authentication (has password)
    if (!user.passwordHash) {
      throw new Error("This account uses social login. Please login with Google or Facebook.");
    }

    // Verify password
    const passwordHash = simpleHash(args.password);
    if (user.passwordHash !== passwordHash) {
      throw new Error("Invalid username or password");
    }

    // Check account status (default to "active" for legacy users)
    const accountStatus = user.accountStatus || "active";
    if (accountStatus === "suspended") {
      throw new Error("Your account has been suspended. Please contact support.");
    }

    // Set default role for legacy users
    const role = user.role || "customer";

    // Update user with missing fields if they don't exist
    const updateFields: any = { lastLoginAt: Date.now() };
    if (!user.accountStatus) updateFields.accountStatus = "active";
    if (!user.role) updateFields.role = "customer";

    await ctx.db.patch(user._id, updateFields);

    // Return user info (without sensitive data)
    return {
      userId: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role,
      accountStatus,
      profilePicture: user.profilePicture,
    };
  },
});

export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});