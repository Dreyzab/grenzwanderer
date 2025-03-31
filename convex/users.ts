import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const registerUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Пользователь с таким email уже существует");
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: args.password, // В реальном приложении следует хэшировать пароль
    });

    return { id: userId, email: args.email };
  },
});

export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    if (!user.password) {
      throw new Error("Для этого пользователя не установлен пароль");
    }

    if (user.password !== args.password) {
      throw new Error("Неверный пароль");
    }

    return { id: user._id, email: user.email };
  },
});

export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email;
    
    if (!email) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      return null;
    }

    return { id: user._id, email: user.email };
  },
}); 