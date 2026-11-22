import type { Component, JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { FieldT } from '../field'

import type { defaultSliderMessages } from './slider.messages'
import type { SliderStyleSlot, SliderStyleVariants } from './slider.style-types'

export namespace SliderT {
  export type Kind = 'single'
  export type Slot<T = unknown> = SliderStyleSlot<T>

  export type Variants = SliderStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultSliderMessages>
  export type Translations = Partial<Messages>

  export type Value = number | number[]

  export interface ChildrenRenderProps<TValue = Value> {
    /** Current public value: a number for one thumb, or an array for a range. */
    value: TValue
    /** Current thumb values in ascending order. */
    values: number[]
    /** Position of each thumb along the track, from `0` to `1`. */
    percentages: number[]
    /** Whether a pointer drag is in progress. */
    dragging: boolean
    /** Physical edge where the filled range starts, after `orientation`, `reversed`, and direction. */
    startEdge: 'left' | 'right' | 'top' | 'bottom'
  }

  /**
   * Base props for the Slider component.
   */
  export interface Base<TValue = Value> extends FieldT.ControlBase {
    /**
     * The current value (controlled). A number renders one thumb and an array renders one thumb per
     * entry (an empty array gives one thumb at `min`). Values are clamped to `min`-`max` and
     * arrays are sorted. Leave it `undefined` for uncontrolled usage. The slider throws a
     * `RangeError` when `max` is not greater than `min`.
     */
    value?: TValue
    /**
     * The initial value (uncontrolled), with the same number or array shape as `value`; its shape
     * also sets the shape that `onValueChange` and `onValueCommit` receive. Defaults to `min`.
     */
    defaultValue?: TValue

    /**
     * The id of a `<form>` the hidden inputs belong to, instead of the closest
     * ancestor form.
     */
    form?: string

    /**
     * Localized message overrides for this slider instance: `thumb` returns each thumb's
     * `aria-label` and `valueText` returns its `aria-valuetext`.
     * @example
     * ```tsx
     * import { Slider } from 'moraine'
     *
     * <Slider
     *   defaultValue={[20, 80]}
     *   translations={{
     *     thumb: ({ index }) => (index === 0 ? 'Minimum price' : 'Maximum price'),
     *   }}
     * />
     * ```
     */
    translations?: Translations
    /**
     * `Intl.NumberFormat` options used to format each thumb's raw value (not its share of the
     * `min`-`max` range) for `aria-valuetext`, using the provider locale. Formatting does not change
     * the value passed to callbacks. A `percent` style multiplies by 100, so pair it with a `0`-`1`
     * range.
     * @example
     * ```tsx
     * import { Slider } from 'moraine'
     *
     * <Slider
     *   defaultValue={0.25}
     *   min={0}
     *   max={1}
     *   step={0.05}
     *   formatOptions={{ style: 'percent' }}
     * />
     * ```
     */
    formatOptions?: Intl.NumberFormatOptions
    /**
     * Reverses the track direction, so `min` sits at the right (or top when vertical) instead of
     * the left (or bottom) in left-to-right layouts.
     * @default false
     */
    reversed?: boolean

    /**
     * Minimum value of the slider.
     * @default 0
     */
    min?: number

    /**
     * Maximum value of the slider.
     * @default 100
     */
    max?: number

    /**
     * Step increment between values; pointer and keyboard values snap to multiples of it from `min`.
     * A value of `0` (or not above `0`) keeps the slider continuous: pointer movement is smooth
     * and arrow keys move by 1% of the range. `PageUp`/`PageDown` and `Shift` + arrow move by
     * about 10% of the range.
     * @default 1
     */
    step?: number

    /**
     * Minimum distance between neighboring thumbs in a multi-thumb slider, counted in `step` units
     * (1% of the range when `step` is `0`). A value above `0` also stops thumbs from crossing,
     * regardless of `allowThumbCrossing`.
     * @default 0
     */
    minStepsBetweenThumbs?: number

    /**
     * Visual markers on the track. `true` marks every `step` and shows none when `step` is `0`.
     * A number marks every that many units without affecting snapping.
     * @default false
     */
    markers?: boolean | number

    /**
     * Whether dragging can continue across another thumb when there is no minimum gap. When `false`,
     * a thumb stops at its neighbor. Ignored while `minStepsBetweenThumbs` is above `0`.
     * @default true
     */
    allowThumbCrossing?: boolean

    /**
     * Visual alignment of the thumb at the track ends.
     * `'overflow'` centers the thumb on the value so half of it extends past
     * the track at `min` and `max`. `'contain'` clamps the thumb inside the
     * track so its edges stay within bounds. Value mapping is unaffected.
     * @default 'overflow'
     */
    thumbAlignment?: 'contain' | 'overflow'

    /**
     * Ref to the hidden native `<input type="range">` of the first thumb, which submits its value.
     * The focusable thumbs are separate `<div role="slider">` elements.
     */
    inputRef?: Ref<HTMLInputElement>

    /**
     * Called on every value change during interaction (pointer drag, track click, or key press),
     * with the new value in the same shape as `value`. Does not fire for programmatic changes to
     * `value`. Use `onValueCommit` to react once per finished interaction.
     */
    onValueChange?: (value: TValue) => void

    /**
     * Called once an interaction that changed the value finishes: when the pointer is released,
     * when a navigation key is released, or when focus leaves the slider. Receives the final value in
     * the same shape as `value`.
     * @example
     * ```tsx
     * import { Slider } from 'moraine'
     *
     * <Slider
     *   defaultValue={[20, 80]}
     *   onValueCommit={(range) => console.log(`${range[0]} to ${range[1]}`)}
     * />
     * ```
     */
    onValueCommit?: (value: TValue) => void

    /**
     * Focus event when focus enters the slider from outside, called before the `Field` focus
     * notification. Moving focus between thumbs of a range slider does not fire it.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>

    /**
     * Focus event when focus leaves the slider entirely, called before the `Field` blur
     * notification. Moving focus between thumbs of a range slider does not fire it.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>

    /**
     * Content rendered inside the root after the thumbs, or a render function receiving the live slider state.
     * A render function must declare its parameter, even when unused. A zero-argument
     * function is called as an accessor and is not mounted as a component.
     * @example
     * ```tsx
     * import { Slider } from 'moraine'
     *
     * <Slider defaultValue={30}>
     *   {(state) => <output>{state.dragging ? 'Dragging ' : ''}{state.values[0]}</output>}
     * </Slider>
     * ```
     */
    children?: JSX.Element | Component<ChildrenRenderProps<TValue>>
  }

  /**
   * Props for the Slider component.
   */
  export type Props<TValue = Value> = BaseProps<
    'div',
    Base<TValue>,
    Variants,
    Classes,
    Styles,
    'div',
    true
  >
}

/**
 * Props for the Slider component.
 */
export type SliderProps<TValue = SliderT.Value> = SliderT.Props<TValue>
