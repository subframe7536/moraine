import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { CommandPalette } from './command-palette'

describe('CommandPalette SSR Hydration', () => {
  test('hydrates trailing descriptions under their labels', () => {
    const { container } = hydrateFixture(
      '/src/navigation/command-palette/command-palette.ssr.fixture.tsx',
      'renderCommandPaletteFixture',
      () => (
        <CommandPalette
          autofocus={false}
          descriptionPosition="trailing"
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

    expect(description?.parentElement).toBe(label)
    expect(label?.hasAttribute('data-description-position')).toBe(false)
  })
})
