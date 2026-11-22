import type { JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { SliderT } from '../slider'

import type { BoldSliderStyleSlot, BoldSliderStyleVariants } from './bold-slider.style-types'

export namespace BoldSliderT {
  export type Kind = 'single'
  export type Slot<T = unknown> = BoldSliderStyleSlot<T>

  export type Variants = BoldSliderStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Translations = SliderT.Translations

  /**
   * Base props for the BoldSlider component.
   */
  export type Base = Omit<
    SliderT.Base<number>,
    | 'minStepsBetweenThumbs'
    | 'allowThumbCrossing'
    | 'thumbAlignment'
    | 'children'
    | 'formatOptions'
    | 'onFocus'
    | 'onBlur'
  > & {
    /**
     * `Intl.NumberFormat` options used to format the raw value (not its share of the `min`-`max`
     * range) for the displayed value text and `aria-valuetext`, using the provider locale. A
     * `percent` style multiplies by 100, so pair it with a `0`-`1` range. A `valueLabel` function
     * takes precedence for the displayed text.
     * @example
     * ```tsx
     * import { BoldSlider } from 'moraine'
     *
     * <BoldSlider
     *   label="Opacity"
     *   defaultValue={0.5}
     *   min={0}
     *   max={1}
     *   step={0.05}
     *   formatOptions={{ style: 'percent' }}
     * />
     * ```
     */
    formatOptions?: Intl.NumberFormatOptions

    /**
     * Content shown at the start of the track. Also used as the default `aria-label` when it is a
     * string. It renders in both the track and fill text layers, so pass JSX inline rather than a
     * shared node.
     */
    label?: JSX.Element

    /**
     * Controls the value text shown at the end of the track. `false` hides it, `true` shows the
     * number, and a function returns the text to show. The function receives the current `value`,
     * the `max` (100 when not set), and `percent`, the filled share of the track from 0 to 100.
     * With `true`, the value is formatted with `formatOptions` when set; otherwise it is rounded to
     * the decimal places of `step` (2 places when `step` is `0`) with no digit grouping.
     * @default true
     * @example
     * ```tsx
     * import { BoldSlider } from 'moraine'
     *
     * <BoldSlider
     *   label="Volume"
     *   defaultValue={40}
     *   valueLabel={({ value, max }) => `${value} / ${max}`}
     * />
     * ```
     */
    valueLabel?: boolean | ((props: { percent: number; value: number; max: number }) => string)

    /**
     * Focus event when focus enters the slider, called before the `Field` focus notification.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>

    /**
     * Focus event when focus leaves the slider, called before the `Field` blur notification.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>
  }

  /**
   * Props for the BoldSlider component.
   */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/**
 * Props for the BoldSlider component.
 */
export type BoldSliderProps = BoldSliderT.Props
