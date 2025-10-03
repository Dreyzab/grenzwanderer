/**
 * ANIMATION ENGINE
 * Character animations and transitions for Visual Novel
 * Based on Framer Motion and Plan.md specifications
 * @see Plan.md lines 1305-1335
 */

import type { Variants, Transition } from 'framer-motion'
import type { AnimationType, CharacterAnimation, CharacterPosition } from '../model/types'

// ============================================
// ANIMATION VARIANTS
// ============================================

/**
 * Character enter animations by position
 * @see Plan.md lines 1327
 */
export const ENTER_VARIANTS: Record<CharacterPosition, Variants> = {
  left: {
    initial: { x: -200, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -200, opacity: 0 },
  },
  right: {
    initial: { x: 200, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 200, opacity: 0 },
  },
  center: {
    initial: { y: -50, opacity: 0, scale: 0.8 },
    animate: { y: 0, opacity: 1, scale: 1 },
    exit: { y: 50, opacity: 0, scale: 0.8 },
  },
  offscreen: {
    initial: { opacity: 0 },
    animate: { opacity: 0 },
    exit: { opacity: 0 },
  },
}

/**
 * Character talking animation (idle bounce)
 * @see Plan.md lines 1329
 */
export const TALK_VARIANT: Variants = {
  idle: {
    y: [0, -5, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  talking: {
    y: [0, -8, 0, -5, 0],
    transition: {
      duration: 0.4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

/**
 * Emotion change animation
 * @see Plan.md lines 1330
 */
export const EMOTION_VARIANT: Variants = {
  initial: { scale: 1 },
  change: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

/**
 * Gesture animations
 * @see Plan.md lines 1331
 */
export const GESTURE_VARIANTS: Record<string, Variants> = {
  nod: {
    animate: {
      rotate: [0, -5, 0, -3, 0],
      transition: { duration: 0.8 },
    },
  },
  shake: {
    animate: {
      rotate: [0, 5, -5, 3, -3, 0],
      transition: { duration: 0.6 },
    },
  },
  wave: {
    animate: {
      rotate: [0, 10, -10, 10, -10, 0],
      originX: 0.7,
      originY: 0.3,
      transition: { duration: 1 },
    },
  },
  bow: {
    animate: {
      rotateX: [0, 15, 0],
      y: [0, 20, 0],
      transition: { duration: 1.2 },
    },
  },
}

/**
 * Movement animation between positions
 * @see Plan.md lines 1332
 */
export function createMoveAnimation(
  from: CharacterPosition,
  to: CharacterPosition
): Variants {
  const positions: Record<CharacterPosition, number> = {
    left: -200,
    center: 0,
    right: 200,
    offscreen: 0,
  }

  return {
    initial: { x: positions[from] },
    animate: { 
      x: positions[to],
      transition: {
        duration: 0.6,
        ease: 'easeInOut',
      },
    },
  }
}

// ============================================
// SPECIAL EFFECTS
// ============================================

/**
 * Bounce effect
 * @see Plan.md lines 1319
 */
export const BOUNCE_EFFECT: Variants = {
  animate: {
    y: [0, -20, 0, -10, 0],
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

/**
 * Shake effect
 * @see Plan.md lines 1320
 */
export function createShakeEffect(intensity: number = 10, frequency: number = 5): Variants {
  const shakes = Array.from({ length: frequency }, (_, i) => {
    const sign = i % 2 === 0 ? 1 : -1
    return sign * intensity * (1 - i / frequency)
  })
  
  return {
    animate: {
      x: [...shakes, 0],
      transition: {
        duration: 0.5,
      },
    },
  }
}

/**
 * Glow effect
 * @see Plan.md lines 1321
 */
export function createGlowEffect(color: string, intensity: number): Variants {
  const glowIntensity = Math.max(0, Math.min(1, intensity / 100))
  
  return {
    animate: {
      filter: [
        'drop-shadow(0 0 0px rgba(0,0,0,0))',
        `drop-shadow(0 0 ${10 * glowIntensity}px ${color})`,
        'drop-shadow(0 0 0px rgba(0,0,0,0))',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }
}

/**
 * Blur effect
 * @see Plan.md lines 1322
 */
export function createBlurEffect(amount: number): Variants {
  return {
    initial: { filter: 'blur(0px)' },
    animate: { 
      filter: `blur(${amount}px)`,
      transition: { duration: 0.3 },
    },
  }
}

// ============================================
// TRANSITION CONFIGURATIONS
// ============================================

/**
 * Standard transitions
 */
export const TRANSITIONS: Record<string, Transition> = {
  default: {
    duration: 0.3,
    ease: 'easeOut',
  },
  
  fast: {
    duration: 0.15,
    ease: 'easeOut',
  },
  
  slow: {
    duration: 0.6,
    ease: 'easeInOut',
  },
  
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  
  bounce: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
  },
}

// ============================================
// ANIMATION BUILDER
// ============================================

/**
 * Build animation configuration
 * @see Plan.md lines 1305-1325
 */
export function buildCharacterAnimation(config: CharacterAnimation): Variants {
  const { type, duration, easing, transforms, specialEffects } = config
  
  const variants: Variants = {
    initial: {},
    animate: {},
  }
  
  // Apply transforms
  if (transforms) {
    if (transforms.position) {
      variants.animate!.x = transforms.position.x
      variants.animate!.y = transforms.position.y
    }
    if (transforms.scale) {
      variants.animate!.scaleX = transforms.scale.x
      variants.animate!.scaleY = transforms.scale.y
    }
    if (transforms.rotation !== undefined) {
      variants.animate!.rotate = transforms.rotation
    }
    if (transforms.opacity !== undefined) {
      variants.animate!.opacity = transforms.opacity
    }
  }
  
  // Apply transition
  variants.animate!.transition = {
    duration: duration / 1000, // Convert ms to seconds
    ease: easing,
  }
  
  // Apply special effects
  if (specialEffects) {
    if (specialEffects.bounce) {
      Object.assign(variants, BOUNCE_EFFECT)
    }
    if (specialEffects.shake) {
      const { intensity = 10, frequency = 5 } = specialEffects.shake
      Object.assign(variants, createShakeEffect(intensity, frequency))
    }
    if (specialEffects.glow) {
      const { color, intensity } = specialEffects.glow
      Object.assign(variants, createGlowEffect(color, intensity))
    }
    if (specialEffects.blur) {
      Object.assign(variants, createBlurEffect(specialEffects.blur))
    }
  }
  
  return variants
}

/**
 * Get preset animation by type
 */
export function getPresetAnimation(type: AnimationType): Variants {
  switch (type) {
    case 'enter':
      return ENTER_VARIANTS.center
    case 'exit':
      return ENTER_VARIANTS.center
    case 'idle':
      return TALK_VARIANT
    case 'talk':
      return TALK_VARIANT
    case 'emotion':
      return EMOTION_VARIANT
    case 'gesture':
      return GESTURE_VARIANTS.nod
    case 'move':
      return createMoveAnimation('center', 'right')
    default:
      return ENTER_VARIANTS.center
  }
}

// ============================================
// ANIMATION SEQUENCING
// ============================================

/**
 * Create animation sequence
 */
export function createAnimationSequence(animations: CharacterAnimation[]): Variants {
  // Combine multiple animations into a sequence
  const sequence: Variants = {
    initial: {},
    animate: {},
  }
  
  // This is a simplified version - in production you'd use
  // Framer Motion's orchestration features
  for (const anim of animations) {
    const variants = buildCharacterAnimation(anim)
    Object.assign(sequence.animate!, variants.animate)
  }
  
  return sequence
}

// ============================================
// ANIMATION UTILITIES
// ============================================

/**
 * Calculate animation duration
 */
export function calculateAnimationDuration(animation: CharacterAnimation): number {
  return animation.duration
}

/**
 * Check if animation has special effects
 */
export function hasSpecialEffects(animation: CharacterAnimation): boolean {
  return !!animation.specialEffects
}

/**
 * Merge animations
 */
export function mergeAnimations(base: Variants, overlay: Variants): Variants {
  return {
    initial: { ...base.initial, ...overlay.initial },
    animate: { ...base.animate, ...overlay.animate },
    exit: { ...base.exit, ...overlay.exit },
  }
}

// ============================================
// ANIMATION PRESETS
// ============================================

/**
 * Common animation presets for quick use
 */
export const ANIMATION_PRESETS: Record<string, CharacterAnimation> = {
  // Basic movements
  slideInLeft: {
    type: 'enter',
    duration: 300,
    easing: 'easeOut',
    transforms: { position: { x: -200, y: 0 }, opacity: 0 },
  },
  
  slideInRight: {
    type: 'enter',
    duration: 300,
    easing: 'easeOut',
    transforms: { position: { x: 200, y: 0 }, opacity: 0 },
  },
  
  fadeIn: {
    type: 'enter',
    duration: 400,
    easing: 'ease-out',
    transforms: { opacity: 0 },
  },
  
  // Emotions
  surprised: {
    type: 'emotion',
    duration: 200,
    easing: 'ease-out',
    specialEffects: { bounce: true },
  },
  
  shocked: {
    type: 'emotion',
    duration: 300,
    easing: 'ease-out',
    specialEffects: { shake: { intensity: 15, frequency: 6 } },
  },
  
  // Gestures
  nod: {
    type: 'gesture',
    duration: 800,
    easing: 'ease-in-out',
    transforms: { rotation: 5 },
  },
  
  shake: {
    type: 'gesture',
    duration: 600,
    easing: 'ease-in-out',
    specialEffects: { shake: { intensity: 10, frequency: 5 } },
  },
}


