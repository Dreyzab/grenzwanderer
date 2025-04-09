import { ConvexHttpClient } from "convex/browser";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Получаем текущую директорию
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем переменные окружения из .env файла
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Получаем URL для Convex деплоймента
const convexUrl = process.env.VITE_CONVEX_URL;

if (!convexUrl) {
  console.error('Ошибка: VITE_CONVEX_URL не найден в переменных окружения!');
  console.error('Пожалуйста, создайте файл .env с переменной VITE_CONVEX_URL');
  process.exit(1);
}

console.log(`Используем Convex URL: ${convexUrl}`);

// Создаем HTTP клиент
const client = new ConvexHttpClient(convexUrl);

// Основная функция инициализации
async function initializeData() {
  try {
    // Сначала проверяем, нужна ли инициализация
    console.log('Проверка необходимости инициализации...');
    const setupCheck = await client.query('setup:checkSetupNeeded');
    
    if (!setupCheck.setupNeeded) {
      console.log('Инициализация не требуется! Данные уже существуют:');
      console.log(setupCheck.existingData);
      
      console.log('\nВыполняем исправление отношений QR-кодов и сцен...');
      const fixResult = await client.mutation('setup:fixQRSceneMapping');
      console.log('Результат исправления:', fixResult);
      
      console.log('\nИсправляем QR-код торговца...');
      const traderQRFix = await client.mutation('setup:fixTraderQR');
      console.log('Результат исправления:', traderQRFix);
      
      // Выводим список всех сцен
      console.log('\nСписок всех сцен:');
      const scenes = await client.query('setup:listAllScenes');
      console.table(scenes);
      
      // Выводим список всех QR-кодов
      console.log('\nСписок всех QR-кодов:');
      const qrCodes = await client.query('setup:listAllQRCodes');
      console.table(qrCodes);
      
      console.log('\nПроверка сцены торговца:');
      const traderScene = await client.query('setup:getSceneByKey', { key: 'trader_meeting' });
      console.log(traderScene);
      
      return;
    }
    
    // Выполняем инициализацию
    console.log('Начинаем инициализацию данных...');
    const result = await client.mutation('initScenesData:initializeScenes');
    
    console.log('Инициализация выполнена успешно!');
    console.log('Созданные сцены:');
    console.table(Object.keys(result.sceneIds).map(key => ({
      key,
      id: result.sceneIds[key]
    })));
    
    console.log('\nСозданные QR-коды:');
    console.table(Object.keys(result.qrCodes).map(key => ({
      key,
      id: result.qrCodes[key]
    })));
    
    console.log('\nСозданные NPC:');
    console.table(Object.keys(result.npcs).map(key => ({
      key,
      id: result.npcs[key]
    })));
    
    console.log('\nСозданные точки на карте:');
    console.table(Object.keys(result.mapPoints).map(key => ({
      key,
      id: result.mapPoints[key]
    })));
    
    // Проверяем, что сцена торговца была создана
    console.log('\nПроверка сцены торговца:');
    const traderScene = await client.query('setup:getSceneByKey', { key: 'trader_meeting' });
    console.log(traderScene);
    
    // Исправляем связи QR-кодов и сцен для дополнительной надежности
    console.log('\nВыполняем исправление отношений QR-кодов и сцен...');
    const fixResult = await client.mutation('setup:fixQRSceneMapping');
    console.log('Результат исправления:', fixResult);
    
    console.log('\nИсправляем QR-код торговца...');
    const traderQRFix = await client.mutation('setup:fixTraderQR');
    console.log('Результат исправления:', traderQRFix);
    
  } catch (error) {
    console.error('Ошибка при инициализации данных:');
    console.error(error);
    process.exit(1);
  }
}

// Запуск инициализации
initializeData()
  .then(() => {
    console.log('\nИнициализация завершена!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Необработанная ошибка:');
    console.error(error);
    process.exit(1);
  }); 