import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { CommandPalette } from './command-palette'

describe('CommandPalette SSR Hydration', () => {
  test('hydrates an empty listbox with a valid combobox relationship', () => {
    const { container } = hydrateFixture(
      '/src/navigation/command-palette/command-palette.ssr.fixture.tsx',
      'renderEmptyCommandPaletteFixture',
      () => <CommandPalette autofocus={false} groups={[]} />,
    )
    const input = container.querySelector('[role="combobox"]')
    const listbox = container.querySelector('[role="listbox"]')
    expect(input?.getAttribute('aria-controls')).toBe(listbox?.id)
    expect(listbox?.querySelector('[data-slot="command-palette-empty"]')).not.toBeNull()
  })

  test('hydrates trailing descriptions and updates their placement without replacing the item', () => {
    const [position, setPosition] = createSignal<'trailing' | 'bottom'>('trailing')
    const { container } = hydrateFixture(
      '/src/navigation/command-palette/command-palette.ssr.fixture.tsx',
      'renderCommandPaletteFixture',
      () => (
        <CommandPalette
          autofocus={false}
          descriptionPosition={position()}
          groups={[
            {
              id: 'actions',
              items: [{ value: 'archive', label: 'Archive', description: 'Move to archive' }],
            },
          ]}
        />
      ),
    )

    const label = container.querySelector('[data-slot="command-palette-item-label"]')
    const description = container.querySelector('[data-slot="command-palette-item-description"]')
    const item = container.querySelector('[data-slot="command-palette-item"]')
    const wrapper = container.querySelector('[data-slot="command-palette-item-wrapper"]')

    expect(description?.parentElement).toBe(label)
    expect(label?.hasAttribute('data-description-position')).toBe(false)

    setPosition('bottom')
    const bottomDescription = container.querySelector(
      '[data-slot="command-palette-item-description"]',
    )
    expect(bottomDescription?.parentElement).toBe(wrapper)
    expect(bottomDescription?.textContent).toBe('Move to archive')
    expect(container.querySelector('[data-slot="command-palette-item"]')).toBe(item)
  })
})
