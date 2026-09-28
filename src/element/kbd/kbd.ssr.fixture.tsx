import { renderToString } from 'solid-js/web'

import { Kbd } from './kbd'
import { KbdGroup } from './kbd-group'
import type { KbdGroupT } from './kbd-group.types'

export function KbdHydrationFixture(props: { keyName?: string; items?: KbdGroupT.Item[] }) {
  return (
    <>
      <Kbd value={props.keyName ?? 'escape'} />
      <KbdGroup items={props.items ?? ['ctrl', 'k']} separator="/" size="sm" />
    </>
  )
}

export function renderKbdFixture(): string {
  return renderToString(() => <KbdHydrationFixture />)
}
