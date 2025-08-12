@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 🎮 QR-Boost - Скрипт запуска всего проекта для Windows
REM Запускает Vite dev-сервер и Convex backend одновременно

echo 🚀 Запуск QR-Boost проекта...
echo.

REM Функция для проверки зависимостей
echo 📋 Проверка зависимостей...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден. Установите Node.js 18+ и попробуйте снова.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm не найден. Установите npm и попробуйте снова.
    pause
    exit /b 1
)

echo ✅ Node.js и npm найдены

REM Проверка и установка зависимостей
echo.
echo 📦 Проверка и установка зависимостей...

cd client

if not exist "node_modules" (
    echo 📥 Установка зависимостей проекта...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Ошибка при установке зависимостей
        pause
        exit /b 1
    )
) else (
    echo ✅ Зависимости уже установлены
)

REM Проверка переменных окружения
echo.
echo 🔧 Проверка переменных окружения...

if not exist ".env.local" (
    echo ⚠️  Файл .env.local не найден. Создаю пример...
    (
        echo # Mapbox token ^(получите на https://mapbox.com^)
        echo VITE_MAPBOX_TOKEN=your_mapbox_token_here
        echo.
        echo # Convex URL ^(получите после настройки Convex^)
        echo VITE_CONVEX_URL=https://your_convex_deployment.convex.cloud
        echo.
        echo # Convex Deployment ID
        echo CONVEX_DEPLOYMENT=your_deployment_id
        echo.
        echo # Dev-only токен для сида данных
        echo VITE_DEV_SEED_TOKEN=dev_secret_token_123
    ) > .env.local
    echo 📝 Файл .env.local создан. Пожалуйста, заполните необходимые переменные окружения.
    echo    Особенно важно установить VITE_MAPBOX_TOKEN для работы карты.
    echo.
) else (
    echo ✅ Файл .env.local найден
)

REM Запуск серверов
echo.
echo 🚀 Запуск серверов...
echo.

REM Запуск Convex в отдельном окне
echo 📡 Запуск Convex backend...
start "Convex Backend" cmd /k "npx convex dev --until-success"

REM Небольшая пауза для инициализации Convex
echo ⏳ Ожидание инициализации Convex (7 сек)...
timeout /t 7 /nobreak >nul

REM Запуск Vite dev-сервера
echo ⚡ Запуск Vite dev-сервера...
start "Vite Dev Server" cmd /k "npm run dev"

echo.
echo 🎉 Серверы запущены!
echo.
echo 📱 Фронтенд будет доступен по адресу: http://localhost:5173
echo 📡 Convex dashboard: https://dashboard.convex.dev
echo.
echo 💡 Для остановки закройте соответствующие окна терминала
echo.
echo Нажмите любую клавишу для выхода из этого окна...
pause >nul

cd ..
