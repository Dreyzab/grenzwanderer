import React, { useEffect, useState } from 'react';
import './BackgroundDisplay.css';

interface BackgroundDisplayProps {
  imageUrl?: string;
}

export const BackgroundDisplay: React.FC<BackgroundDisplayProps> = ({ imageUrl }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Сбрасываем состояние загрузки при изменении URL
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [imageUrl]);

  // Если URL не был предоставлен, используем черный фон
  if (!imageUrl) {
    return <div className="background-display background-fallback" />;
  }

  // Исправляем URL при необходимости, убедившись, что пути относительны от public/
  const fixedImageUrl = imageUrl.startsWith('/') 
    ? imageUrl 
    : `/${imageUrl}`;

  // Проверяем, существует ли файл по указанному пути
  console.log(`Загрузка фонового изображения: ${fixedImageUrl}`);

  return (
    <div className="background-display">
      <img
        src={fixedImageUrl}
        alt="Scene background"
        className={`background-image ${loaded ? 'loaded' : ''}`}
        onLoad={() => {
          console.log(`Фоновое изображение успешно загружено: ${fixedImageUrl}`);
          setLoaded(true);
        }}
        onError={(e) => {
          console.error(`Ошибка загрузки фонового изображения: ${fixedImageUrl}`, e);
          setError(true);
        }}
      />
      {error && (
        <div className="background-error">
          Ошибка загрузки фона
        </div>
      )}
    </div>
  );
}; 