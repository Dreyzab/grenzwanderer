@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 🎮 QR-Boost - Скрипт запуска всего проекта для Windows
REM Запускает Vite dev-сервер и Convex backend одновременно

echo 🚀 Запуск QR-Boost проекта...
echo.

REM Проверка зависимостей
where node >nul 2>nul || (echo ❌ Node.js не найден. Установите Node.js 18+ & pause & exit /b 1)
where npm >nul 2>nul || (echo ❌ npm не найден. Установите npm & pause & exit /b 1)
echo ✅ Node.js и npm найдены

echo.
echo 📦 Проверка и установка зависимостей...
cd client
if not exist "node_modules" (
    echo 📥 Установка зависимостей проекта...
    call npm install || (echo ❌ Ошибка npm install & pause & exit /b 1)
) else (
    echo ✅ Зависимости уже установлены
)

echo.
echo 🔧 Проверка переменных окружения...
if not exist ".env.local" (
    echo 📝 Создаю client\.env.local пример...
    (
        echo VITE_MAPBOX_TOKEN=your_mapbox_token_here
        echo VITE_CONVEX_URL=http://localhost:3210
        echo VITE_DEV_SEED_TOKEN=dev_secret_token_123
    ) > .env.local
) else (
    echo ✅ client\.env.local найден
)

echo.
echo 🚀 Запуск серверов...

echo 📡 Запуск Convex backend...
start "Convex Backend" cmd /k "npx convex dev --until-success"

echo ⏳ Ожидание инициализации Convex (7 сек)...
timeout /t 7 /nobreak >nul

echo ⚡ Запуск Vite dev-сервера...
start "Vite Dev Server" cmd /k "npm run dev"

echo.
echo 🎉 Серверы запущены!
echo 📱 Фронтенд: http://localhost:5173
echo 📡 Convex dashboard: https://dashboard.convex.dev

echo.
echo 💡 Закройте окна терминалов для остановки.

echo.
pause >nul
cd ..
