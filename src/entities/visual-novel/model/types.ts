export interface Scene {
  id: string
  title?: string
  background?: string
  characters: Record<string, Character>
  dialogue: DialogueNode[]
  choices?: DialogueChoice[]
  nextScene?: string
}

export interface Character {
  id: string
  name: string
  sprite?: string
  position: 'left' | 'right' | 'center'
  emotion: string
}

export interface DialogueNode {
  id?: string
  type?: 'dialogue' | 'narration' | 'choice' | 'action'
  characterId?: string
  text?: string
  speaker?: string
  choices?: DialogueChoice[]
  next?: string
  conditions?: string[]
}

export interface DialogueChoice {
  id: string
  text: string
  next?: string
  nextScene?: string
  conditions?: string[]
  setFlags?: Record<string, any>
}

export interface VNState {
  game: GameState
  scenes: Record<string, Scene>
  actions: GameActions
}

export interface CharacterState {
  position: 'left' | 'right' | 'center' | 'offscreen'
  emotion: string
  visible: boolean
}

export interface GameState {
  currentSceneId: string
  lineIndex: number
  characterStates: Record<string, CharacterState>
  inventory: any[]
  flags: Record<string, any>
  history: Array<{
    sceneId: string
    lineIndex: number
    text: string
    speaker: string
  }>
}

export interface GameActions {
  setScene: (sceneId: string) => void
  nextLine: () => void
  choose: (choiceId: string) => void
  setFlag: (key: string, value: any) => void
  reset: (sceneId: string) => void
  hydrate: (state: GameState) => void
}
