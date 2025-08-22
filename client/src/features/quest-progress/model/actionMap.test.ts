import { describe, it, expect } from 'vitest'
import { resolveDialogAction } from './actionMap'

describe('resolveDialogAction', () => {
  it('returns phase descriptor for set_phase_1', async () => {
    const d = await resolveDialogAction('set_phase_1')
    expect(d).toEqual({ kind: 'phase', phase: 1 })
  })

  it('returns delivery START event', async () => {
    const d = await resolveDialogAction('start_delivery_quest')
    expect(d).toEqual({ kind: 'fsm', machine: 'delivery', event: { type: 'START' } })
  })

  it('returns delivery ADVANCE with explicit step', async () => {
    const d = await resolveDialogAction('return_to_craftsman')
    expect(d).toEqual({ kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'return_to_craftsman' } })
  })
})


