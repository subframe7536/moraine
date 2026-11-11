import { describe, expect, test } from 'vitest'

import { normalizePanelSizes, normalizeSizeVector } from './size'

describe('size', () => {
  test('normalizeSizeVector handles zero, negative and non-finite inputs', () => {
    expect(normalizeSizeVector([0, 0, 0])).toEqual([0.333333, 0.333333, 0.333334])
    expect(normalizeSizeVector([1, -1, Number.NaN, Number.POSITIVE_INFINITY])).toEqual([1, 0, 0, 0])
    expect(normalizeSizeVector([Number.NaN, Number.POSITIVE_INFINITY])).toEqual([0.5, 0.5])
  })

  test('normalizePanelSizes keeps provided controlled sizes and fills undefined sizes with remainder', () => {
    expect(
      normalizePanelSizes({
        panelCount: 3,
        panelInitialSizes: [undefined, undefined, undefined],
        panelMinSizes: [0, 0, 0],
        panelMaxSizes: [1, 1, 1],
        controlledSizes: [0.2, undefined, undefined],
      }),
    ).toEqual([0.2, 0.4, 0.4])
  })

  test('normalizePanelSizes falls back undefined controlled sizes to zero when provided sum exceeds one', () => {
    expect(
      normalizePanelSizes({
        panelCount: 3,
        panelInitialSizes: [undefined, undefined, undefined],
        panelMinSizes: [0, 0, 0],
        panelMaxSizes: [1, 1, 1],
        controlledSizes: [0.8, 0.6, undefined],
      }),
    ).toEqual([0.571429, 0.428571, 0])
  })

  test('normalizePanelSizes prefers defaultSize for uncontrolled items in mixed controlled mode', () => {
    expect(
      normalizePanelSizes({
        panelCount: 3,
        panelInitialSizes: [0.3, 0.4, undefined],
        panelMinSizes: [0, 0, 0],
        panelMaxSizes: [1, 1, 1],
        controlledSizes: [0.2, undefined, undefined],
      }),
    ).toEqual([0.2, 0.4, 0.4])
  })

  test('normalizePanelSizes clamps mixed controlled/default sizes by min and max', () => {
    expect(
      normalizePanelSizes({
        panelCount: 3,
        panelInitialSizes: [0.3, 0.4, undefined],
        panelMinSizes: [0.1, 0.3, 0.2],
        panelMaxSizes: [0.5, 0.45, 0.35],
        controlledSizes: [0.9, undefined, undefined],
      }),
    ).toEqual([0.5, 0.3, 0.2])
  })
})
