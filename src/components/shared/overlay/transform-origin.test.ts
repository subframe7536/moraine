import { describe, expect, test } from 'vitest'

import { getTransformOrigin } from './transform-origin'

describe('getTransformOrigin', () => {
  const geometry = {
    gutter: 8,
    reference: { height: 20, width: 50, x: 100, y: 20 },
    x: 100,
    y: 48,
  }

  test('uses the aligned edge until collision shift breaks it', () => {
    expect(getTransformOrigin('bottom-start', 'ltr', geometry)).toBe('0% -8px')
    expect(getTransformOrigin('bottom-start', 'rtl', geometry)).toBe('100% -8px')
    expect(getTransformOrigin('bottom-start', 'ltr', { ...geometry, shift: { x: 2 } })).toBe(
      '25px -8px',
    )
  })

  test('uses the anchor center on the side axis when overlap shifts the popup', () => {
    expect(
      getTransformOrigin('bottom', 'ltr', {
        ...geometry,
        overlap: true,
        shift: { y: 12 },
      }),
    ).toBe('25px -18px')
    expect(getTransformOrigin('right-end', 'ltr', geometry)).toBe('-8px 100%')
  })
})
