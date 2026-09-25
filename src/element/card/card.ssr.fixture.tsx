import { Show } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { Card } from './card.tsx'

export function CardHydrationFixture(props: { title?: string; body?: boolean }) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>
          <span>{props.title ?? 'Title'}</span>
        </Card.Title>
        <Card.Description>Description</Card.Description>
        <Card.Action>
          <button>Edit</button>
        </Card.Action>
      </Card.Header>
      <Show when={props.body ?? true}>
        <Card.Body>
          <p>Body</p>
        </Card.Body>
      </Show>
      <Card.Footer>Footer</Card.Footer>
    </Card>
  )
}

export function renderCardFixture(): string {
  return renderToString(() => <CardHydrationFixture />)
}

export function renderEmptyCardFixture(): string {
  return renderToString(() => <CardHydrationFixture body={false} />)
}
