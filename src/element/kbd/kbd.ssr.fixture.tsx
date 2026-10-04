import { renderToString } from 'solid-js/web'

import { KbdGroup } from '../kbd-group/kbd-group'
import type { KbdGroupT } from '../kbd-group/kbd-group.types'

import { Kbd } from './kbd'

function KbdSeparator(props: KbdGroupT.SeparatorRenderProps) {
  return (
    <span data-slot="kbd-group-separator" data-index={props.index}>
      /
    </span>
  )
}

export function KbdHydrationFixture(props: {
  keyName?: string
  items?: KbdGroupT.Item[]
  separator?: KbdGroupT.Base['separator']
}) {
  return (
    <>
      <Kbd value={props.keyName ?? 'escape'} />
      <KbdGroup
        items={props.items ?? ['ctrl', 'k']}
        separator={props.separator ?? KbdSeparator}
        size="sm"
      />
    </>
  )
}

export function renderKbdFixture(): string {
  return renderToString(() => <KbdHydrationFixture />)
}
