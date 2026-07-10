import type { JSX } from 'solid-js'
import { For, Show, createMemo } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn } from '../../shared/utils'

import { Kbd } from './kbd'
import type { KbdT } from './kbd'
import type { KbdGroupVariantProps } from './kbd.class'
import { kbdGroupVariants } from './kbd.class'

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
  export interface DividerRenderContext {
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
    dividerRender?: (ctx: DividerRenderContext) => JSX.Element

    /** Custom divider rendered between shortcut steps. */
    sequenceDividerRender?: (ctx: DividerRenderContext) => JSX.Element
  }

  /** Props for the KbdGroup component. */
  export interface Props extends BaseProps<Base, Variant, Slot> {}
}

/** Props for the KbdGroup component. */
export interface KbdGroupProps extends KbdGroupT.Props {}

function resolveDivider(
  dividerRender: ((ctx: KbdGroupT.DividerRenderContext) => JSX.Element) | undefined,
  ctx: KbdGroupT.DividerRenderContext,
  fallback: JSX.Element,
): JSX.Element {
  return dividerRender?.(ctx) ?? fallback
}

function toItemProps(item: KbdGroupT.Item): KbdT.Base {
  return typeof item === 'string' ? { value: item } : item
}

/** Group of keyboard shortcut keys with support for simultaneous chords and ordered sequences. */
export function KbdGroup(props: KbdGroupProps): JSX.Element {
  const groups = createMemo(() =>
    (props.sequence ?? (props.items ? [props.items] : [])).filter((items) => items.length > 0),
  )

  return (
    <Show when={groups().length > 0}>
      <span
        data-slot="root"
        class={kbdGroupVariants({ size: props.size }, props.classes?.root, props.class)}
        style={{ ...props.styles?.root, ...props.style }}
      >
        <For each={groups()}>
          {(items, groupIndex) => (
            <>
              <Show when={groupIndex() > 0}>
                <span
                  data-slot="sequenceDivider"
                  class={cn('text-muted-foreground', props.classes?.sequenceDivider)}
                  style={props.styles?.sequenceDivider}
                >
                  {resolveDivider(props.sequenceDividerRender, { index: groupIndex() - 1 }, 'then')}
                </span>
              </Show>
              <span
                data-slot="chord"
                class={cn('inline-flex gap-1 items-center', props.classes?.chord)}
                style={props.styles?.chord}
              >
                <For each={items}>
                  {(item, index) => (
                    <>
                      <Kbd
                        {...toItemProps(item)}
                        size={props.size}
                        variant={props.variant}
                        class={props.classes?.item}
                        style={props.styles?.item}
                        slotName="item"
                      />
                      <Show when={index() < items.length - 1}>
                        <span
                          data-slot="divider"
                          class={cn('text-muted-foreground', props.classes?.divider)}
                          style={props.styles?.divider}
                        >
                          {resolveDivider(props.dividerRender, { index: index() }, '+')}
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
