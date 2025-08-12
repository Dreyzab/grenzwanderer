#!/bin/bash

# 🎮 QR-Boost - Скрипт запуска всего проекта
# Запускает Vite dev-сервер и Convex backend одновременно

set -e

echo "🚀 Запуск QR-Boost проекта..."
echo ""

# Функция для проверки зависимостей
check_dependencies() {
    echo "📋 Проверка зависимостей..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js не найден. Установите Node.js 18+ и попробуйте снова."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm не найден. Установите npm и попробуйте снова."
        exit 1
    fi
    
    echo "✅ Node.js и npm найдены"
}

# Функция для установки зависимостей
install_dependencies() {
    echo ""
    echo "📦 Проверка и установка зависимостей..."
    
    cd client
    
    if [ ! -d "node_modules" ]; then
        echo "📥 Установка зависимостей проекта..."
        npm install
    else
        echo "✅ Зависимости уже установлены"
    fi
    
    cd ..
}

# Функция для проверки переменных окружения
check_env() {
    echo ""
    echo "🔧 Проверка переменных окружения..."
    
    if [ ! -f "client/.env.local" ]; then
        echo "⚠️  Файл .env.local не найден. Создаю пример..."
        cat > client/.env.local << EOF
# Mapbox token (получите на https://mapbox.com)
VITE_MAPBOX_TOKEN=your_mapbox_token_here

# Convex URL (получите после настройки Convex)
VITE_CONVEX_URL=https://your_convex_deployment.convex.cloud

# Convex Deployment ID
CONVEX_DEPLOYMENT=your_deployment_id

# Dev-only токен для сида данных
VITE_DEV_SEED_TOKEN=dev_secret_token_123
EOF
        echo "📝 Файл .env.local создан. Пожалуйста, заполните необходимые переменные окружения."
        echo "   Особенно важно установить VITE_MAPBOX_TOKEN для работы карты."
        echo ""
    else
        echo "✅ Файл .env.local найден"
    fi
}

# Функция для остановки процессов при выходе
cleanup() {
    echo ""
    echo "🛑 Остановка серверов..."
    jobs -p | xargs -r kill
    exit 0
}

# Функция запуска серверов
start_servers() {
    echo ""
    echo "🚀 Запуск серверов..."
    echo ""
    
    cd client
    
    # Запуск Convex в фоне
    echo "📡 Запуск Convex backend..."
    npx convex dev --until-success &
    CONVEX_PID=$!
    
    # Небольшая пауза для инициализации Convex
    echo "⏳ Ожидание инициализации Convex (5 сек)..."
    sleep 5
    
    # Запуск Vite dev-сервера
    echo "⚡ Запуск Vite dev-сервера..."
    npm run dev &
    VITE_PID=$!
    
    echo ""
    echo "🎉 Серверы запущены!"
    echo ""
    echo "📱 Фронтенд доступен по адресу: http://localhost:5173"
    echo "📡 Convex dashboard: https://dashboard.convex.dev"
    echo ""
    echo "💡 Для остановки нажмите Ctrl+C"
    echo ""
    
    # Ожидание завершения любого из процессов
    wait
}

# Устанавливаем trap для корректной остановки
trap cleanup SIGINT SIGTERM

# Основная логика
main() {
    check_dependencies
    install_dependencies
    check_env
    start_servers
}

# Запуск
main "$@"
