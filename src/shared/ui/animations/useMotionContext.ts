import { resolveMotionPreset } from './motion-presets'
import type { MotionContext, CardVariant } from './motion-presets'

export function useMotionContext(context: MotionContext = 'ui', variant: CardVariant = 'default') {
  const preset = resolveMotionPreset(context, variant)

  return {
    variants: {
      card: preset.card,
      container: preset.container,
    },
    transition: preset.transition,
  }
}
