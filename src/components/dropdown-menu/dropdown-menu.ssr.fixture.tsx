import { renderToString } from '@solidjs/web'

import { DropdownMenu } from './dropdown-menu'
export function renderDropdownMenuFixture(): string {
  return renderToString(() => (
    <DropdownMenu id="ssr-dropdown">
      <DropdownMenu.Trigger as="button" type="button">
        Actions
      </DropdownMenu.Trigger>
      <DropdownMenu.Content items={[{ label: 'Archive' }, { label: 'Delete' }]} />
    </DropdownMenu>
  ))
}
