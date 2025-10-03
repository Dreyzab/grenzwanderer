# Visual Novel System - Реализация

## 📋 Обзор

Полнофункциональная система визуальной новеллы для Grenzwanderer, реализованная согласно спецификациям в `Plan.md` (строки 1030-1390).

## ✅ Реализованные компоненты

### 1. **Расширенная типизация** (`entities/visual-novel/model/types.ts`)

Полная система типов для Visual Novel:

- **Эмоции**:
  - `BaseEmotion` - базовые эмоции (10 типов)
  - `EmotionState` - состояние эмоции с интенсивностью
  - `MicroExpressions` - микровыражения (брови, глаза, рот, румянец)
  - `EmotionTransition` - переходы между эмоциями

- **Диалоги**:
  - `DialogueNode` - расширенный узел диалога
  - `DialogueContent` - контент с rich text поддержкой
  - `Speaker` - информация о говорящем
  - `PresentationConfig` - визуальные эффекты

- **Выборы**:
  - `DialogueChoice` - продвинутая система выборов
  - `SkillCheck` - проверки навыков
  - `ResourceCost` - стоимость выборов
  - `ChoiceColor` - цветовое кодирование
  - `ChoiceAvailability` - условия доступности

- **Анимации**:
  - `CharacterAnimation` - анимации персонажей
  - `AnimationType` - типы анимаций
  - `VisualEffect` - визуальные эффекты

### 2. **Система эмоций** (`entities/visual-novel/lib/emotionSystem.ts`)

Продвинутая система управления эмоциями персонажей:

**Основные функции:**
```typescript
// Создание эмоций
createEmotion(BaseEmotion.HAPPY, intensity)
createDetailedEmotion(BaseEmotion.HAPPY, 80, { blush: true })
createEmotionTransition(from, to, duration, easing)

// Интерполяция
interpolateEmotions(from, to, progress)
applyEasing(progress, 'ease-out')

// Модификация
blendEmotions(base, overlay, strength)
intensifyEmotion(emotion, amount)
setMicroExpression(emotion, 'blush', true)
```

**Пресеты эмоций:**
- `EMOTION_PRESETS.neutral`, `.happy`, `.sad`, `.angry` и др.
- `'happy-blush'`, `'sad-tears'`, `'angry-shouting'`
- `'nervous-sweat'`, `'surprised-shocked'`, `'embarrassed-blush'`

**Утилиты:**
- `getEmotionDescription()` - описание на русском
- `parseEmotion()` - парсинг из строки (обратная совместимость)
- `ensureValidEmotion()` - валидация и fallback

### 3. **Анимационный движок** (`entities/visual-novel/lib/animationEngine.ts`)

Framer Motion анимации для персонажей:

**Варианты анимаций:**
```typescript
// Входы/выходы по позициям
ENTER_VARIANTS.left, .right, .center

// Состояния
TALK_VARIANT - анимация разговора
EMOTION_VARIANT - смена эмоции

// Жесты
GESTURE_VARIANTS.nod, .shake, .wave, .bow
```

**Специальные эффекты:**
```typescript
BOUNCE_EFFECT - отскок
createShakeEffect(intensity, frequency) - тряска
createGlowEffect(color, intensity) - свечение
createBlurEffect(amount) - размытие
```

**Построитель анимаций:**
```typescript
buildCharacterAnimation({
  type: 'emotion',
  duration: 300,
  easing: 'ease-out',
  transforms: { position, scale, rotation, opacity },
  specialEffects: { bounce, shake, glow, blur }
})
```

**Пресеты:**
- `ANIMATION_PRESETS.slideInLeft`, `.slideInRight`, `.fadeIn`
- `.surprised`, `.shocked`, `.nod`, `.shake`

### 4. **UI Компоненты**

#### `DialogueBox` (`entities/visual-novel/ui/DialogueBox.tsx`)

Диалоговое окно с typewriter эффектом:

```tsx
<DialogueBox
  node={dialogueNode}
  onNext={() => nextLine()}
  autoPlaySpeed={50}
  skipTypewriter={false}
/>
```

**Особенности:**
- ✅ Typewriter эффект с настраиваемой скоростью
- ✅ Glass morphism дизайн
- ✅ Отображение эмоций говорящего
- ✅ Индикатор продолжения
- ✅ Пропуск анимации по клику
- ✅ Поддержка нарратива через `<NarrationBox>`

#### `ChoiceButtons` (`entities/visual-novel/ui/ChoiceButtons.tsx`)

Система выбора с skill checks:

```tsx
<ChoiceList
  choices={choices}
  onChoose={(id) => handleChoice(id)}
  playerSkills={{ logic: 45, empathy: 30 }}
/>
```

**Особенности:**
- ✅ Цветовое кодирование по типу выбора
- ✅ Skill check индикаторы с шансом успеха
- ✅ Иконки навыков (Brain, Heart, Shield, Target, Zap)
- ✅ Отображение стоимости выбора
- ✅ Блокировка недоступных выборов
- ✅ Tooltip с описанием
- ✅ Hover эффекты и анимации

#### `CharacterSprite` (`entities/visual-novel/ui/CharacterSprite.tsx`)

Анимированные спрайты персонажей:

```tsx
<CharacterGroup
  characters={characters}
  activeCharacterId={activeSpeaker}
  talkingCharacterId={currentSpeaker}
/>
```

**Особенности:**
- ✅ Позиционирование (left, right, center, offscreen)
- ✅ Анимации входа/выхода по позиции
- ✅ Анимация разговора (idle bounce)
- ✅ Переходы эмоций
- ✅ Подсветка активного персонажа
- ✅ Эффект свечения
- ✅ Placeholder для персонажей без спрайта
- ✅ Оверлей эмоций с цветом

## 📐 Архитектура

```
entities/visual-novel/
├── model/
│   ├── types.ts              # Полная типизация системы
│   └── store.ts              # Zustand store (существующий)
├── lib/
│   ├── emotionSystem.ts      # Система эмоций
│   └── animationEngine.ts    # Анимационный движок
├── ui/
│   ├── DialogueBox.tsx       # Диалоговое окно
│   ├── ChoiceButtons.tsx     # Кнопки выбора
│   ├── CharacterSprite.tsx   # Спрайты персонажей
│   └── index.ts              # Экспорты
├── api/
│   └── scenarios.ts          # Сценарии (существующий)
└── index.ts                  # Главный экспорт
```

## 🎨 Дизайн система

### Цвета выборов
- `ChoiceColor.NEUTRAL` - нейтральный (zinc-300)
- `ChoiceColor.POSITIVE` - положительный (emerald-400)
- `ChoiceColor.NEGATIVE` - негативный (red-400)
- `ChoiceColor.CAUTIOUS` - осторожный (blue-400)
- `ChoiceColor.BOLD` - смелый (amber-400)
- `ChoiceColor.MYSTERIOUS` - загадочный (purple-400)
- `ChoiceColor.SKILL` - навык (teal-400)

### Анимации
- **Входы**: слайды с opacity, масштабирование
- **Разговор**: мягкий bounce (0.6s loop)
- **Эмоции**: scale pulse (0.3s)
- **Жесты**: rotation и position изменения

## 🔧 Использование

### Базовый пример

```tsx
import { 
  DialogueBox, 
  ChoiceList, 
  CharacterGroup,
  createEmotion,
  BaseEmotion 
} from '@/entities/visual-novel'

function VisualNovelScene() {
  const currentNode = getCurrentDialogueNode()
  const characters = getSceneCharacters()
  
  return (
    <div className="relative w-full h-screen">
      {/* Персонажи */}
      <CharacterGroup
        characters={characters}
        activeCharacterId={currentNode.characterId}
        talkingCharacterId={currentNode.characterId}
      />
      
      {/* Диалоговое окно */}
      <DialogueBox
        node={currentNode}
        onNext={() => advanceDialogue()}
        autoPlaySpeed={50}
      />
      
      {/* Выборы */}
      {currentNode.choices && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
          <ChoiceList
            choices={currentNode.choices}
            onChoose={handleChoice}
            playerSkills={playerSkills}
          />
        </div>
      )}
    </div>
  )
}
```

### Работа с эмоциями

```typescript
// Создание эмоции
const happyEmotion = createEmotion(BaseEmotion.HAPPY, 80)

// С микровыражениями
const detailedEmotion = createDetailedEmotion(
  BaseEmotion.EMBARRASSED, 
  85, 
  { blush: true, eyes: 'closed' }
)

// Плавный переход
const transition = createEmotionTransition(
  currentEmotion,
  newEmotion,
  500, // ms
  'ease-out'
)

// Использование пресетов
character.emotion = EMOTION_PRESETS['happy-blush']
```

### Skill Checks

```typescript
const skillChoice: DialogueChoice = {
  id: 'logic_choice',
  text: 'Попытаться взломать систему',
  presentation: {
    color: ChoiceColor.SKILL,
    icon: '🔧',
    tooltip: 'Требуется высокий уровень логики'
  },
  availability: {
    skillCheck: {
      skill: 'logic',
      difficulty: 60,
      successText: 'Вы успешно взломали систему!',
      failureText: 'Система слишком сложна...',
      criticalSuccess: 'Вы не только взломали, но и оставили backdoor!',
      modifiers: {
        items: ['hacking_tool'], // дополнительный бонус
        reputation: 10 // +10% от репутации technical
      }
    }
  },
  effects: {
    immediate: [
      { type: 'flag', data: { hacked_system: true } }
    ],
    reputation: {
      technical: +15
    }
  }
}
```

## 🎯 Соответствие Plan.md

✅ **1030-1060**: Dialogue System Engine - реализована  
✅ **1062-1107**: Advanced Dialogue Nodes - полная типизация  
✅ **1110-1143**: Emotion States - с transitions и micro-expressions  
✅ **1147-1208**: Advanced Choice System - с skill checks и costs  
✅ **1269-1335**: Visual Presentation Engine - Framer Motion анимации  
✅ **1305-1335**: Character Animations - все типы анимаций  

## 🚀 Следующие шаги

### Фаза 1: Расширенные фичи
- [ ] Система отношений персонажей (`RelationshipSystem`)
- [ ] Память персонажей (`MemoryEntry`)
- [ ] Система сохранений (`SaveSystem`)
- [ ] Audio система (озвучка, музыка, эффекты)

### Фаза 2: Интеграция
- [ ] Интеграция с quest system
- [ ] Интеграция с player reputation
- [ ] Convex синхронизация прогресса
- [ ] Множественные концовки

### Фаза 3: Контент
- [ ] Создание 50+ диалоговых сцен
- [ ] Спрайты персонажей
- [ ] Фоны локаций
- [ ] Музыкальное оформление

## 📚 Референсы

- **Plan.md**: Строки 1030-1390 - полная спецификация
- **Framer Motion docs**: https://www.framer.com/motion/
- **React 19**: https://react.dev
- **Zustand**: https://github.com/pmndrs/zustand

## 🎨 Стиль кода

- TypeScript strict mode
- FSD архитектура
- Framer Motion для анимаций
- Tailwind CSS для стилей
- Функциональные компоненты + hooks

---

**Статус**: ✅ Базовая реализация завершена  
**Дата**: 2025-10-02  
**Версия**: 1.0.0


