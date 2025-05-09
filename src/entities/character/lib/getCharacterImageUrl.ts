/**
 * Возвращает корректный URL для изображения персонажа
 * Обрабатывает абсолютные и относительные пути
 */
export const getCharacterImageUrl = (spriteUrl: string): string => {
  // Если путь уже абсолютный, возвращаем его как есть
  if (spriteUrl.startsWith('F:') || spriteUrl.startsWith('/F:')) {
    return spriteUrl;
  }
  
  // Если путь относительный (начинается с /), добавляем базовый URL
  if (spriteUrl.startsWith('/')) {
    // Используем путь из конфигурации, или конструируем из window.location
    const baseUrl = window.location.origin;
    return `${baseUrl}${spriteUrl}`;
  }
  
  // Если это полностью относительный путь, просто добавляем /
  return `/${spriteUrl}`;
}; 