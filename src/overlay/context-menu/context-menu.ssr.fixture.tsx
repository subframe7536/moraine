import { renderToString } from 'solid-js/web'

import { ContextMenu } from './context-menu'

export function renderContextMenuFixture(): string {
  return renderToString(() => (
    <ContextMenu id="ssr-context">
      <ContextMenu.Trigger as="div">Row Item</ContextMenu.Trigger>
      <ContextMenu.Content items={[{ label: 'Archive' }, { label: 'Delete' }]} />
    </ContextMenu>
  ))
}
