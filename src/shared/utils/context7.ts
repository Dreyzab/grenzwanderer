/**
 * Утилиты для работы с Context7
 * Позволяют получать документацию по библиотекам и фреймворкам
 */

/**
 * Результат поиска библиотеки в Context7
 */
export interface Context7Library {
  id: string;
  name: string;
  description: string;
  githubStars?: number;
  codeSnippetCount?: number;
}

/**
 * Результат запроса документации из Context7
 */
export interface Context7Documentation {
  content: string;
  source: string;
}

/**
 * Кэш для хранения информации о библиотеках
 */
const libraryCache: Record<string, Context7Library> = {};

/**
 * Кэш для хранения документации
 */
const documentationCache: Record<string, Context7Documentation> = {};

/**
 * Разрешает имя пакета в ID библиотеки Context7
 * 
 * @param packageName Имя пакета или библиотеки
 * @returns Информация о найденной библиотеке
 */
export async function resolveLibraryId(packageName: string): Promise<Context7Library> {
  // Проверяем кэш
  if (libraryCache[packageName]) {
    return libraryCache[packageName];
  }
  
  try {
    // Заглушка для прямых вызовов - в реальности здесь будет вызов API Context7
    const mockLibraryId = {
      id: packageName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      name: packageName,
      description: `Документация для ${packageName}`,
      githubStars: 1000,
      codeSnippetCount: 500
    };
    
    // Сохраняем в кэш
    libraryCache[packageName] = mockLibraryId;
    
    return mockLibraryId;
  } catch (error) {
    console.error(`Ошибка при разрешении ID библиотеки ${packageName}:`, error);
    throw new Error(`Не удалось найти библиотеку ${packageName}`);
  }
}

/**
 * Получает документацию по библиотеке из Context7
 * 
 * @param libraryId ID библиотеки в формате Context7
 * @param topic Опциональная тема для фокусировки документации
 * @param maxTokens Максимальное количество токенов для получения
 * @returns Документация по библиотеке
 */
export async function getLibraryDocs(
  libraryId: string,
  topic?: string,
  maxTokens: number = 10000
): Promise<Context7Documentation> {
  // Создаем ключ для кэша
  const cacheKey = `${libraryId}${topic ? `-${topic}` : ''}`;
  
  // Проверяем кэш
  if (documentationCache[cacheKey]) {
    return documentationCache[cacheKey];
  }
  
  try {
    // Заглушка для прямых вызовов - в реальности здесь будет вызов API Context7
    const mockDoc: Context7Documentation = {
      content: `# Документация по ${libraryId}\n\n` +
        (topic ? `## Тема: ${topic}\n\n` : '') +
        'Это заглушка документации для локального режима разработки.',
      source: `https://docs.${libraryId.replace('/', '.')}.dev`
    };
    
    // Сохраняем в кэш
    documentationCache[cacheKey] = mockDoc;
    
    return mockDoc;
  } catch (error) {
    console.error(`Ошибка при получении документации для ${libraryId}:`, error);
    throw new Error(`Не удалось получить документацию для ${libraryId}`);
  }
}

/**
 * Проверяет, работаем ли мы в режиме разработки с заглушками или в режиме реальных вызовов Context7
 */
export function isContext7MockMode(): boolean {
  return import.meta.env.VITE_USE_CONTEXT7_MOCK === 'true';
} 