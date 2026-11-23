import { renderToString } from '@solidjs/web'

import { CommandPalette } from './command-palette'
export function renderCommandPaletteFixture(): string {
  return renderToString(() => (
    <CommandPalette
      autoFocus={false}
      descriptionPosition="trailing"
      items={[
        {
          type: 'group',
          children: [{ value: 'archive', label: 'Archive', description: 'Move to archive' }],
        },
      ]}
    />
  ))
}

export function renderEmptyCommandPaletteFixture(): string {
  return renderToString(() => <CommandPalette autoFocus={false} items={[]} />)
}
