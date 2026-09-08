import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'

import type { KbdGroupProps, KbdGroupT } from './kbd-group.types.ts'
import { Kbd } from './kbd.tsx'
import type { KbdT } from './kbd.types.ts'

export * from './kbd-group.types.ts'

function resolveDivider(
  dividerRender: ComponentOrElement<KbdGroupT.DividerRenderProps>,
  props: KbdGroupT.DividerRenderProps,
  fallback: JSX.Element,
): JSX.Element {
  return (
    <Show when={dividerRender !== undefined} fallback={fallback}>
      {renderComponentOrElement(dividerRender, props)}
    </Show>
  )
}

function toItemProps(item: KbdGroupT.Item): KbdT.Base {
  return typeof item === 'string' ? { value: item } : item
}

/** Group of keyboard shortcut keys with support for simultaneous chords and ordered sequences. */
export function KbdGroup(props: KbdGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'sequence',
    'dividerRender',
    'sequenceDividerRender',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createComponentStyles('kbdGroup', local)

  const size = () => resolved.variants.size
  const variant = () => resolved.variants.variant

  const groups = createMemo(() =>
    (local.sequence ?? (local.items ? [local.items] : [])).filter((items) => items.length > 0),
  )

  return (
    <Show when={groups().length > 0}>
      <span data-slot="root" {...rest} {...resolved.root}>
        <For each={groups()}>
          {(items, groupIndex) => (
            <>
              <Show when={groupIndex() > 0}>
                <span data-slot="sequenceDivider" {...resolved.slot('sequenceDivider')}>
                  {resolveDivider(local.sequenceDividerRender, { index: groupIndex() - 1 }, 'then')}
                </span>
              </Show>
              <span data-slot="chord" {...resolved.slot('chord')}>
                <For each={items}>
                  {(item, index) => (
                    <>
                      <Kbd
                        {...toItemProps(item)}
                        size={size()}
                        variant={variant()}
                        {...resolved.slot('item')}
                        slotName="item"
                      />
                      <Show when={index() < items.length - 1}>
                        <span data-slot="divider" {...resolved.slot('divider')}>
                          {resolveDivider(local.dividerRender, { index: index() }, '+')}
                        </span>
                      </Show>
                    </>
                  )}
                </For>
              </span>
            </>
          )}
        </For>
      </span>
    </Show>
  )
}
