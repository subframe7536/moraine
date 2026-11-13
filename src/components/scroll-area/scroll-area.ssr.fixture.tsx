import { renderToString } from 'solid-js/web'

import { ScrollArea } from './scroll-area'

export function renderScrollAreaFixture(): string {
  return renderToString(() => (
    <ScrollArea shadow orientation="both" aria-label="Activity">
      <span>Server content</span>
    </ScrollArea>
  ))
}
