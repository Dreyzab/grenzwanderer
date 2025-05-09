import React, { useEffect, useState } from 'react';

export interface BackgroundEffect {
  type: 'rain' | 'snow' | 'fog' | 'blur' | 'shake';
  intensity?: number; // 0-10
  color?: string;
}

interface NovelBackgroundWidgetProps {
  imageUrl: string;
  effects?: BackgroundEffect[];
}

/**
 * Виджет для отображения фонового изображения сцены визуальной новеллы
 * Поддерживает визуальные эффекты (дождь, снег, туман и т.д.)
 */
export const NovelBackgroundWidget: React.FC<NovelBackgroundWidgetProps> = ({
  imageUrl,
  effects = []
}) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Обработка изменения фона с анимацией
  useEffect(() => {
    if (currentImageUrl !== imageUrl) {
      setIsTransitioning(true);
      
      // После начала перехода, обновляем изображение
      const timer = setTimeout(() => {
        setCurrentImageUrl(imageUrl);
        
        // После загрузки нового изображения, заканчиваем переход
        const endTransition = setTimeout(() => {
          setIsTransitioning(false);
        }, 500);
        
        return () => clearTimeout(endTransition);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [imageUrl, currentImageUrl]);
  
  // Генерация CSS классов для эффектов
  const getEffectClasses = (): string => {
    const effectClasses: string[] = [];
    
    effects.forEach(effect => {
      switch(effect.type) {
        case 'rain':
          effectClasses.push(`rain rain-${effect.intensity || 'medium'}`);
          break;
        case 'snow':
          effectClasses.push(`snow snow-${effect.intensity || 'medium'}`);
          break;
        case 'fog':
          effectClasses.push(`fog fog-${effect.intensity || 'medium'}`);
          break;
        case 'shake':
          effectClasses.push(`shake shake-${effect.intensity || 'medium'}`);
          break;
        case 'fade':
          // Fade эффекты применяются через transition
          break;
      }
    });
    
    return effectClasses.join(' ');
  };
  
  // Проверяем, есть ли эффект fade
  const fadeEffect = effects.find(effect => effect.type === 'fade') as { type: 'fade', direction: 'in' | 'out', duration?: number } | undefined;
  
  // Вычисляем стили в зависимости от эффектов
  const backgroundStyle: React.CSSProperties = {
    backgroundImage: `url(${currentImageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: fadeEffect 
      ? `opacity ${fadeEffect.duration || 1}s ease`
      : 'opacity 0.5s ease',
    opacity: isTransitioning || (fadeEffect?.direction === 'out') ? 0 : 1
  };
  
  // Генерация элементов для эффектов (дождь, снег и т.д.)
  const renderEffectElements = () => {
    return effects.map((effect, index) => {
      switch(effect.type) {
        case 'rain':
          return <div key={`effect-${index}`} className="absolute inset-0 rain-overlay"></div>;
        case 'snow':
          return <div key={`effect-${index}`} className="absolute inset-0 snow-overlay"></div>;
        case 'fog':
          return <div key={`effect-${index}`} className="absolute inset-0 fog-overlay"></div>;
        default:
          return null;
      }
    }).filter(Boolean);
  };
  
  return (
    <div 
      className={`absolute inset-0 z-0 ${getEffectClasses()}`}
      style={backgroundStyle}
    >
      {renderEffectElements()}
    </div>
  );
};

export default NovelBackgroundWidget; 