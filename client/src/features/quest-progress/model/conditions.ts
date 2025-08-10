import type { DialogChoice } from '@/shared/dialogs/types'
import { usePlayerStore } from '@/entities/player/model/store'

export function isChoiceAllowed(choice: DialogChoice): boolean {
  if (!choice.condition) return true
  const cond = choice.condition
  const { credits, skills } = usePlayerStore.getState()

  if (cond === 'player_has_20_credits') return credits >= 20
  if (cond === 'player_has_tech_skill') return skills.has('tech')

  return true
}


