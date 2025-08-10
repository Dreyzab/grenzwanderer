import type { DialogDefinition } from '@/shared/dialogs/types'
import { deliveryQuestDialogs } from './deliveryQuestDialogs'
import { loyaltyQuestDialogs } from './loyaltyQuestDialogs'
import { waterQuestDialogs } from './waterQuestDialogs'
import { freedomQuestDialogs } from './freedomQuestDialogs'

const registry: Record<string, DialogDefinition> = Object.fromEntries(
  [
    ...(deliveryQuestDialogs as unknown as DialogDefinition[]),
    ...(loyaltyQuestDialogs as unknown as DialogDefinition[]),
    ...(waterQuestDialogs as unknown as DialogDefinition[]),
    ...(freedomQuestDialogs as unknown as DialogDefinition[]),
  ].map((d) => [d.dialogKey, d]),
)

export function getDialogByKey(key: string): DialogDefinition | undefined {
  return registry[key]
}

export function dialogExists(key: string): boolean {
  return Boolean(registry[key])
}

export function listDialogs(): DialogDefinition[] {
  return Object.values(registry)
}


