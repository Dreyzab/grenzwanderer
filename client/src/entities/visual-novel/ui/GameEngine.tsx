import { useGameState } from '@/entities/visual-novel/model/hooks'
import { DialogueBox } from './parts/DialogueBox'
import { ChoiceMenu } from './parts/ChoiceMenu'
import { CharacterSprites } from './parts/CharacterSprites'
import { Background } from './parts/Background'
import { GameUI } from './parts/GameUI'
import { useVNStore } from '@/entities/visual-novel/model/store'
import { useSceneEngine } from '@/entities/visual-novel/model/hooks'

export const GameEngine = () => {
  const { currentScene, gameState } = useGameState()
  const next = useVNStore((s) => s.actions.nextLine)
  const { handleInlineActions } = useSceneEngine()
  if (!currentScene) return null

  return (
    <div
      className="game-container fixed inset-0 w-screen h-screen overflow-hidden bg-black"
      onClick={() => {
        const navigated = handleInlineActions()
        if (!navigated) next()
      }}
    >
      <Background src={currentScene.background} />
      <CharacterSprites characters={currentScene.characters} />
      <DialogueBox items={currentScene.dialogue} lineIndex={gameState.lineIndex} />
      <ChoiceMenu choices={currentScene.choices ?? []} />
      <GameUI />
    </div>
  )
}

export default GameEngine


