import type { JSX } from '@solidjs/web'

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
    /** Localized message overrides for this progress instance, such as the `aria-valuetext` announced while indeterminate. */
    translations?: Translations
    /**
     * The current value, from `0` to `max`; values outside that range are clamped. Leave it `undefined`
     * (or non-finite) for indeterminate progress, which sets no `aria-valuenow`.
     * @default undefined
     */
    value?: number

    /**
     * The value that counts as complete. A negative or non-finite number falls back to `100`.
     * @default 100
     */
    max?: number

    /**
     * Content for the label slot. Also used as the default `aria-label` when it is a string; an
     * explicit `aria-label` takes precedence.
     */
    label?: JSX.Element

    /**
     * `Intl.NumberFormat` options for the displayed value and `aria-valuetext`, using the provider
     * locale. Like `Slider` and `BoldSlider`, they format the raw clamped `value`, not the completed
     * fraction; a `percent` style multiplies by 100, so pair it with a `max` of `1`. Without
     * `formatOptions` the text is the completed percentage rounded to 2 decimal places (`'40%'`).
     * A `valueLabel` function takes precedence.
     * @example
     * ```tsx
     * import { Progress } from 'moraine'
     *
     * <Progress
     *   value={1.5}
     *   max={4}
     *   label="Storage"
     *   valueLabel
     *   formatOptions={{ style: 'unit', unit: 'gigabyte' }}
     * />
     * ```
     */
    formatOptions?: Intl.NumberFormatOptions

    /**
     * Whether to show the value slot for determinate progress, or a formatter for it.
     * The formatter receives the clamped `value`, `max` and `percent` (`0`-`100`, rounded to 2 decimals)
     * and returns the text; the result also supplies `aria-valuetext`. Nothing is shown while indeterminate.
     * @default false
     * @example
     * ```tsx
     * import { Progress } from 'moraine'
     *
     * <Progress
     *   value={3}
     *   max={8}
     *   label="Files"
     *   valueLabel={({ value, max }) => `${value} of ${max}`}
     * />
     * ```
     */
    valueLabel?: boolean | ((props: { percent: number; value: number; max: number }) => string)
  }

  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/** Props for the Progress component. */
export type ProgressProps = ProgressT.Props
