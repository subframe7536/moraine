import { describe, expect, it } from 'vitest'

import { snapValueToStep } from './utils'
describe('snapValueToStep', () => {
  it('snaps to the nearest step anchored at min', () => {
    expect(snapValueToStep(0.4, 0, 10, 1)).toBe(0)
    expect(snapValueToStep(0.6, 0, 10, 1)).toBe(1)
    expect(snapValueToStep(1.2, 0.5, 10, 0.5)).toBe(1)
  })

  it('clamps to min and max', () => {
    expect(snapValueToStep(-5, 0, 10, 1)).toBe(0)
    expect(snapValueToStep(15, 0, 10, 1)).toBe(10)
  })

  it('anchors at zero when min is NaN', () => {
    expect(snapValueToStep(3.4, Number.NaN, Number.NaN, 1)).toBe(3)
    expect(snapValueToStep(3.4, Number.NaN, 3, 1)).toBe(3)
  })

  it('breaks negative half-step ties toward positive infinity', () => {
    expect(snapValueToStep(-2.5, -10, 10, 1)).toBe(-2)
    expect(snapValueToStep(2.5, -10, 10, 1)).toBe(3)
  })
})
