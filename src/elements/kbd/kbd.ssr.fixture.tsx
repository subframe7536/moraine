import { renderToString } from 'solid-js/web'

import { KbdGroup } from './kbd-group.tsx'
import type { KbdGroupT } from './kbd-group.types.ts'
import { Kbd } from './kbd.tsx'

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
