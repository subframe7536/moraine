import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
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
  const design = useMoraineDesign()
  const kbdGroupDesign = () => design().kbdGroup

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

  const size = () => local.size ?? kbdGroupDesign()?.defaultVariants?.size ?? 'md'
  const variant = () => local.variant ?? kbdGroupDesign()?.defaultVariants?.variant ?? 'default'

  const groups = createMemo(() =>
    (local.sequence ?? (local.items ? [local.items] : [])).filter((items) => items.length > 0),
  )

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return kbdGroupDesign()?.recipe({ size: size() })
      },
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  return (
    <Show when={groups().length > 0}>
      <span data-slot="root" {...rest} {...resolved.rootClassAndStyle()}>
        <For each={groups()}>
          {(items, groupIndex) => (
            <>
              <Show when={groupIndex() > 0}>
                <span
                  data-slot="sequenceDivider"
                  {...resolved.slotClassAndStyle('sequenceDivider')}
                >
                  {resolveDivider(local.sequenceDividerRender, { index: groupIndex() - 1 }, 'then')}
                </span>
              </Show>
              <span data-slot="chord" {...resolved.slotClassAndStyle('chord')}>
                <For each={items}>
                  {(item, index) => (
                    <>
                      <Kbd
                        {...toItemProps(item)}
                        size={size()}
                        variant={variant()}
                        {...resolved.slotClassAndStyle('item')}
                        slotName="item"
                      />
                      <Show when={index() < items.length - 1}>
                        <span data-slot="divider" {...resolved.slotClassAndStyle('divider')}>
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
