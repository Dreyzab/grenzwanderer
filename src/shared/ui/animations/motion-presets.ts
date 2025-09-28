import type { Variants } from 'framer-motion'

type MotionContext = 'ui' | 'button' | 'gameplay' | 'system'
type CardVariant = 'default' | 'hover-lift' | 'press-scale' | 'glow'

type CardVariantsFactory = (glowShadow?: string) => Variants

type MotionVariants = {
  container: (stagger?: number) => Variants
  card: CardVariantsFactory
}

type MotionTransitions = {
  enter: { duration: number; ease: string | number[] }
  hover: { duration: number; ease: string | number[] }
  tap: { duration: number; ease: string | number[] }
}

type MotionPreset = {
  variants: Record<CardVariant, CardVariantsFactory>
  container: (stagger?: number) => Variants
  transitions: MotionTransitions
}

type MotionRegistry = Record<MotionContext, MotionPreset>

type MotionResolver = {
  getPreset: (context: MotionContext) => MotionPreset
}

const baseCardVariants: Record<CardVariant, CardVariantsFactory> = {
  default: () => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    hover: { y: -4 },
    tap: { scale: 0.98 },
  }),
  'hover-lift': () => ({
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    hover: { y: -10, scale: 1.04 },
    tap: { scale: 0.97 },
  }),
  'press-scale': () => ({
    initial: { opacity: 0, scale: 0.94 },
    animate: { opacity: 1, scale: 1 },
    hover: { scale: 1.03 },
    tap: { scale: 0.92 },
  }),
  glow: (glowShadow = 'var(--shadow-card-hover)') => ({
    initial: { opacity: 0, boxShadow: '0 0 0 rgba(99,102,241,0)' },
    animate: { opacity: 1, boxShadow: glowShadow },
    hover: { boxShadow: '0 0 42px rgba(99,102,241,0.5)' },
    tap: { scale: 0.98 },
  }),
}

const createContainer = (stagger = 0.12): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger,
      delayChildren: 0.1,
    },
  },
})

const uiTransitions: MotionTransitions = {
  enter: { duration: 0.28, ease: [0.25, 0.8, 0.25, 1] },
  hover: { duration: 0.2, ease: 'easeOut' },
  tap: { duration: 0.12, ease: 'easeOut' },
}

const buttonTransitions: MotionTransitions = {
  enter: { duration: 0.18, ease: [0.34, 1.56, 0.64, 1] },
  hover: { duration: 0.16, ease: [0.34, 1.56, 0.64, 1] },
  tap: { duration: 0.1, ease: [0.42, 0, 0.58, 1] },
}

const gameplayTransitions: MotionTransitions = {
  enter: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  hover: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  tap: { duration: 0.14, ease: [0.4, 0, 0.2, 1] },
}

const systemTransitions: MotionTransitions = {
  enter: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
  hover: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
  tap: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
}

const motionRegistry: MotionRegistry = {
  ui: {
    variants: baseCardVariants,
    container: (stagger) => createContainer(stagger),
    transitions: uiTransitions,
  },
  button: {
    variants: {
      ...baseCardVariants,
      default: () => ({
        initial: { opacity: 0, scale: 0.94 },
        animate: { opacity: 1, scale: 1 },
        hover: { scale: 1.04 },
        tap: { scale: 0.9 },
      }),
    },
    container: (stagger) => createContainer(stagger),
    transitions: buttonTransitions,
  },
  gameplay: {
    variants: baseCardVariants,
    container: (stagger) => createContainer(stagger),
    transitions: gameplayTransitions,
  },
  system: {
    variants: baseCardVariants,
    container: (stagger) => createContainer(stagger),
    transitions: systemTransitions,
  },
}

export const motionPresets: MotionResolver = {
  getPreset: (context) => motionRegistry[context] ?? motionRegistry.ui,
}

type UseMotionContextResult = {
  variants: {
    card: CardVariantsFactory
    container: MotionPreset['container']
  }
  transition: MotionTransitions['enter']
}

export type { MotionContext, CardVariant, MotionPreset }
export { motionRegistry }
export const useMotionResolver = (): MotionResolver => motionPresets

export function resolveMotionPreset(context: MotionContext, variant: CardVariant) {
  const preset = motionPresets.getPreset(context)
  const card = preset.variants[variant] ?? preset.variants.default
  return {
    card,
    container: preset.container,
    transition: preset.transitions,
  }
}
