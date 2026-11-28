import { renderToString } from '@solidjs/web'

import { ScrollArea } from './scroll-area'
export function renderScrollAreaFixture(): string {
  return renderToString(() => (
    <ScrollArea fade orientation="both" scrollbarMode="always" aria-label="Activity">
      <span>Server content</span>
    </ScrollArea>
  ))
}
