import { describe, test, expect } from 'vitest'

import { normalizePanelSizes, normalizeSizeVector, resolveKeyboardDelta, resolveSize } from './size'

const ROOT_SIZE = 1000
describe('size', () => {
  test('resolveSize supports px numbers and percent strings only', () => {
    expect(resolveSize(250, ROOT_SIZE)).toBeCloseTo(0.25, 6)
    expect(resolveSize('25%', ROOT_SIZE)).toBeCloseTo(0.25, 6)
    expect(resolveSize('250px' as never, ROOT_SIZE)).toBe(0)
  })

  test('resolveKeyboardDelta keeps default and explicit units stable', () => {
    expect(resolveKeyboardDelta(undefined, ROOT_SIZE)).toBeCloseTo(0.1, 6)
    expect(resolveKeyboardDelta(100, ROOT_SIZE)).toBeCloseTo(0.1, 6)
    expect(resolveKeyboardDelta('5%', ROOT_SIZE)).toBeCloseTo(0.05, 6)
  })

  test('normalizeSizeVector handles zero, negative and non-finite inputs', () => {
    expect(normalizeSizeVector([0, 0, 0])).toEqual([0.333333, 0.333333, 0.333334])
    expect(normalizeSizeVector([1, -1, Number.NaN, Number.POSITIVE_INFINITY])).toEqual([1, 0, 0, 0])
    expect(normalizeSizeVector([Number.NaN, Number.POSITIVE_INFINITY])).toEqual([0.5, 0.5])
  })

  test('normalizePanelSizes keeps provided controlled sizes and fills undefined sizes with remainder', () => {
    expect(
      normalizePanelSizes({
        panelCount: 3,
        rootSize: ROOT_SIZE,
        panelInitialSizes: [undefined, undefined, undefined],
        panelMinSizes: [0, 0, 0],
        panelMaxSizes: [1, 1, 1],
        controlledSizes: [200, undefined, undefined],
      }),
    ).toEqual([0.2, 0.4, 0.4])
  })

  test('normalizePanelSizes falls back undefined controlled sizes to zero when provided sum exceeds one', () => {
    expect(
      normalizePanelSizes({
        panelCount: 3,
        rootSize: ROOT_SIZE,
        panelInitialSizes: [undefined, undefined, undefined],
        panelMinSizes: [0, 0, 0],
        panelMaxSizes: [1, 1, 1],
        controlledSizes: [800, 600, undefined],
      }),
    ).toEqual([0.571429, 0.428571, 0])
  })

  test('normalizePanelSizes prefers defaultSize for uncontrolled items in mixed controlled mode', () => {
    expect(
      normalizePanelSizes({
        panelCount: 3,
        rootSize: ROOT_SIZE,
        panelInitialSizes: ['30%', '40%', undefined],
        panelMinSizes: [0, 0, 0],
        panelMaxSizes: [1, 1, 1],
        controlledSizes: [200, undefined, undefined],
      }),
    ).toEqual([0.2, 0.4, 0.4])
  })

  test('normalizePanelSizes clamps mixed controlled/default sizes by min and max', () => {
    expect(
      normalizePanelSizes({
        panelCount: 3,
        rootSize: ROOT_SIZE,
        panelInitialSizes: ['30%', '40%', undefined],
        panelMinSizes: [0.1, 0.3, 0.2],
        panelMaxSizes: [0.5, 0.45, 0.35],
        controlledSizes: [900, undefined, undefined],
      }),
    ).toEqual([0.5, 0.3, 0.2])
  })
})
