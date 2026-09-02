import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { Progress } from './progress'

describe('Progress SSR Hydration', () => {
  test('hydrates stable slot order through determinate, indeterminate, and complete states', () => {
    const steps = ['Waiting', 'Working', 'Done']
    const [value, setValue] = createSignal<number | null>(1)

    const { container } = hydrateFixture(
      '/src/elements/progress/progress.ssr.fixture.tsx',
      'renderProgressFixture',
      () => (
        <Progress
          value={value()}
          max={steps}
          statusRender={(context) => <span>{context.percent}%</span>}
          stepRender={(context) => <span>{context.step}</span>}
        />
      ),
    )

    const root = container.querySelector('[data-slot="root"]')!
    expect(root).not.toBeNull()
    expect(Array.from(root.children).map((child) => child.getAttribute('data-slot'))).toEqual([
      'status',
      'track',
      'steps',
    ])
    expect(root.getAttribute('data-progress')).toBe('loading')

    setValue(null)
    expect(root.hasAttribute('data-indeterminate')).toBe(true)
    expect(container.querySelector('[data-slot="status"]')).toBeNull()
    expect(container.querySelectorAll('[data-indeterminate]').length).toBeGreaterThan(1)

    setValue(2)
    expect(root.getAttribute('data-progress')).toBe('complete')
    expect(container.querySelector('[data-slot="status"]')?.textContent).toBe('100%')
    for (const part of container.querySelectorAll('[data-slot]')) {
      expect(part.hasAttribute('data-indeterminate')).toBe(false)
    }
  })
})
