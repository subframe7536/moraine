import { renderToString } from '@solidjs/web'
import { createComponent } from 'solid-js'

import { DropdownMenu } from './dropdown-menu'
export function renderDropdownMenuFixture(): string {
  return renderToString(() => (
    <DropdownMenu id="ssr-dropdown">
      {createComponent(DropdownMenu.Trigger<'button'>, {
        as: 'button',
        type: 'button',
        children: 'Actions',
      })}
      <DropdownMenu.Content items={[{ label: 'Archive' }, { label: 'Delete' }]} />
    </DropdownMenu>
  ))
}
