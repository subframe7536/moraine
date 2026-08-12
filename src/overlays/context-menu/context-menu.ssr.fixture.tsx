import { renderToString } from 'solid-js/web'

import { ContextMenu } from './context-menu.tsx'

export function renderContextMenuFixture(): string {
  return renderToString(() => (
    <ContextMenu id="ssr-context" items={[{ label: 'Archive' }, { label: 'Delete' }]}>
      {(props) => <div {...props}>Row Item</div>}
    </ContextMenu>
  ))
}
