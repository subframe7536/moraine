import { Show } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { Card } from './card.tsx'

export function CardHydrationFixture(props: { title?: string; body?: boolean }) {
  return (
    <Card
      title={<span>{props.title ?? 'Title'}</span>}
      description={<span>Description</span>}
      action={<button>Edit</button>}
      footer={<span>Footer</span>}
    >
      <Show when={props.body ?? true}>
        <p>Body</p>
      </Show>
    </Card>
  )
}

export function renderCardFixture(): string {
  return renderToString(() => <CardHydrationFixture />)
}

export function renderEmptyCardFixture(): string {
  return renderToString(() => <CardHydrationFixture body={false} />)
}
