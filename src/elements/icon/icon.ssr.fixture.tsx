import { Show } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { Icon } from './icon.tsx'
import type { IconProps } from './icon.types.ts'

function Glyph(props: Omit<IconProps, 'name'>) {
  return (
    <svg aria-label={props['aria-label']} data-testid="component-icon">
      <title>{props['aria-label']}</title>
    </svg>
  )
}

export function IconHydrationFixture(props: { label?: string; visible?: boolean }) {
  return (
    <>
      <Icon name="i-lucide-check" />
      <Icon
        name={
          <Show when={props.visible ?? true}>
            <svg data-testid="jsx-icon">
              <path d="M0 0h1" />
            </svg>
          </Show>
        }
      />
      <Icon name={Glyph} aria-label={props.label ?? 'Status'} />
    </>
  )
}

export function renderIconFixture(): string {
  return renderToString(() => <IconHydrationFixture />)
}
