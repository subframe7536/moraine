import type { JSX } from 'solid-js'

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
     * Content for the label slot. Also used as the default `aria-label` when it is a string.
     */
    label?: JSX.Element

    /**
     * Intl.NumberFormat options for the displayed value, using the provider locale. A
     * percent style formats the completed fraction; other styles format alue.
     * Defaults to the percentage rounded to 2 decimal places.
     */
    formatOptions?: Intl.NumberFormatOptions

    /**
     * Whether to show the value slot for determinate progress, or a formatter for it.
     * The formatter result also supplies `aria-valuetext`.
     * @default false
     */
    valueLabel?: boolean | ((props: { percent: number; value: number; max: number }) => string)
  }

  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/** Props for the Progress component. */
export type ProgressProps = ProgressT.Props
