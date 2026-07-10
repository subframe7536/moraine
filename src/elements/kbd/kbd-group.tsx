import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'

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
  export type Item = KbdT.ItemInput
  export type Chord = readonly [Item, ...Item[]]
  export type Sequence = readonly [Chord, ...Chord[]]
  export type DividerContext = { index: number }
  export type SequenceDividerContext = { index: number }

  export interface Common {
    /** Divider rendered between keys in the same chord. */
    divider?: JSX.Element | ((ctx: DividerContext) => JSX.Element)

    /** Divider rendered between shortcut steps. */
    sequenceDivider?: JSX.Element | ((ctx: SequenceDividerContext) => JSX.Element)

    /** Prefix for data-slot attributes. */
    slotPrefix?: string
  }

  export interface ValueBase extends Common {
    /** Keys pressed at the same time, such as Ctrl+K. */
    value: Chord

    sequence?: never
  }

  export interface SequenceBase extends Common {
    /** Chords pressed one after another, such as Ctrl+K then Ctrl+S. */
    sequence: Sequence

    value?: never
  }

  /** Base props for the KbdGroup component. */
  export type Base = ValueBase | SequenceBase

  /** Props for the KbdGroup component. */
  export type Props = BaseProps<ValueBase, Variant, Slot> | BaseProps<SequenceBase, Variant, Slot>
}

/** Props for the KbdGroup component. */
export type KbdGroupProps = KbdGroupT.Props

function resolveDivider<T extends { index: number }>(
  divider: JSX.Element | ((ctx: T) => JSX.Element) | undefined,
  ctx: T,
  fallback: JSX.Element,
): JSX.Element {
  if (typeof divider === 'function') {
    return divider(ctx)
  }

  return divider ?? fallback
}

function toItemProps(item: KbdGroupT.Item): KbdT.Item {
  return typeof item === 'string' ? { value: item } : item
}

/** Group of keyboard shortcut keys with support for simultaneous chords and ordered sequences. */
export function KbdGroup(props: KbdGroupProps): JSX.Element {
  const chords = () => props.sequence ?? (props.value ? [props.value] : [])
  const slot = (name: string) => (props.slotPrefix ? `${props.slotPrefix}-${name}` : name)

  return (
    <Show when={chords().length > 0}>
      <span
        data-slot={slot('root')}
        class={kbdGroupVariants({ size: props.size }, props.classes?.root, props.class)}
        style={{ ...props.styles?.root, ...props.style }}
      >
        <For each={chords()}>
          {(chord, chordIndex) => (
            <>
              <Show when={chordIndex() > 0}>
                <span
                  data-slot={slot('sequence-divider')}
                  class={cn('text-muted-foreground', props.classes?.sequenceDivider)}
                  style={props.styles?.sequenceDivider}
                >
                  {resolveDivider(
                    props.sequenceDivider,
                    { index: chordIndex() - 1 },
                    <span>then</span>,
                  )}
                </span>
              </Show>
              <span
                data-slot={slot('chord')}
                class={cn('inline-flex gap-1 items-center', props.classes?.chord)}
                style={props.styles?.chord}
              >
                <For each={chord}>
                  {(item, index) => (
                    <>
                      <Kbd
                        {...toItemProps(item)}
                        size={props.size}
                        variant={props.variant}
                        class={props.classes?.item}
                        style={props.styles?.item}
                        slotPrefix={props.slotPrefix ? `${props.slotPrefix}-item` : undefined}
                      />
                      <Show when={index() < chord.length - 1}>
                        <span
                          data-slot={slot('divider')}
                          class={cn('text-muted-foreground', props.classes?.divider)}
                          style={props.styles?.divider}
                        >
                          {resolveDivider(props.divider, { index: index() }, <span>+</span>)}
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
