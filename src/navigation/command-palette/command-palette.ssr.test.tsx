import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

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

    const label = container.querySelector('[data-slot="itemLabel"]')
    const description = container.querySelector('[data-slot="itemDescription"]')

    expect(description?.parentElement).toBe(label)
    expect(label?.hasAttribute('data-description-position')).toBe(false)
  })
})
