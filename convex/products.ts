import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createProduct = mutation({
  args: {
    sellerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    price: v.number(),
    compareAtPrice: v.optional(v.number()),
    currency: v.string(),
    inventory: v.number(),
    sku: v.optional(v.string()),
    trackInventory: v.boolean(),
    images: v.array(v.string()),
    weight: v.optional(v.number()),
    dimensions: v.optional(v.object({
      length: v.number(),
      width: v.number(),
      height: v.number(),
      unit: v.string(),
    })),
    attributes: v.optional(v.object({
      color: v.optional(v.string()),
      size: v.optional(v.string()),
      material: v.optional(v.string()),
      brand: v.optional(v.string()),
      model: v.optional(v.string()),
    })),
    tags: v.optional(v.array(v.string())),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify seller exists and has seller role
    const seller = await ctx.db.get(args.sellerId);
    if (!seller) {
      throw new Error("Seller not found");
    }
    if (seller.role !== "seller") {
      throw new Error("User is not a seller");
    }
    if (seller.accountStatus !== "active") {
      throw new Error("Seller account is not active");
    }

    const productId = await ctx.db.insert("products", {
      ...args,
      status: "draft", // Products start as draft
      featured: false,
      rating: 0,
      reviewCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { productId };
  },
});

export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    sellerId: v.id("users"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
      subcategory: v.optional(v.string()),
      price: v.optional(v.number()),
      compareAtPrice: v.optional(v.number()),
      inventory: v.optional(v.number()),
      sku: v.optional(v.string()),
      trackInventory: v.optional(v.boolean()),
      images: v.optional(v.array(v.string())),
      weight: v.optional(v.number()),
      dimensions: v.optional(v.object({
        length: v.number(),
        width: v.number(),
        height: v.number(),
        unit: v.string(),
      })),
      attributes: v.optional(v.object({
        color: v.optional(v.string()),
        size: v.optional(v.string()),
        material: v.optional(v.string()),
        brand: v.optional(v.string()),
        model: v.optional(v.string()),
      })),
      tags: v.optional(v.array(v.string())),
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      status: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Verify seller owns this product
    if (product.sellerId !== args.sellerId) {
      throw new Error("You can only update your own products");
    }

    await ctx.db.patch(args.productId, {
      ...args.updates,
      updatedAt: Date.now(),
      ...(args.updates.status === "active" && { publishedAt: Date.now() }),
    });

    return { success: true };
  },
});

export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
    sellerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Verify seller owns this product
    if (product.sellerId !== args.sellerId) {
      throw new Error("You can only delete your own products");
    }

    await ctx.db.delete(args.productId);
    return { success: true };
  },
});

// Query functions
export const getProductsBySeller = query({
  args: { sellerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId))
      .collect();
  },
});

export const getActiveProducts = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

export const getProductsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

export const getFeaturedProducts = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

export const searchProducts = query({
  args: {
    searchTerm: v.string(),
    category: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter by search term (title and description)
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      products = products.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Filter by category
    if (args.category) {
      products = products.filter(p => p.category === args.category);
    }

    // Filter by price range
    if (args.minPrice !== undefined) {
      products = products.filter(p => p.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      products = products.filter(p => p.price <= args.maxPrice!);
    }

    return products;
  },
});