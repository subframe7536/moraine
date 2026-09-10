import { renderToString } from 'solid-js/web'

import { useListVirtualizer } from '../../virtualizer.ts'

import { List } from './list.tsx'

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
  const virtualizer = useListVirtualizer<string>({
    estimateSize: () => 32,
    observeElementRect: (_instance, callback) => {
      callback({ width: 200, height: 96 })
      return () => {}
    },
  })
  return (
    <List
      as="div"
      items={['Alpha', 'Beta']}
      virtualRender={virtualizer.virtualRender}
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
