import { useGameState } from '@/entities/visual-novel/model/hooks'
import { DialogueBox } from './parts/DialogueBox'
import { ChoiceMenu } from './parts/ChoiceMenu'
import { CharacterSprites } from './parts/CharacterSprites'
import { Background } from './parts/Background'
import { GameUI } from './parts/GameUI'

export const GameEngine = () => {
  const { currentScene, gameState } = useGameState()
  if (!currentScene) return null

  return (
    <div className="game-container fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      <Background src={currentScene.background} />
      <CharacterSprites characters={currentScene.characters} />
      <DialogueBox items={currentScene.dialogue} lineIndex={gameState.lineIndex} />
      <ChoiceMenu choices={currentScene.choices ?? []} />
      <GameUI />
    </div>
  )
}

export default GameEngine


