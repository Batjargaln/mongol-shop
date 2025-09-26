import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    userId: v.optional(v.id("users")), // Link to auth system user
    username: v.optional(v.string()),
    email: v.string(),
    passwordHash: v.optional(v.string()), // Optional for OAuth users
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePicture: v.optional(v.string()),
    provider: v.string(), // "local", "google", "facebook"
    providerId: v.optional(v.string()), // OAuth provider user ID

    // Role and account type
    role: v.optional(v.string()), // "customer", "seller", "admin" - optional for backward compatibility
    accountStatus: v.optional(v.string()), // "active", "suspended", "pending_verification" - optional for backward compatibility

    // Contact information
    phone: v.optional(v.string()),
    address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    })),

    // Seller-specific fields
    businessName: v.optional(v.string()),
    businessType: v.optional(v.string()), // "individual", "business"
    taxId: v.optional(v.string()),
    businessAddress: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    })),
    businessDescription: v.optional(v.string()),
    businessVerified: v.optional(v.boolean()),

    // Banking/Payment info for sellers
    bankAccountInfo: v.optional(v.object({
      bankName: v.string(),
      accountHolderName: v.string(),
      accountNumber: v.string(), // In production, encrypt this
      routingNumber: v.string(),
    })),

    // Ratings and performance
    rating: v.optional(v.number()), // Average rating for sellers
    totalSales: v.optional(v.number()),
    totalOrders: v.optional(v.number()),

    // Admin-specific fields
    adminPermissions: v.optional(v.array(v.string())), // ["user_management", "product_management", "order_management", etc.]
    adminNotes: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
    verifiedAt: v.optional(v.number()),
  })
    .index("by_user_id", ["userId"])
    .index("by_username", ["username"])
    .index("by_email", ["email"])
    .index("by_provider_id", ["provider", "providerId"])
    .index("by_role", ["role"])
    .index("by_account_status", ["accountStatus"])
    .index("by_business_verified", ["businessVerified"]),

  products: defineTable({
    sellerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    price: v.number(),
    compareAtPrice: v.optional(v.number()), // Original price for discounts
    currency: v.string(), // "USD", "MNT", etc.

    // Inventory
    inventory: v.number(),
    sku: v.optional(v.string()),
    trackInventory: v.boolean(),

    // Product details
    images: v.array(v.string()), // URLs to product images
    weight: v.optional(v.number()),
    dimensions: v.optional(v.object({
      length: v.number(),
      width: v.number(),
      height: v.number(),
      unit: v.string(), // "cm", "in"
    })),

    // Product attributes (flexible)
    attributes: v.optional(v.object({
      color: v.optional(v.string()),
      size: v.optional(v.string()),
      material: v.optional(v.string()),
      brand: v.optional(v.string()),
      model: v.optional(v.string()),
    })),

    // Status and visibility
    status: v.string(), // "draft", "active", "inactive", "out_of_stock"
    featured: v.optional(v.boolean()),

    // SEO and marketing
    tags: v.optional(v.array(v.string())),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),

    // Ratings and reviews
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_seller", ["sellerId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_featured", ["featured"])
    .index("by_price", ["price"])
    .index("by_created_at", ["createdAt"]),
});