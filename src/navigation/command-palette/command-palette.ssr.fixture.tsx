import { renderToString } from 'solid-js/web'

import { CommandPalette } from './command-palette.tsx'

export function renderCommandPaletteFixture(): string {
  return renderToString(() => (
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
  ))
}
