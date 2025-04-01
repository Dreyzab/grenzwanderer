import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Этот файл будет заполнен позже, когда мы запустим convex dev
// и сгенерируем необходимые файлы в директории _generated

// Временная заглушка для http.ts
export const authWithOAuth = () => {
  console.log("OAuth authentication will be implemented later");
};

// Получение текущего пользователя по ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    
    // Возвращаем безопасную версию пользователя (без пароля и соли)
    return { 
      id: user._id, 
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
  },
});

// Получение текущего пользователя по сессии
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Ищем пользователя по email из данных аутентификации
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email || ""))
      .first();

    if (!user) {
      return null;
    }

    // Возвращаем безопасную версию пользователя
    return {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
  },
});

// Проверка авторизации пользователя
export const isAuthenticated = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null;
  },
});

// Обновление данных пользователя
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    profileData: v.object({
      email: v.optional(v.string()),
      // Другие поля профиля по мере необходимости
    })
  },
  handler: async (ctx, { userId, profileData }) => {
    // Проверка существования пользователя
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Пользователь не найден");
    }

    // Проверка авторизации - в реальном приложении стоит проверить,
    // что текущий пользователь имеет право редактировать этот профиль
    
    // Обновляем только разрешенные поля
    const updates: any = {};
    
    if (profileData.email && profileData.email !== user.email) {
      // Проверка, что новый email не используется другим пользователем
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", profileData.email || ""))
        .first();
      
      if (existingUser && existingUser._id !== userId) {
        throw new Error("Этот email уже используется другим пользователем");
      }
      
      updates.email = profileData.email;
    }
    
    // Применяем обновления, если они есть
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
      
      // Получаем обновленного пользователя
      const updatedUser = await ctx.db.get(userId);
      return {
        id: updatedUser!._id,
        email: updatedUser!.email,
        createdAt: updatedUser!.createdAt,
        lastLogin: updatedUser!.lastLogin
      };
    }
    
    // Если обновлений нет, возвращаем текущего пользователя
    return {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
  },
}); 