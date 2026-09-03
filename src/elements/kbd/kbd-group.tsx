import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn } from '../../shared/utils.ts'

import type { KbdGroupVariantProps } from './kbd.class.ts'
import { kbdGroupRecipe } from './kbd.class.ts'
import { Kbd } from './kbd.tsx'
import type { KbdT } from './kbd.tsx'

export namespace KbdGroupT {
  export interface Slot<T = unknown> {
    /** Container for one or more shortcut steps. */
    root?: T

    /** Wrapper around keys pressed at the same time. */
    chord?: T

    /** Individual key token. */
    item?: T

    /** Divider between keys pressed at the same time. */
    divider?: T

    /** Divider between shortcut steps pressed in sequence. */
    sequenceDivider?: T
  }
  export type Variant = KbdGroupVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Item = KbdT.Key | KbdT.Base
  export interface DividerRenderProps {
    /** Zero-based divider index in the current collection. */
    index: number
  }

  /** Base props for the KbdGroup component. */
  export interface Base {
    /** Keys pressed at the same time, such as Ctrl+K. */
    items?: Item[]

    /** Key groups pressed one after another, such as Ctrl+K then Ctrl+S. */
    sequence?: Item[][]

    /** Custom divider rendered between keys in the same group. */
    dividerRender?: ComponentOrElement<DividerRenderProps>

    /** Custom divider rendered between shortcut steps. */
    sequenceDividerRender?: ComponentOrElement<DividerRenderProps>
  }

  /** Props for the KbdGroup component. */
  export type Props = BaseProps<'span', Base, Variant, Classes, Styles>
}

/** Props for the KbdGroup component. */
export interface KbdGroupProps extends KbdGroupT.Props {}

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
  const config = useMoraineConfig()
  const provider = () => config().kbdGroup

  const [local, rest] = splitProps(props, [
    'items',
    'sequence',
    'dividerRender',
    'sequenceDividerRender',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const size = () =>
    (local.size ?? provider()?.defaultProps?.size ?? 'md') as NonNullable<
      KbdGroupVariantProps['size']
    >
  const variant = () =>
    (props.variant ?? provider()?.defaultProps?.variant ?? 'default') as NonNullable<
      KbdGroupVariantProps['variant']
    >

  const groups = createMemo(() =>
    (local.sequence ?? (local.items ? [local.items] : [])).filter((items) => items.length > 0),
  )

  const slots = createMemo(() => kbdGroupRecipe({ size: size() }))

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
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
      <span data-slot="root" {...rest} class={resolved.rootClass()} style={resolved.rootStyle()}>
        <For each={groups()}>
          {(items, groupIndex) => (
            <>
              <Show when={groupIndex() > 0}>
                <span
                  data-slot="sequenceDivider"
                  class={cn('text-muted-foreground', resolved.slotClass('sequenceDivider'))}
                  style={resolved.slotStyle('sequenceDivider')}
                >
                  {resolveDivider(local.sequenceDividerRender, { index: groupIndex() - 1 }, 'then')}
                </span>
              </Show>
              <span
                data-slot="chord"
                class={cn('inline-flex gap-1 items-center', resolved.slotClass('chord'))}
                style={resolved.slotStyle('chord')}
              >
                <For each={items}>
                  {(item, index) => (
                    <>
                      <Kbd
                        {...toItemProps(item)}
                        size={size()}
                        variant={variant()}
                        class={resolved.slotClass('item')}
                        style={resolved.slotStyle('item')}
                        slotName="item"
                      />
                      <Show when={index() < items.length - 1}>
                        <span
                          data-slot="divider"
                          class={cn('text-muted-foreground', resolved.slotClass('divider'))}
                          style={resolved.slotStyle('divider')}
                        >
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
