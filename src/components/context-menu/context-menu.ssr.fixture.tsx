import { renderToString } from '@solidjs/web'
import { createComponent } from 'solid-js'

import { ContextMenu } from './context-menu'
export function renderContextMenuFixture(): string {
  return renderToString(() => (
    <ContextMenu id="ssr-context">
      {createComponent(ContextMenu.Trigger, {
        as: 'div',
        children: 'Row Item',
      })}
      <ContextMenu.Content items={[{ label: 'Archive' }, { label: 'Delete' }]} />
    </ContextMenu>
  ))
}
