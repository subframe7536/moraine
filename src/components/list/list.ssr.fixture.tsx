import { renderToString } from 'solid-js/web'

import { scrollViewport } from '../../test-util/virtualizer-layout'
import { createListVirtualizer } from '../../virtualizer'

import { List } from './list'

export function ListHydrationFixture(props: { items?: string[] }) {
  return (
    <List
      items={props.items ?? ['Alpha', 'Beta']}
      itemRender={(context) => (
        <li data-value={context.item}>
          {context.index}: {context.item}
        </li>
      )}
    />
  )
}

export function VirtualListHydrationFixture() {
  const virtualizer = createListVirtualizer<string>({
    estimateSize: () => 32,
    ...scrollViewport(200, 96),
  })
  return (
    <List
      as="div"
      items={['Alpha', 'Beta']}
      virtualizer={virtualizer}
      itemRender={(context) => (
        <div {...context.props} role="listitem">
          {context.item}
        </div>
      )}
    />
  )
}

export function renderListFixture(): string {
  return renderToString(() => <ListHydrationFixture />)
}

export function renderVirtualListFixture(): string {
  return renderToString(() => <VirtualListHydrationFixture />)
}
