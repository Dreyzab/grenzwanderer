import { describe, it, expect } from 'vitest'
import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import { resolveVisibleIds } from './visibilityRules.ts'

const base = (id: string): VisibleMapPoint => ({
  id,
  title: id,
  coordinates: { lat: 0, lng: 0 },
  type: 'landmark',
  isActive: true,
})

describe('resolveVisibleIds', () => {
  it('shows settlement_center only before delivery quest starts', () => {
    const pts = [base('settlement_center')]
    expect(resolveVisibleIds(pts, { phase: 1, deliveryStep: 'not_started' }).has('settlement_center')).toBe(true)
    expect(resolveVisibleIds(pts, { phase: 1, deliveryStep: 'need_pickup_from_trader' }).has('settlement_center')).toBe(false)
    expect(resolveVisibleIds(pts, { phase: 1, deliveryStep: 'completed' }).has('settlement_center')).toBe(false)
  })

  it('shows trader_camp for pickup/deliver steps', () => {
    const pts = [base('trader_camp')]
    expect(resolveVisibleIds(pts, { phase: 1, deliveryStep: 'need_pickup_from_trader' }).has('trader_camp')).toBe(true)
    expect(resolveVisibleIds(pts, { phase: 1, deliveryStep: 'deliver_parts_to_craftsman' }).has('trader_camp')).toBe(true)
    expect(resolveVisibleIds(pts, { phase: 1, deliveryStep: 'return_to_craftsman' }).has('trader_camp')).toBe(false)
  })

  it('shows workshop_center for deliver/return steps', () => {
    const pts = [base('workshop_center')]
    expect(resolveVisibleIds(pts, { phase: 1, deliveryStep: 'deliver_parts_to_craftsman' }).has('workshop_center')).toBe(true)
    expect(resolveVisibleIds(pts, { phase: 1, deliveryStep: 'return_to_craftsman' }).has('workshop_center')).toBe(true)
    expect(resolveVisibleIds(pts, { phase: 1, deliveryStep: 'need_pickup_from_trader' }).has('workshop_center')).toBe(false)
  })

  it('shows northern_anomaly only when go_to_anomaly', () => {
    const pts = [base('northern_anomaly')]
    expect(resolveVisibleIds(pts, { phase: 1, deliveryStep: 'go_to_anomaly' }).has('northern_anomaly')).toBe(true)
    expect(resolveVisibleIds(pts, { phase: 1, deliveryStep: 'return_to_craftsman' }).has('northern_anomaly')).toBe(false)
  })

  it('shows fjr_board and fjr_office_start when phase >=1', () => {
    const pts = [base('fjr_board'), base('fjr_office_start')]
    const res = resolveVisibleIds(pts, { phase: 1, deliveryStep: 'not_started' })
    expect(res.has('fjr_board')).toBe(true)
    expect(res.has('fjr_office_start')).toBe(true)
  })

  it('falls back to settlement_center only if delivery not started', () => {
    const pts = [base('settlement_center'), base('something_else')]
    const res1 = resolveVisibleIds(pts, { phase: undefined, deliveryStep: 'not_started' })
    expect(res1.has('settlement_center')).toBe(true)
    const res2 = resolveVisibleIds(pts, { phase: undefined, deliveryStep: 'completed' })
    expect(res2.has('settlement_center')).toBe(false)
  })
})

