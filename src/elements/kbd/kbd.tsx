import type { JSX } from 'solid-js'
import { For, Match, Show, Switch } from 'solid-js'

import type { SlotClasses, SlotStyles } from '../../shared/slot'
import { cn } from '../../shared/utils'

import type { KbdVariantProps } from './kbd.class'
import { kbdItemVariants } from './kbd.class'

type KbdSlots = 'root' | 'item'

export type KbdClasses = SlotClasses<KbdSlots>

export type KbdStyles = SlotStyles<KbdSlots>

/**
 * Base props for the Kbd component.
 */
export interface KbdBaseProps {
  /**
   * Slot-based class overrides.
   */
  classes?: KbdClasses

  /**
   * Slot-based style overrides.
   */
  styles?: KbdStyles

  /**
   * Prefix for data-slot attributes.
   */
  slotPrefix?: string

  /**
   * Array of keys to display.
   */
  value?: string[]
}

/**
 * Props for the Kbd component.
 */
export type KbdProps = KbdBaseProps & KbdVariantProps

export function Kbd(props: KbdProps): JSX.Element {
  const inner = (val: string) => (
    <kbd
      data-slot={props.slotPrefix ? `${props.slotPrefix}-kbd` : 'kbd'}
      class={kbdItemVariants(
        {
          size: props.size,
          variant: props.variant,
        },
        props.classes?.item,
      )}
      style={props.styles?.item}
    >
      {val}
    </kbd>
  )
  return (
    <Show when={props.value}>
      <Switch>
        <Match when={props.value!.length === 1}>{inner(props.value![0])}</Match>
        <Match when={props.value!.length > 1}>
          <span
            data-slot={props.slotPrefix ? `${props.slotPrefix}-kbds` : 'kbds'}
            class={cn('inline-flex gap-1 items-center', props.classes?.root)}
            style={props.styles?.root}
          >
            <For each={props.value}>{(value) => inner(value)}</For>
          </span>
        </Match>
      </Switch>
    </Show>
  )
}
