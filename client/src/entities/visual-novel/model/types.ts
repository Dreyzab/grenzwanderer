export interface CharacterInstance {
  id: string
  name?: string
  sprite: string
  emotion?: string
  position?: 'left' | 'center' | 'right'
}

export interface DialogueItem {
  speaker?: string
  text: string
  emotion?: string
  sound?: string
  action?: string
  dialogKey?: string
}

export interface Choice {
  id: string
  text: string
  nextScene?: string
  setFlags?: Record<string, boolean>
  conditions?: Condition[]
}

export interface Condition {
  flag: string
  equals: boolean
}

export interface Scene {
  id: string
  background: string
  characters: CharacterInstance[]
  dialogue: DialogueItem[]
  choices?: Choice[]
  nextScene?: string
  conditions?: Condition[]
}

export interface DialogueHistoryItem {
  sceneId: string
  lineIndex: number
  speaker?: string
  text: string
}

export interface Item {
  id: string
  title: string
}

export type PendingAction =
  | {
      type: 'quest'
      op: 'start' | 'advance' | 'complete'
      questId: string
      step?: string
    }
  | {
      type: 'outcome'
      fameDelta?: number
      reputationsDelta?: Record<string, number>
      relationshipsDelta?: Record<string, number>
      addFlags?: string[]
      removeFlags?: string[]
      addWorldFlags?: string[]
      removeWorldFlags?: string[]
      setPhase?: number
      setStatus?: string
    }

export interface GameState {
  currentSceneId: string
  lineIndex: number
  characterStates: Record<string, { emotion?: string }>
  inventory: Item[]
  flags: Record<string, boolean>
  history: DialogueHistoryItem[]
}

export interface GameActions {
  setScene: (sceneId: string) => void
  nextLine: () => void
  choose: (choiceId: string) => void
  setFlag: (key: string, value: boolean) => void
  reset: (sceneId: string) => void
  hydrate: (state: GameState) => void
  addPendingAction: (action: PendingAction) => void
  flushPendingActions: () => Promise<void>
}


