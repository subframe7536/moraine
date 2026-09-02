import { renderToString } from 'solid-js/web'

import { Collapsible } from './collapsible'

export function renderCollapsibleFixture(): string {
  return renderToString(() => (
    <Collapsible>
      <Collapsible.Trigger>Details</Collapsible.Trigger>
      <Collapsible.Content>
        <span data-testid="hydrated-content">Content</span>
      </Collapsible.Content>
    </Collapsible>
  ))
}
