import { renderToString } from 'solid-js/web'

import { Collapsible } from './collapsible.tsx'

export function renderCollapsibleFixture(): string {
  return renderToString(() => (
    <Collapsible triggerRender={<span>Details</span>}>
      <span data-testid="hydrated-content">Content</span>
    </Collapsible>
  ))
}
