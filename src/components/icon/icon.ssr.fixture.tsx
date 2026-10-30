import { Show } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { Icon } from './icon'

function Glyph() {
  return (
    <svg data-testid="component-icon">
      <path d="M0 0h1" />
    </svg>
  )
}

export function IconHydrationFixture(props: { label?: string; visible?: boolean }) {
  return (
    <>
      <Icon name="i-lucide-check" />
      <Show when={props.visible ?? true}>
        <Icon
          name={
            <svg data-testid="jsx-icon">
              <path d="M0 0h1" />
            </svg>
          }
        />
      </Show>
      <Icon name={Glyph} aria-label={props.label ?? 'Status'} />
    </>
  )
}

export function renderIconFixture(): string {
  return renderToString(() => <IconHydrationFixture />)
}
