import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Простая имитация хеширования пароля (ТОЛЬКО ДЛЯ ДЕМОНСТРАЦИИ, не для продакшена)
// В реальном приложении используйте bcrypt или другой безопасный алгоритм
function hashPassword(password: string, salt: string): string {
  return salt + password; // Очень небезопасно, только для демонстрации!
}

function verifyPassword(password: string, salt: string, hashedPassword: string): boolean {
  return hashPassword(password, salt) === hashedPassword;
}

// Валидация email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Валидация пароля
function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Генерация случайной строки для соли
function generateSalt(): string {
  return Math.random().toString(36).substring(2, 15);
}

export const registerUser = mutation({
  args: { 
    email: v.string(), 
    password: v.string() 
  },
  handler: async (ctx, { email, password }) => {
    // Валидация входных данных
    if (!isValidEmail(email)) {
      throw new Error("Неверный формат email");
    }
    
    if (!isValidPassword(password)) {
      throw new Error("Пароль должен содержать минимум 8 символов");
    }

    // Проверяем существует ли пользователь
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (existingUser) {
      throw new Error("Пользователь с таким email уже существует");
    }
    
    // Генерируем соль и "хешируем" пароль
    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);
    
    // Сохраняем пользователя с хешированным паролем и солью
    const userId = await ctx.db.insert("users", {
      email,
      password: hashedPassword,
      salt,
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
    // Валидация email
    if (!isValidEmail(email)) {
      throw new Error("Неверный формат email");
    }

    console.log(`Попытка входа для пользователя: ${email}`);

    // Получаем пользователя из БД
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!user) {
      console.log(`Пользователь не найден: ${email}`);
      throw new Error("Пользователь не найден");
    }
    
    console.log(`Пользователь найден: ${user._id}`);
    
    // Проверяем пароль
    if (!user.salt || !verifyPassword(password, user.salt, user.password)) {
      console.log(`Неверный пароль для пользователя: ${email}`);
      throw new Error("Неверный email или пароль");
    }
    
    // Обновляем время последнего входа
    const now = Date.now();
    await ctx.db.patch(user._id, { lastLogin: now });
    
    console.log(`Успешный вход: ${user._id}, ${user.email}`);
    return { id: user._id, email: user.email };
  },
});

export const resetPassword = mutation({
  args: { 
    email: v.string() 
  },
  handler: async (ctx, { email }) => {
    // Проверяем существование пользователя
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!user) {
      throw new Error("Пользователь с таким email не найден");
    }
    
    // Генерируем временный пароль
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // "Хешируем" временный пароль
    const salt = generateSalt();
    const hashedPassword = hashPassword(tempPassword, salt);
    
    // Обновляем пароль пользователя
    await ctx.db.patch(user._id, { 
      password: hashedPassword,
      salt: salt,
      passwordReset: true 
    });
    
    // В реальном приложении здесь должна быть отправка email
    console.log(`Новый пароль для ${email}: ${tempPassword}`);
    
    return { success: true };
  },
}); 