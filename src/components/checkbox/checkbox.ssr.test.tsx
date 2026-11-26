import { createSignal, flush } from 'solid-js'
import { describe, expect, it } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { Checkbox } from './checkbox'
describe('checkbox SSR Hydration', () => {
  it('hydrates indeterminate content and preserves branch order through state updates', () => {
    const [checked, setChecked] = createSignal<boolean | 'indeterminate'>('indeterminate')

    const { container } = hydrateFixture(
      '/src/components/checkbox/checkbox.ssr.fixture.tsx',
      'renderCheckboxFixture',
      () => (
        <Checkbox
          checked={checked()}
          label="Server label"
          description="Server description"
          checkedIcon={<span data-testid="checked-icon">Checked</span>}
          indeterminateIcon={<span data-testid="mixed-icon">Mixed</span>}
        />
      ),
    )

    const root = container.querySelector('[data-slot="checkbox"]')!
    const control = container.querySelector('[data-slot="checkbox-control"]')!

    expect(root).not.toBeNull()
    expect(control.getAttribute('aria-checked')).toBe('mixed')
    expect(container.querySelector('[data-testid="mixed-icon"]')?.textContent).toBe('Mixed')

    flush(() => setChecked(true))
    expect(control.getAttribute('aria-checked')).toBe('true')
    expect(container.querySelector('[data-testid="checked-icon"]')?.textContent).toBe('Checked')

    flush(() => setChecked(false))
    expect(control.getAttribute('aria-checked')).toBe('false')
    expect(container.querySelector('[data-slot="checkbox-indicator"]')).toBeNull()
    expect(Array.from(root.children).map((child) => child.getAttribute('data-slot'))).toEqual([
      'checkbox-container',
      'checkbox-wrapper',
    ])
  })
})
