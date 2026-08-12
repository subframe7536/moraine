import { renderToString } from 'solid-js/web'

import { DropdownMenu } from './dropdown-menu.tsx'

export function renderDropdownMenuFixture(): string {
  return renderToString(() => (
    <DropdownMenu id="ssr-dropdown" items={[{ label: 'Archive' }, { label: 'Delete' }]}>
      {(props) => (
        <button {...props} type="button">
          Actions
        </button>
      )}
    </DropdownMenu>
  ))
}
