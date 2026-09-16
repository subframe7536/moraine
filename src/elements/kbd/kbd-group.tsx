import type { JSX } from 'solid-js'
import { For, Show, splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider'

import { Kbd } from './kbd'
import type { KbdGroupProps, KbdGroupT } from './kbd-group.types'
import type { KbdT } from './kbd.types'

function toItemProps(item: KbdGroupT.Item): KbdT.Base {
  return typeof item === 'string' ? { value: item } : item
}

/** Data-driven renderer for one simultaneous keyboard shortcut. */
export function KbdGroup(props: KbdGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'separator',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createComponentStyles('kbdGroup', local)

  return (
    <Show when={local.items.length > 0}>
      <kbd data-slot="root" {...rest} {...resolved.root}>
        <For each={local.items}>
          {(item, index) => (
            <>
              <Kbd
                {...toItemProps(item)}
                size={resolved.variants.size}
                variant={resolved.variants.variant}
                {...resolved.slot('item')}
                slotName="item"
              />
              <Show when={index() < local.items.length - 1}>{local.separator ?? '+'}</Show>
            </>
          )}
        </For>
      </kbd>
    </Show>
  )
}
