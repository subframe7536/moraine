import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Slider } from './slider.tsx'

function getThumbs(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-slot="thumb"]'))
}

describe('Slider SSR Hydration', () => {
  test('hydrates normalized scalar and range thumbs without replacing server nodes', () => {
    const { container } = hydrateFixture(
      '/src/forms/slider/slider.ssr.fixture.tsx',
      'renderSliderFixture',
      () => (
        <div>
          <Slider id="ssr-scalar-slider" defaultValue={25} />
          <Slider id="ssr-range-slider" defaultValue={[75, 25]} orientation="vertical" />
        </div>
      ),
    )

    const serverScalarRoot = container.querySelector<HTMLElement>('#ssr-scalar-slider-root')!
    const serverRangeRoot = container.querySelector<HTMLElement>('#ssr-range-slider-root')!

    expect(serverScalarRoot).not.toBeNull()
    expect(serverRangeRoot).not.toBeNull()

    const scalarThumbs = getThumbs(serverScalarRoot)
    const rangeThumbs = getThumbs(serverRangeRoot)

    expect(scalarThumbs[0]?.getAttribute('aria-valuenow')).toBe('25')
    expect(serverScalarRoot.querySelectorAll('input[type="range"]')).toHaveLength(1)
    expect(rangeThumbs.map((thumb) => thumb.getAttribute('aria-valuenow'))).toEqual(['25', '75'])
    expect(serverRangeRoot.querySelectorAll('input[type="range"]')).toHaveLength(2)
  })
})
