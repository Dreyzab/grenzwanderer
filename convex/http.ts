import { httpRouter } from "convex/server";
// Временно отключаем роутинг для авторизации
// import { auth } from "./auth";

// Создаем HTTP роутер для Convex
const http = httpRouter();

// Раскомментировать после реализации auth
// auth.addHttpRoutes(http);

// Здесь можно добавить роуты для OAuth, если это понадобится
// Пример:
// http.route({
//   path: "/auth/callback",
//   method: "GET",
//   handler: async (req, ctx) => {
//     // Обработка OAuth callback
//   }
// });

export default http;
