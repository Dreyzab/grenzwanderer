import GameEngine from '@/entities/visual-novel/ui/GameEngine'
import { useVNStore } from '@/entities/visual-novel/model/store'
import { scenarios } from '@/entities/visual-novel/api/scenarios'

export function Component() {
  useVNStore.setState((s) => ({ ...s, scenes: scenarios }))
  return <GameEngine />
}

export default Component


