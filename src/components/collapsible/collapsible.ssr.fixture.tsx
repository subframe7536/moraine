import { renderToString } from '@solidjs/web'

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

export function renderOpenCollapsibleFixture(): string {
  return renderToString(() => (
    <Collapsible defaultOpen transition forceMount>
      <Collapsible.Trigger>Details</Collapsible.Trigger>
      <Collapsible.Content as="section">Content</Collapsible.Content>
    </Collapsible>
  ))
}
