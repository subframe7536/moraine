import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { BoldSlider } from './bold-slider'

describe('BoldSlider SSR hydration', () => {
  test('hydrates the label, value, and indicator copies without replacing server nodes', () => {
    const { container } = hydrateFixture(
      '/src/components/bold-slider/bold-slider.ssr.fixture.tsx',
      'renderBoldSliderFixture',
      () => (
        <div>
          <BoldSlider id="ssr-bold-slider" label="Bounce" defaultValue={0.5} max={1} step={0.1} />
        </div>
      ),
    )

    const root = container.querySelector<HTMLElement>('#ssr-bold-slider-root')!
    const thumb = root.querySelector<HTMLElement>('[data-slot="slider-thumb"]')!
    const values = Array.from(root.querySelectorAll('[data-slot="bold-slider-value"]'))

    expect(thumb.getAttribute('aria-valuenow')).toBe('0.5')
    expect(root.querySelectorAll('[data-slot="bold-slider-label"]')).toHaveLength(2)
    expect(root.querySelectorAll('[data-slot="bold-slider-indicator"]')).toHaveLength(2)
    expect(values.map((value) => value.textContent)).toEqual(['0.5', '0.5'])

    fireEvent.keyDown(thumb, { key: 'ArrowRight' })

    expect(thumb.getAttribute('aria-valuenow')).toBe('0.6')
    expect(values.map((value) => value.textContent)).toEqual(['0.6', '0.6'])
    expect(values.every((value) => root.contains(value))).toBe(true)
  })
})
