import { renderToString, Dynamic } from 'solid-js/web'

import { Tabs } from './tabs'

const ITEMS = [
  { label: 0, value: '', content: <span data-testid="empty-panel">Empty panel</span> },
  { label: 'Other', value: 'other', content: <span data-testid="other-panel">Other panel</span> },
]

export function renderLazyTabsFixture(): string {
  return renderToString(() => (
    <Tabs
      id="lazy-tabs"
      items={[
        {
          label: 'First',
          value: 'first',
          get content() {
            return <Dynamic component="p">First lazy panel</Dynamic>
          },
        },
        {
          label: 'Second',
          value: 'second',
          get content() {
            return <Dynamic component="p">Second lazy panel</Dynamic>
          },
        },
      ]}
    />
  ))
}

export function renderTabsFixture(): string {
  return renderToString(() => <Tabs id="ssr-tabs" defaultValue="" items={ITEMS} />)
}

export function renderVerticalTabsFixture(): string {
  return renderToString(() => (
    <Tabs id="ssr-vertical-tabs" orientation="vertical" defaultValue="other" items={ITEMS} />
  ))
}
