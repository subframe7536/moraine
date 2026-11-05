import { describe, expect, test } from 'vitest'

import {
  closestSnapPointIndex,
  getSnapPointSwipeMovement,
  resolveSnapPointValue,
  resolveSnapPoints,
} from './drawer-snap-points'

describe('resolveSnapPointValue', () => {
  test('resolves fraction numbers against the viewport height', () => {
    expect(resolveSnapPointValue(0.5, 800, 16)).toBe(400)
    expect(resolveSnapPointValue(1, 800, 16)).toBe(800)
    expect(resolveSnapPointValue(0, 800, 16)).toBe(0)
    expect(resolveSnapPointValue(-0.5, 800, 16)).toBe(0)
  })

  test('resolves numbers above 1 as pixels', () => {
    expect(resolveSnapPointValue(148, 800, 16)).toBe(148)
    expect(resolveSnapPointValue(2000, 800, 16)).toBe(2000)
  })

  test('resolves px and rem strings', () => {
    expect(resolveSnapPointValue('148px', 800, 16)).toBe(148)
    expect(resolveSnapPointValue('10rem', 800, 16)).toBe(160)
    expect(resolveSnapPointValue('12rem', 800, 20)).toBe(240)
  })

  test('drops invalid values', () => {
    expect(resolveSnapPointValue(Number.NaN, 800, 16)).toBeNull()
    expect(resolveSnapPointValue('abc' as never, 800, 16)).toBeNull()
    expect(resolveSnapPointValue('px' as never, 800, 16)).toBeNull()
    expect(resolveSnapPointValue(0.5, 0, 16)).toBeNull()
  })
})

describe('resolveSnapPoints', () => {
  test('clamps heights to min(popupHeight, viewportHeight) and derives offsets', () => {
    const resolved = resolveSnapPoints([0.5, '2000px', 100], 400, 800, 16)
    // 0.5 and '2000px' resolve to the same 400px height; the later entry wins.
    expect(resolved).toEqual([
      { value: '2000px', height: 400, offset: 0 },
      { value: 100, height: 100, offset: 300 },
    ])
  })

  test('deduplicates heights within 1px keeping later entries', () => {
    const resolved = resolveSnapPoints(['100px', '100.5px', '200px'], 400, 800, 16)
    expect(resolved.map((point) => point.value)).toEqual(['100.5px', '200px'])
  })

  test('returns empty without snap points or measurable sizes', () => {
    expect(resolveSnapPoints(undefined, 400, 800, 16)).toEqual([])
    expect(resolveSnapPoints([0.5], 0, 800, 16)).toEqual([])
    expect(resolveSnapPoints([0.5], 400, 0, 16)).toEqual([])
  })
})

describe('closestSnapPointIndex', () => {
  test('returns the index of the nearest value', () => {
    expect(closestSnapPointIndex([0, 100, 300], 220)).toBe(2)
    expect(closestSnapPointIndex([0, 100, 300], 40)).toBe(0)
    expect(closestSnapPointIndex([], 100)).toBe(-1)
  })
})

describe('getSnapPointSwipeMovement', () => {
  test('passes movement through while the offset stays open', () => {
    expect(getSnapPointSwipeMovement(100, 50)).toBe(50)
    expect(getSnapPointSwipeMovement(100, -50)).toBe(-50)
  })

  test('damps movement past the fully-open edge', () => {
    // Overshoot of 9px past the edge shrinks to sqrt(9) = 3px of resistance.
    expect(getSnapPointSwipeMovement(100, -109)).toBe(-103)
    expect(getSnapPointSwipeMovement(0, -64)).toBe(-8)
  })
})
