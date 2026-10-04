import { Show } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { Empty } from './empty'
import type { EmptyT } from './empty.types'

export function EmptyHydrationFixture(props: {
  size?: EmptyT.Variant['size']
  title?: string
  optional?: boolean
}) {
  return (
    <Empty size={props.size ?? 'sm'}>
      <Show when={props.optional ?? true}>
        <Empty.Media>
          <span>Media</span>
        </Empty.Media>
      </Show>
      <Empty.Title>
        <span>{props.title ?? 'No projects'}</span>
      </Empty.Title>
      <Empty.Description>Create a project to get started.</Empty.Description>
      <Show when={props.optional ?? true}>
        <Empty.Actions>
          <button>Create project</button>
        </Empty.Actions>
      </Show>
    </Empty>
  )
}

export function renderEmptyFixture(): string {
  return renderToString(() => <EmptyHydrationFixture />)
}

export function renderMinimalEmptyFixture(): string {
  return renderToString(() => <EmptyHydrationFixture optional={false} />)
}
