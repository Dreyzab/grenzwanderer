#!/bin/bash

# 🎮 QR-Boost - Скрипт запуска всего проекта
# Запускает Vite dev-сервер и Convex backend одновременно

set -e

echo "🚀 Запуск QR-Boost проекта..."
echo ""

# Функция для проверки зависимостей
check_dependencies() {
    echo "📋 Проверка зависимостей..."
    command -v node >/dev/null 2>&1 || { echo "❌ Node.js не найден"; exit 1; }
    command -v npm >/dev/null 2>&1 || { echo "❌ npm не найден"; exit 1; }
    echo "✅ Node.js и npm найдены"
}

install_dependencies() {
    echo "\n📦 Проверка и установка зависимостей..."
    pushd client >/dev/null
    if [ ! -d "node_modules" ]; then
        echo "📥 Установка зависимостей проекта..."
        npm install
    else
        echo "✅ Зависимости уже установлены"
    fi
    popd >/dev/null
}

check_env() {
    echo "\n🔧 Проверка переменных окружения..."
    if [ ! -f "client/.env.local" ]; then
        cat > client/.env.local << EOF
# Mapbox token
VITE_MAPBOX_TOKEN=your_mapbox_token_here
# Convex URL
VITE_CONVEX_URL=http://localhost:3210
# Dev seed token
VITE_DEV_SEED_TOKEN=dev_secret_token_123
EOF
        echo "📝 client/.env.local создан. Заполните значения при необходимости."
    else
        echo "✅ client/.env.local найден"
    fi
}

cleanup() {
    echo "\n🛑 Остановка серверов..."
    if [ -n "$CONVEX_PID" ] && kill -0 $CONVEX_PID 2>/dev/null; then kill $CONVEX_PID || true; fi
    if [ -n "$VITE_PID" ] && kill -0 $VITE_PID 2>/dev/null; then kill $VITE_PID || true; fi
    exit 0
}

start_servers() {
    echo "\n🚀 Запуск серверов...\n"
    pushd client >/dev/null

    echo "📡 Запуск Convex backend..."
    npx convex dev --until-success &
    CONVEX_PID=$!
    echo "   PID Convex: $CONVEX_PID"

    echo "⏳ Ожидание инициализации Convex (5 сек)..."
    sleep 5

    echo "⚡ Запуск Vite dev-сервера..."
    npm run dev &
    VITE_PID=$!
    echo "   PID Vite: $VITE_PID"

    echo "\n🎉 Серверы запущены!"
    echo "📱 Фронтенд: http://localhost:5173"
    echo "📡 Convex dashboard: https://dashboard.convex.dev"
    echo "\n💡 Нажмите Ctrl+C для остановки."

    wait
    popd >/dev/null
}

trap cleanup SIGINT SIGTERM

main() {
    check_dependencies
    install_dependencies
    check_env
    start_servers
}

main "$@"
