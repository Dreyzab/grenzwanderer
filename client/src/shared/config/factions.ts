export const FACTIONS = {
  FJR: { id: 'FJR', name: 'Федеральная Жандармерия Восстановления', colorVar: '--color-faction-fjr' },
  ANARCHISTS: { id: 'ANARCHISTS', name: 'Свободная Коммуна Дыры', colorVar: '--color-faction-an' },
  SYNTHESIS: { id: 'SYNTHESIS', name: 'Синтез', colorVar: '--color-faction-syn' },
  POLIZEI: { id: 'POLIZEI', name: 'Polizei', colorVar: '--color-faction-pol' },
  ARTISANS: { id: 'ARTISANS', name: 'Артисаны', colorVar: '--color-faction-art' },
  TRADERS: { id: 'TRADERS', name: 'Торговцы', colorVar: '--color-faction-tr' },
  OLD_BELIEVERS: { id: 'OLD_BELIEVERS', name: 'Староверы', colorVar: '--color-faction-ob' },
  FARMERS: { id: 'FARMERS', name: 'Фермеры', colorVar: '--color-faction-farm' },
} as const

export type FactionId = keyof typeof FACTIONS


