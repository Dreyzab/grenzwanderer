# 🎮 QR-Boost - Быстрый запуск

## Простой способ запустить всё одной командой

### 🐧 Linux / 🍎 macOS
```bash
./start.sh
```

### 🪟 Windows
```cmd
start.bat
```

### 📦 Через npm (любая ОС)
```bash
cd client
npm run start
```

## Что делают скрипты?

1. ✅ **Проверяют зависимости** (Node.js, npm)
2. 📦 **Устанавливают пакеты** (если нужно)
3. ⚙️ **Создают .env.local** (если не существует)
4. 🚀 **Запускают одновременно:**
   - Convex backend (`npx convex dev`)
   - Vite dev-сервер (`npm run dev`)

## После запуска

🌐 **Откройте браузер:** http://localhost:5173

📊 **Convex Dashboard:** https://dashboard.convex.dev

## Важно!

📝 **Не забудьте заполнить `.env.local`:**
- `VITE_MAPBOX_TOKEN` - получите на https://mapbox.com
- `VITE_CONVEX_URL` - появится после настройки Convex

## Проблемы?

- ❌ **"Node.js не найден"** → установите Node.js 18+
- ❌ **"Карта не загружается"** → проверьте VITE_MAPBOX_TOKEN
- ❌ **"Convex ошибки"** → запустите `npx convex dev --once` в client/

## Остановка

- **Linux/macOS:** `Ctrl+C` в терминале
- **Windows:** Закройте окна терминалов
- **npm:** `Ctrl+C` в терминале
