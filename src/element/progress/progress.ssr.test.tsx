import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { Progress } from './progress'

describe('Progress SSR Hydration', () => {
  test('hydrates stable slot order through determinate, indeterminate, and complete states', () => {
    const [value, setValue] = createSignal<number | null>(50)

    const { container } = hydrateFixture(
      '/src/element/progress/progress.ssr.fixture.tsx',
      'renderProgressFixture',
      () => (
        <Progress
          value={value()}
          label="Upload"
          valueRender={(context) => <span>{context.percent}%</span>}
        />
      ),
    )

    const root = container.querySelector('[data-slot="progress"]')!
    expect(root).not.toBeNull()
    expect(Array.from(root.children).map((child) => child.getAttribute('data-slot'))).toEqual([
      'progress-label',
      'progress-value',
      'progress-track',
    ])
    expect(root.getAttribute('data-progress')).toBe('loading')
    expect((root as HTMLElement).style.getPropertyValue('--p-value')).toBe('0.5')
    expect(
      (container.querySelector('[data-slot="progress-indicator"]') as HTMLElement).style.transform,
    ).toBe('')

    setValue(null)
    expect(root.hasAttribute('data-indeterminate')).toBe(true)
    expect((root as HTMLElement).style.getPropertyValue('--p-value')).toBe('')
    expect(container.querySelector('[data-slot="progress-label"]')?.textContent).toBe('Upload')
    expect(container.querySelector('[data-slot="progress-value"]')).toBeNull()
    expect(container.querySelectorAll('[data-indeterminate]').length).toBeGreaterThan(1)

    setValue(100)
    expect(root.getAttribute('data-progress')).toBe('complete')
    expect(container.querySelector('[data-slot="progress-value"]')?.textContent).toBe('100%')
    for (const part of container.querySelectorAll('[data-slot]')) {
      expect(part.hasAttribute('data-indeterminate')).toBe(false)
    }
  })
})
