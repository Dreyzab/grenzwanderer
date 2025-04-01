import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { randomBytes, pbkdf2Sync } from "crypto";

// Типы для функций хеширования
type PasswordHash = string;
type Salt = string;

// Безопасная генерация соли
function generateSalt(length: number = 16): Salt {
  return randomBytes(length).toString('hex');
}

// Безопасное хеширование пароля с использованием PBKDF2
function hashPassword(password: string, salt: Salt): PasswordHash {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, salt: Salt, hashedPassword: PasswordHash): boolean {
  const hash = hashPassword(password, salt);
  return hash === hashedPassword;
}

// Валидация email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Валидация пароля
function isValidPassword(password: string): boolean {
  return password.length >= 8 && // минимальная длина
    /[A-Z]/.test(password) && // хотя бы одна заглавная буква
    /[a-z]/.test(password) && // хотя бы одна строчная буква
    /[0-9]/.test(password) && // хотя бы одна цифра
    /[^A-Za-z0-9]/.test(password); // хотя бы один специальный символ
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
      throw new Error("Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (existingUser) {
      throw new Error("Пользователь с таким email уже существует");
    }
    
    // Generate salt and hash the password
    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);
    
    // Store the user with hashed password and salt
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

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!user) {
      throw new Error("Пользователь не найден");
    }
    
    // Verify the password using the stored salt and hashed password
    if (!verifyPassword(password, user.salt, user.password)) {
      // Используем одинаковое сообщение об ошибке для безопасности
      throw new Error("Неверный email или пароль");
    }
    
    // Update last login with rate limiting
    const now = Date.now();
    const lastLoginDiff = now - (user.lastLogin || 0);
    
    if (lastLoginDiff > 1000) { // Предотвращаем слишком частые обновления
      await ctx.db.patch(user._id, { lastLogin: now });
    }
    
    return { id: user._id, email: user.email };
  },
});

export const resetPassword = mutation({
  args: { 
    email: v.string() 
  },
  handler: async (ctx, { email }) => {
    // Проверить, существует ли пользователь
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!user) {
      throw new Error("Пользователь с таким email не найден");
    }
    
    // Генерируем временный пароль (В реальном приложении стоит использовать токены и отправлять email)
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Generate new salt and hash for the temporary password
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