import type { DialogDefinition } from '@/shared/dialogs/types'
import { deliveryQuestDialogs } from './deliveryQuestDialogs'
import { loyaltyQuestDialogs } from './loyaltyQuestDialogs'
import { waterQuestDialogs } from './waterQuestDialogs'
import { freedomQuestDialogs } from './freedomQuestDialogs'
import { combatBaptismQuestDialogs } from './combatBaptismQuestDialogs'
import { fieldMedicineQuestDialogs } from './fieldMedicineQuestDialogs'
import { quietCoveQuestDialogs } from './quietCoveQuestDialogs'
import { bellQuestDialogs } from './bellQuestDialogs'
import { citizenshipQuestDialogs } from './citizenshipQuestDialogs'
import { eyesInDarkQuestDialogs } from './eyesInDarkQuestDialogs'
import { voidShardsQuestDialogs } from './voidShardsQuestDialogs'

// Системный диалог выбора квеста Фазы 1
const phase1ChoiceDialog = {
  _id: 'phase_1_choice_dialog',
  dialogKey: 'phase_1_choice_dialog',
  title: 'Первые шаги: выберите задание',
  startNodeKey: 'start',
  nodes: {
    start: {
      text: 'С чего начнёте? Можно взять одно задание сейчас, другие останутся доступны позже.',
      choices: [
        { text: 'Доставка для Дитера (Артисаны/Торговцы)', nextNodeKey: null, action: 'start_delivery_quest' },
        { text: 'Полевая Медицина ("Синтез")', nextNodeKey: null, action: 'start_field_medicine_quest' },
        { text: 'Боевое Крещение (FJR)', nextNodeKey: null, action: 'start_combat_baptism_quest' },
        { text: 'Шёпот в "Тихой Заводи" (Торговцы/Анархисты)', nextNodeKey: null, action: 'start_quiet_cove_quest' },
        { text: 'Колокол для Заблудших (Староверы)', nextNodeKey: null, action: 'start_bell_for_lost_quest' },
      ],
    },
  },
  updatedAt: Date.now(),
}

const registry: Record<string, DialogDefinition> = Object.fromEntries(
  [
    phase1ChoiceDialog as unknown as DialogDefinition,
    ...(deliveryQuestDialogs as unknown as DialogDefinition[]),
    ...(loyaltyQuestDialogs as unknown as DialogDefinition[]),
    ...(waterQuestDialogs as unknown as DialogDefinition[]),
    ...(freedomQuestDialogs as unknown as DialogDefinition[]),
    ...(combatBaptismQuestDialogs as unknown as DialogDefinition[]),
    ...(fieldMedicineQuestDialogs as unknown as DialogDefinition[]),
    ...(quietCoveQuestDialogs as unknown as DialogDefinition[]),
    ...(bellQuestDialogs as unknown as DialogDefinition[]),
    ...(citizenshipQuestDialogs as unknown as DialogDefinition[]),
    ...(eyesInDarkQuestDialogs as unknown as DialogDefinition[]),
    ...(voidShardsQuestDialogs as unknown as DialogDefinition[]),
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


