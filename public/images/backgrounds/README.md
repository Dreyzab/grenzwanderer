# Фоны для визуальной новеллы

Эта директория содержит фоновые изображения для сцен визуальной новеллы.

## Требуемые изображения

### Пролог - Неумолчная жалоба

#### `train.png`
- **Разрешение**: 1920x1080 (Full HD)
- **Описание**: Тамбур поезда, ржавчина, мутное окно
- **Настроение**: Мрачное, постапокалиптическое
- **Цветовая палитра**: Серые, коричневые, тусклые желтые тона
- **Детали**: 
  - Ржавые стены вагона
  - Мутное грязное окно
  - Тусклое освещение
  - Ощущение движения и вибрации

### Глава 1 - Прибытие в Фрайбург

#### `station.png`
- **Разрешение**: 1920x1080 (Full HD)
- **Описание**: Платформа станции Фрайбург, толпа людей
- **Настроение**: Живое, хаотичное, контраст с мертвыми землями
- **Цветовая палитра**: Более яркие цвета, но все еще приглушенные
- **Детали**:
  - Платформа с людьми
  - Признаки жизни и активности
  - Элементы постапокалипсиса
  - Система фильтрации воздуха

#### `station_check.png`
- **Разрешение**: 1920x1080 (Full HD)
- **Описание**: Зона досмотра FJR (военизированной организации)
- **Настроение**: Напряженное, официальное, контролируемое
- **Цветовая палитра**: Холодные тона, металлические поверхности
- **Детали**:
  - Стол досмотра
  - Военная символика FJR
  - Металлодетектор
  - Строгое освещение

## Временные placeholder'ы

До создания финальных изображений используются градиенты:

```css
/* Поезд */
background: linear-gradient(to bottom, #27272a, #18181b);

/* Станция */
background: linear-gradient(to bottom, #3f3f46, #27272a);

/* Досмотр */
background: linear-gradient(to bottom, #52525b, #3f3f46);
```

## Формат и оптимизация

- **Формат**: PNG или WebP для лучшего сжатия
- **Размер файла**: Оптимально до 500KB
- **Качество**: Высокое, но оптимизированное для web
- **Совместимость**: Поддержка всех современных браузеров

## Генерация изображений

Изображения могут быть созданы с помощью:
- AI генераторов (Midjourney, Stable Diffusion, DALL-E)
- 3D рендеринга (Blender)
- Фотоманипуляции
- Цифровой живописи

### Промпты для AI генерации

#### Train Interior
```
Dark apocalyptic train interior, rusted metal walls, dirty foggy window, 
dim flickering lights, worn seats, industrial atmosphere, post-apocalyptic setting,
cinematic lighting, detailed textures, atmospheric, gritty realism
```

#### Station Platform
```
Post-apocalyptic train station platform, crowd of people, industrial architecture,
air filtration systems, makeshift market stalls, survival atmosphere, 
lived-in environment, cinematic lighting, detailed environment, hopeful chaos
```

#### Security Checkpoint
```
Military checkpoint interior, inspection table, metallic surfaces, 
official atmosphere, strict lighting, FJR military symbols, 
security equipment, professional setting, cold color palette
```

