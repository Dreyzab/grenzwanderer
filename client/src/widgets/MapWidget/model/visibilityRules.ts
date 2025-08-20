import type { VisibleMapPoint } from '@/entities/map-point/model/types'

export interface VisibilityContext {
  phase?: number | null
  deliveryStep?: string | null
}

interface VisibilityRule {
  ids: string[]
  predicate: (point: VisibleMapPoint, ctx: VisibilityContext) => boolean
}

export const visibilityRules: VisibilityRule[] = [
  { ids: ['settlement_center'], predicate: (_p, ctx) => (ctx.deliveryStep ?? 'not_started') === 'not_started' },
  { ids: ['trader_camp'], predicate: (_p, ctx) => ctx.deliveryStep === 'need_pickup_from_trader' || ctx.deliveryStep === 'deliver_parts_to_craftsman' },
  { ids: ['workshop_center'], predicate: (_p, ctx) => ctx.deliveryStep === 'deliver_parts_to_craftsman' || ctx.deliveryStep === 'return_to_craftsman' },
  { ids: ['northern_anomaly'], predicate: (_p, ctx) => ctx.deliveryStep === 'go_to_anomaly' },
  { ids: ['fjr_board', 'fjr_office_start'], predicate: (_p, ctx) => (ctx.phase ?? 1) >= 1 },
]

export function resolveVisibleIds(points: VisibleMapPoint[], ctx: VisibilityContext): Set<string> {
  const result = new Set<string>()
  for (const point of points) {
    for (const rule of visibilityRules) {
      if (rule.ids.includes(point.id) && rule.predicate(point, ctx)) {
        result.add(point.id)
        break
      }
    }
  }
  if (result.size === 0 && (ctx.deliveryStep ?? 'not_started') === 'not_started') {
    const start = points.find((x) => x.id === 'settlement_center')
    if (start) result.add(start.id)
  }
  return result
}


