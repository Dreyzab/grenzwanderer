export interface DialogChoice {
  text: string
  nextNodeKey: string | null
  action?: string
  eventOutcomeKey?: string
}

export interface DialogNode {
  text: string
  speakerKey?: string
  choices: DialogChoice[]
}

export interface DialogDefinition {
  _id: string
  dialogKey: string
  title: string
  startNodeKey: string
  nodes: Record<string, DialogNode>
  backgroundImage?: string
  updatedAt: number
  questId?: string
}

export type DialogMap = Record<string, DialogDefinition>


