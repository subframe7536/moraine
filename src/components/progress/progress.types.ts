import type { Component, JSX } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { defaultProgressMessages } from './progress.messages'
import type { ProgressStyleSlot, ProgressStyleVariants } from './progress.style-types'

export namespace ProgressT {
  export type Kind = 'single'

  export type Slot<T = unknown> = ProgressStyleSlot<T>

  export type Variants = ProgressStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultProgressMessages>
  export type Translations = Partial<Messages>

  export interface ValueRenderProps {
    /** Current progress percentage (0-100). */
    percent?: number
  }

  /** Base props for the Progress component. */
  export interface Base {
    /** Localized message overrides for this progress instance. */
    translations?: Translations
    /**
     * The current value of the progress bar. If undefined, it is indeterminate.
     * @default undefined
     */
    value?: number

    /**
     * The maximum value of the progress bar.
     * @default 100
     */
    max?: number

    /**
     * Content for the label slot.
     */
    label?: JSX.Element

    /**
     * Whether to show the value slot for determinate progress.
     * @default false
     */
    showValue?: boolean

    /**
     * Callback that supplies `aria-valuetext` for a determinate value.
     */
    valueLabel?: (params: { value: number; min: number; max: number }) => string

    /**
     * Content or render function for the value slot.
     * Determinate progress shows this instead of the percentage.
     */
    valueRender?: JSX.Element | Component<ValueRenderProps>
  }

  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/** Props for the Progress component. */
export type ProgressProps = ProgressT.Props
