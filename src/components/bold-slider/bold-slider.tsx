import type { JSX } from 'solid-js'
import { createMemo, Show, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
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

/** Single-value slider with a filled track, an inline label and value, and an edge indicator. */
export function BoldSlider(props: BoldSliderProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'label',
    'showValue',
    'formatValue',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'aria-label',
  ])
  const themeField = useFieldContext()
  // The track gets a transparent border as wide as the minimum fill on the fill's start side.
  // Slider positions the range and markers in the track's padding box and maps the pointer onto
  // it, so values spread over the rest of the track while the range reaches back over the border.
  const insetSide = () => (props.inverted ? 'end' : 'start')
  const { slots, variants, slotWith, overrides } = useRecipe(boldSliderRecipe, local, {
    contextVariants: () => ({ size: themeField?.size }),
    enforced: {
      track: () => ({
        style: { [`border-inline-${insetSide()}`]: 'var(--bs-inset) solid transparent' },
      }),
      range: () => ({
        style: { [`margin-inline-${insetSide()}`]: 'calc(var(--bs-inset) * -1)' },
      }),
    },
  })

  const formatValue = (value: number): string => {
    if (local.formatValue) {
      return local.formatValue(value)
    }
    const step = props.step
    const decimals = typeof step === 'number' && step > 0 ? countDecimals(step) : 2
    return String(Number(value.toFixed(decimals)))
  }

  // Rendered as Slider root children after the track and thumb, so each part can read their
  // state through `peer-*` selectors.
  function Overlay(state: SliderT.ChildrenRenderProps<number>): JSX.Element {
    // Fill edge on the root: the minimum fill plus the value's share of the remaining width,
    // matching the range inside the inset track.
    const fillEdge = () =>
      `calc(var(--bs-inset) + (100% - var(--bs-inset)) * ${state.percentages[0] ?? 0})`
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
      const start = `calc(${fillEdge()} - var(--bs-indicator-gap) - var(--bs-indicator-width))`
      const end = `calc(${fillEdge()} - var(--bs-indicator-gap))`
      const block = 'calc(50% - var(--bs-indicator-height) / 2)'
      return {
        style: {
          'clip-path': `${clipToFill(block, block, start, end)} round var(--bs-indicator-width))`,
          'background-image': `linear-gradient(to ${fromLeft() ? 'right' : 'left'}, var(--bs-indicator-fill) ${fillEdge()}, var(--bs-indicator-track) ${fillEdge()})`,
        },
      }
    }
    const formatted = createMemo(() => formatValue(state.values[0] ?? props.min ?? 0))

    function Texts(textProps: { fill?: boolean }): JSX.Element {
      return (
        <>
          <Show when={local.label}>
            <span
              data-slot="bold-slider-label"
              {...boldSliderDataAttributes.label({ fill: () => textProps.fill })}
              {...slots.label}
            >
              {local.label}
            </span>
          </Show>
          <Show when={local.showValue ?? true}>
            <span
              data-slot="bold-slider-value"
              {...boldSliderDataAttributes.value({ fill: () => textProps.fill })}
              {...slots.value}
            >
              {formatted()}
            </span>
          </Show>
        </>
      )
    }

    return (
      <>
        <div data-slot="bold-slider-content" aria-hidden="true" {...slots.content}>
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
        <div
          data-slot="bold-slider-indicator"
          aria-hidden="true"
          {...slotWith('indicator', undefined, indicatorStyle)}
        />
      </>
    )
  }

  return (
    <Slider
      {...rest}
      orientation="horizontal"
      size={variants.size}
      aria-label={local['aria-label'] ?? local.label}
      {...overrides(['root', 'track', 'range', 'marker', 'thumb'])}
    >
      {(state: SliderT.ChildrenRenderProps<number>) => <Overlay {...state} />}
    </Slider>
  )
}
