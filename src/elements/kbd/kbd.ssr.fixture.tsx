import { renderToString } from 'solid-js/web'

import { KbdGroup } from './kbd-group.tsx'
import type { KbdGroupT } from './kbd-group.types.ts'
import { Kbd } from './kbd.tsx'

export function KbdHydrationFixture(props: { keyName?: string; sequence?: KbdGroupT.Item[][] }) {
  return (
    <>
      <Kbd value={props.keyName ?? 'escape'} />
      <KbdGroup
        sequence={props.sequence ?? [['ctrl', 'k'], ['enter']]}
        dividerRender={(context) => <span data-testid="chord-divider">Chord {context.index}</span>}
        sequenceDividerRender={(context) => (
          <span data-testid="sequence-divider">Step {context.index}</span>
        )}
      />
    </>
  )
}

export function renderKbdFixture(): string {
  return renderToString(() => <KbdHydrationFixture />)
}
