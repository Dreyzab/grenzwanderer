import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const registerUser = mutation({
  args: { 
    email: v.string(), 
    password: v.string() 
  },
  handler: async (ctx, { email, password }) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (existingUser) {
      throw new Error("Пользователь с таким email уже существует");
    }
    
    // In a real app, you should hash the password before storing it
    const userId = await ctx.db.insert("users", {
      email,
      password, // Insecure for demo purposes
      createdAt: Date.now(),
      lastLogin: Date.now()
    });
    
    return { id: userId, email };
  },
});

export const loginUser = mutation({
  args: { 
    email: v.string(), 
    password: v.string() 
  },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!user) {
      throw new Error("Пользователь не найден");
    }
    
    if (user.password !== password) {
      throw new Error("Неверный пароль");
    }
    
    // Update last login
    await ctx.db.patch(user._id, { lastLogin: Date.now() });
    
    return { id: user._id, email: user.email };
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    
    return { id: user._id, email: user.email };
  },
});