import type { JSX } from '@solidjs/web'
import { createEffect, createMemo, createSignal, Show, untrack, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale } from '../../provider/locale/locale-context'
import { formatLocaleNumber } from '../../provider/locale/number'
import { pick } from '../../shared/utils'
import { useFieldContext } from '../field/field-context'
import { Slider } from '../slider'
import type { SliderT } from '../slider'

import {
  BOLD_SLIDER_FILL_ROW_CLASS,
  boldSliderDataAttributes,
  boldSliderRecipe,
} from './bold-slider.recipe'
import type { BoldSliderProps } from './bold-slider.types'
function countDecimals(value: number): number {
  const text = String(value)
  const exponent = text.indexOf('e-')
  if (exponent !== -1) {
    return Number(text.slice(exponent + 2))
  }
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

/**
 * Single-value slider with a filled track, an inline label and value, and an edge indicator. Use
 * it for dense settings such as inspector panels, where each row holds one number and the track
 * doubles as its readout; use `Slider` for ranges, vertical layouts, or a thin track with a
 * visible thumb. It is built on `Slider`, so `value`, `defaultValue`, `onValueChange`, `min`,
 * `max`, and `step` behave the same way, with a plain `number` value.
 *
 * @example
 * ```tsx
 * import { createSignal, omit } from 'solid-js'
 * import { BoldSlider } from 'moraine'
 *
 * const [opacity, setOpacity] = createSignal(80)
 *
 * <BoldSlider
 *   label="Opacity"
 *   value={opacity()}
 *   onValueChange={setOpacity}
 *   valueLabel={({ value }) => `${value}%`}
 * />
 * ```
 */
export function BoldSlider(props: BoldSliderProps): JSX.Element {
  const local = pick(
    props,
    'label',
    'valueLabel',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'aria-label',
  )
  const rest = omit(
    props,
    'label',
    'valueLabel',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'aria-label',
  )
  const themeField = useFieldContext()
  const { locale } = useLocale()

  const [internalValue, setInternalValue] = createSignal(
    untrack(() => props.value ?? props.defaultValue ?? props.min ?? 0),
  )

  createEffect(
    () => props.value,
    (val) => {
      if (val !== undefined) {
        setInternalValue(val)
      }
    },
  )

  // The fill is empty only at `min`, which is not necessarily 0.
  const isAtMin = () => internalValue() <= (props.min ?? 0)

  // The track gets a transparent border as wide as the minimum fill on the fill's start side.
  // Slider positions the range and markers in the track's padding box and maps the pointer onto
  // it, so values spread over the rest of the track while the range reaches back over the border.
  const insetSide = () => (props.reversed ? 'end' : 'start')
  const {
    slots: { content: contentSlot },
    variants,
    slotWith,
    overrides,
  } = useRecipe(boldSliderRecipe, local, {
    context: () => ({ variants: { size: themeField?.size } }),
    enforced: {
      track: () => ({
        style: { [`border-inline-${insetSide()}`]: 'var(--bs-inset) solid transparent' },
      }),
      range: () => ({
        style: isAtMin()
          ? { display: 'none' }
          : { [`margin-inline-${insetSide()}`]: 'calc(var(--bs-inset) * -1)' },
      }),
    },
  })

  const formatValue = (value: number, fraction: number): string => {
    if (typeof local.valueLabel === 'function') {
      return local.valueLabel({ percent: fraction * 100, value, max: props.max ?? 100 })
    }
    const step = props.step
    const effectiveStep = step === undefined ? 1 : step > 0 ? step : undefined
    const decimals = effectiveStep !== undefined ? countDecimals(effectiveStep) : 2
    return formatLocaleNumber(
      value,
      locale(),
      props.formatOptions ?? { maximumFractionDigits: decimals, useGrouping: false },
    )
  }

  // Rendered as Slider root children after the track and thumb, so each part can read their
  // state through `peer-*` selectors.
  function Overlay(state: SliderT.ChildrenRenderProps<number>): JSX.Element {
    const isEmpty = () => (state.percentages[0] ?? 0) === 0

    createEffect(
      () => state.values[0],
      (val) => {
        if (val !== undefined && val !== internalValue()) {
          setInternalValue(val)
        }
      },
    )

    // Fill edge on the root: the minimum fill plus the value's share of the remaining width,
    // matching the range inside the inset track. At `min`, the fill collapses to 0.
    const fillEdge = () =>
      isEmpty()
        ? '0%'
        : `calc(var(--bs-inset) + (100% - var(--bs-inset)) * ${state.percentages[0] ?? 0})`
    const fromLeft = () => state.startEdge !== 'right'
    // Clip a track-wide layer to [start edge, fill edge]; `inset()` takes physical sides.
    const clipToFill = (top = '0', bottom = '0', from = '0', to = fillEdge()): string => {
      const far = `calc(100% - ${to})`
      return fromLeft()
        ? `inset(${top} ${far} ${bottom} ${from}`
        : `inset(${top} ${from} ${bottom} ${far}`
    }
    // The indicator is a track-wide layer clipped to the capsule just inside the fill edge. Its
    // gradient switches from the fill color to the track color at the fill edge.
    const indicatorStyle = (): { style: JSX.CSSProperties } => {
      const block = 'calc(50% - var(--bs-indicator-height) / 2)'
      // At `min` the fill is hidden, but dock the indicator at the minimum-fill position
      // so the user has a visual anchor for the leftmost draggable position.
      const edge = isEmpty() ? 'var(--bs-inset)' : fillEdge()
      const start = `calc(${edge} - var(--bs-indicator-gap) - var(--bs-indicator-width))`
      const end = `calc(${edge} - var(--bs-indicator-gap))`
      return {
        style: {
          'clip-path': `${clipToFill(block, block, start, end)} round var(--bs-indicator-width))`,
          'background-image': `linear-gradient(to ${fromLeft() ? 'right' : 'left'}, var(--bs-indicator-fill) ${edge}, var(--bs-indicator-track) ${edge})`,
        },
      }
    }
    const indicatorSlot = slotWith('indicator', { enforced: indicatorStyle })
    const formatted = createMemo(() =>
      formatValue(state.values[0] ?? props.min ?? 0, state.percentages[0] ?? 0),
    )

    function Texts(textProps: { fill?: boolean }): JSX.Element {
      const labelSlot = slotWith('label', {
        data: boldSliderDataAttributes.label({ fill: () => textProps.fill }),
      })
      const valueSlot = slotWith('value', {
        data: boldSliderDataAttributes.value({ fill: () => textProps.fill }),
      })
      // Each text layer owns its label instance; a JSX node cannot be inserted twice.
      const label = createMemo(() => local.label)

      return (
        <>
          <Show when={label()}>
            <span data-slot="bold-slider-label" {...labelSlot}>
              {label()}
            </span>
          </Show>
          <Show when={local.valueLabel ?? true}>
            <span data-slot="bold-slider-value" {...valueSlot}>
              {formatted()}
            </span>
          </Show>
        </>
      )
    }

    return (
      <>
        <div data-slot="bold-slider-content" aria-hidden="true" {...contentSlot}>
          <Texts />
        </div>
        <div
          data-slot="bold-slider-fill"
          aria-hidden="true"
          class={BOLD_SLIDER_FILL_ROW_CLASS}
          style={{ 'clip-path': `${clipToFill()})` }}
        >
          <Texts fill />
        </div>
        <div data-slot="bold-slider-indicator" aria-hidden="true" {...indicatorSlot} />
      </>
    )
  }

  return (
    <Slider
      {...rest}
      onValueChange={(val) => {
        setInternalValue(val)
        props.onValueChange?.(val)
      }}
      orientation="horizontal"
      size={variants.size}
      aria-label={
        local['aria-label'] ?? (typeof local.label === 'string' ? local.label : undefined)
      }
      {...overrides({
        root: 'root',
        track: 'track',
        range: 'range',
        marker: 'marker',
        thumb: 'thumb',
      })}
    >
      {(state: SliderT.ChildrenRenderProps<number>) => <Overlay {...state} />}
    </Slider>
  )
}
