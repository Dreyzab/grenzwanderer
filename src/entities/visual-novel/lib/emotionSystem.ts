/**
 * EMOTION SYSTEM
 * Advanced emotion management and transitions for Visual Novel characters
 * @see Plan.md lines 1110-1143
 */

import { BaseEmotion } from '../model/types'
import type { EmotionState, MicroExpressions, EmotionTransition } from '../model/types'

// ============================================
// EMOTION UTILITIES
// ============================================

/**
 * Create a basic emotion state
 */
export function createEmotion(
  primary: BaseEmotion,
  intensity: number = 100,
  secondary?: BaseEmotion
): EmotionState {
  return {
    primary,
    intensity: Math.max(0, Math.min(100, intensity)),
    secondary,
  }
}

/**
 * Create emotion with micro-expressions
 */
export function createDetailedEmotion(
  primary: BaseEmotion,
  intensity: number = 100,
  microExpressions?: MicroExpressions,
  secondary?: BaseEmotion
): EmotionState {
  return {
    primary,
    intensity: Math.max(0, Math.min(100, intensity)),
    secondary,
    microExpressions,
  }
}

/**
 * Create emotion transition
 */
export function createEmotionTransition(
  from: EmotionState,
  to: EmotionState,
  duration: number = 500,
  easing: 'linear' | 'ease-in' | 'ease-out' | 'bounce' = 'ease-out'
): EmotionState {
  return {
    ...to,
    transition: {
      from,
      duration,
      easing,
    },
  }
}

// ============================================
// PRESET EMOTIONS
// ============================================

/**
 * Preset emotion states for quick usage
 * @see Plan.md lines 1132-1143
 */
export const EMOTION_PRESETS: Record<string, EmotionState> = {
  // Basic emotions
  neutral: createEmotion(BaseEmotion.NEUTRAL, 100),
  happy: createEmotion(BaseEmotion.HAPPY, 100),
  sad: createEmotion(BaseEmotion.SAD, 100),
  angry: createEmotion(BaseEmotion.ANGRY, 100),
  surprised: createEmotion(BaseEmotion.SURPRISED, 100),
  confused: createEmotion(BaseEmotion.CONFUSED, 100),
  embarrassed: createEmotion(BaseEmotion.EMBARRASSED, 100),
  determined: createEmotion(BaseEmotion.DETERMINED, 100),
  worried: createEmotion(BaseEmotion.WORRIED, 100),
  excited: createEmotion(BaseEmotion.EXCITED, 100),

  // Mixed emotions with micro-expressions
  'happy-blush': createDetailedEmotion(BaseEmotion.HAPPY, 80, {
    mouth: 'smile',
    blush: true,
    eyes: 'normal',
  }),

  'sad-tears': createDetailedEmotion(BaseEmotion.SAD, 90, {
    mouth: 'frown',
    eyes: 'closed',
    eyebrows: 'furrowed',
  }),

  'angry-shouting': createDetailedEmotion(BaseEmotion.ANGRY, 95, {
    mouth: 'frown',
    eyes: 'wide',
    eyebrows: 'furrowed',
  }),

  'nervous-sweat': createDetailedEmotion(BaseEmotion.WORRIED, 70, {
    sweatDrop: true,
    eyes: 'narrow',
    eyebrows: 'raised',
  }),

  'surprised-shocked': createDetailedEmotion(BaseEmotion.SURPRISED, 100, {
    eyes: 'wide',
    mouth: 'neutral',
    eyebrows: 'raised',
  }),

  'embarrassed-blush': createDetailedEmotion(BaseEmotion.EMBARRASSED, 85, {
    blush: true,
    eyes: 'closed',
    mouth: 'smile',
  }),

  'determined-serious': createDetailedEmotion(BaseEmotion.DETERMINED, 90, {
    eyes: 'narrow',
    mouth: 'neutral',
    eyebrows: 'furrowed',
  }),

  'confused-thinking': createDetailedEmotion(BaseEmotion.CONFUSED, 75, {
    eyes: 'narrow',
    mouth: 'neutral',
    eyebrows: 'raised',
  }),

  'excited-joy': createDetailedEmotion(BaseEmotion.EXCITED, 100, {
    eyes: 'wide',
    mouth: 'smile',
    eyebrows: 'raised',
  }),
}

// ============================================
// EMOTION INTERPOLATION
// ============================================

/**
 * Interpolate between two emotions
 */
export function interpolateEmotions(
  from: EmotionState,
  to: EmotionState,
  progress: number // 0-1
): EmotionState {
  const clampedProgress = Math.max(0, Math.min(1, progress))
  
  return {
    primary: clampedProgress < 0.5 ? from.primary : to.primary,
    intensity: from.intensity + (to.intensity - from.intensity) * clampedProgress,
    secondary: to.secondary,
    microExpressions: to.microExpressions,
  }
}

/**
 * Apply easing function to progress
 */
export function applyEasing(
  progress: number,
  easing: 'linear' | 'ease-in' | 'ease-out' | 'bounce'
): number {
  const t = Math.max(0, Math.min(1, progress))
  
  switch (easing) {
    case 'linear':
      return t
    
    case 'ease-in':
      return t * t
    
    case 'ease-out':
      return 1 - (1 - t) * (1 - t)
    
    case 'bounce':
      if (t < 0.5) {
        return 2 * t * t
      } else {
        return 1 - Math.pow(-2 * t + 2, 2) / 2
      }
    
    default:
      return t
  }
}

// ============================================
// EMOTION STATE COMPARISON
// ============================================

/**
 * Check if two emotions are the same
 */
export function emotionsEqual(a: EmotionState, b: EmotionState): boolean {
  return (
    a.primary === b.primary &&
    Math.abs(a.intensity - b.intensity) < 5 &&
    a.secondary === b.secondary
  )
}

/**
 * Get emotion intensity description
 */
export function getIntensityLabel(intensity: number): string {
  if (intensity >= 90) return 'очень сильно'
  if (intensity >= 70) return 'сильно'
  if (intensity >= 50) return 'заметно'
  if (intensity >= 30) return 'слегка'
  return 'едва заметно'
}

/**
 * Get emotion description
 */
export function getEmotionDescription(emotion: EmotionState): string {
  const intensity = getIntensityLabel(emotion.intensity)
  const primaryLabel = getEmotionLabel(emotion.primary)
  
  if (emotion.secondary) {
    const secondaryLabel = getEmotionLabel(emotion.secondary)
    return `${intensity} ${primaryLabel} с примесью ${secondaryLabel}`
  }
  
  return `${intensity} ${primaryLabel}`
}

/**
 * Get emotion label in Russian
 */
export function getEmotionLabel(emotion: BaseEmotion | string): string {
  const labels: Record<string, string> = {
    neutral: 'нейтрален',
    happy: 'счастлив',
    sad: 'грустен',
    angry: 'зол',
    surprised: 'удивлён',
    confused: 'смущён',
    embarrassed: 'смущён',
    determined: 'решителен',
    worried: 'обеспокоен',
    excited: 'взволнован',
  }
  
  return labels[emotion as string] || (emotion as string)
}

// ============================================
// EMOTION MODIFICATION
// ============================================

/**
 * Blend two emotions
 */
export function blendEmotions(
  base: EmotionState,
  overlay: EmotionState,
  overlayStrength: number = 0.5
): EmotionState {
  const strength = Math.max(0, Math.min(1, overlayStrength))
  
  return {
    primary: strength > 0.5 ? overlay.primary : base.primary,
    intensity: base.intensity * (1 - strength) + overlay.intensity * strength,
    secondary: base.primary !== overlay.primary ? base.primary : undefined,
    microExpressions: overlay.microExpressions || base.microExpressions,
  }
}

/**
 * Intensify emotion
 */
export function intensifyEmotion(emotion: EmotionState, amount: number): EmotionState {
  return {
    ...emotion,
    intensity: Math.max(0, Math.min(100, emotion.intensity + amount)),
  }
}

/**
 * Dampen emotion
 */
export function dampenEmotion(emotion: EmotionState, amount: number): EmotionState {
  return {
    ...emotion,
    intensity: Math.max(0, Math.min(100, emotion.intensity - amount)),
  }
}

/**
 * Set micro-expression
 */
export function setMicroExpression(
  emotion: EmotionState,
  type: keyof MicroExpressions,
  value: any
): EmotionState {
  return {
    ...emotion,
    microExpressions: {
      ...emotion.microExpressions,
      [type]: value,
    },
  }
}

// ============================================
// EMOTION PARSING
// ============================================

/**
 * Parse emotion from string (for backward compatibility)
 */
export function parseEmotion(emotionString: string): EmotionState {
  // Check if it's a preset
  if (emotionString in EMOTION_PRESETS) {
    return EMOTION_PRESETS[emotionString]
  }
  
  // Try to parse as BaseEmotion
  const baseEmotions = Object.values(BaseEmotion) as string[]
  if (baseEmotions.includes(emotionString)) {
    return createEmotion(emotionString as BaseEmotion)
  }
  
  // Default to neutral
  return EMOTION_PRESETS.neutral
}

/**
 * Convert emotion to string (for backward compatibility)
 */
export function emotionToString(emotion: EmotionState | string): string {
  if (typeof emotion === 'string') {
    return emotion
  }
  
  return emotion.primary
}

// ============================================
// EMOTION VALIDATION
// ============================================

/**
 * Validate emotion state
 */
export function isValidEmotion(emotion: any): emotion is EmotionState {
  return (
    emotion &&
    typeof emotion === 'object' &&
    'primary' in emotion &&
    typeof emotion.intensity === 'number' &&
    emotion.intensity >= 0 &&
    emotion.intensity <= 100
  )
}

/**
 * Ensure valid emotion state
 */
export function ensureValidEmotion(emotion: EmotionState | string): EmotionState {
  if (typeof emotion === 'string') {
    return parseEmotion(emotion)
  }
  
  if (isValidEmotion(emotion)) {
    return emotion
  }
  
  return EMOTION_PRESETS.neutral
}

