import type { JSX } from 'solid-js'
import { createMemo, Show, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { useFieldContext } from '../field/field-context'
import { Slider } from '../slider'
import type { SliderT } from '../slider'

import {
  BOLD_SLIDER_FILL_CLASS,
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
  const { slots, variants, slotWith, overrides } = useRecipe(boldSliderRecipe, local, {
    contextVariants: () => ({ size: themeField?.size }),
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
    const fraction = () => state.percentages[0] ?? 0
    const fillWidth = () => `${fraction() * 100}%`
    // The clip box is `fraction` of the track wide, so `100% / fraction` of it spans the whole
    // track. This keeps the copy aligned with the base layer without a container query.
    const fillLayerWidth = () => (fraction() > 0 ? `${100 / fraction()}%` : '100%')
    // The indicator is a track-wide layer clipped to the capsule. Its gradient switches from the
    // fill color to the track color at the fill edge, so the capsule keeps a gap from the start
    // edge at low values and each part of it still matches the surface behind it.
    const indicatorStyle = (): { style: JSX.CSSProperties } => {
      const percent = `${fraction() * 100}%`
      const start = `max(var(--bs-indicator-gap), calc(${percent} - var(--bs-indicator-gap) - var(--bs-indicator-width)))`
      const far = `calc(100% - ${start} - var(--bs-indicator-width))`
      const block = 'calc(50% - var(--bs-indicator-height) / 2)'
      const fromLeft = state.startEdge !== 'right'
      const [left, right] = fromLeft ? [start, far] : [far, start]
      return {
        style: {
          'clip-path': `inset(${block} ${right} ${block} ${left} round var(--bs-indicator-width))`,
          'background-image': `linear-gradient(to ${fromLeft ? 'right' : 'left'}, var(--bs-indicator-fill) ${percent}, var(--bs-indicator-track) ${percent})`,
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
          class={BOLD_SLIDER_FILL_CLASS}
          style={{ width: fillWidth() }}
        >
          <div class={BOLD_SLIDER_FILL_ROW_CLASS} style={{ width: fillLayerWidth() }}>
            <Texts fill />
          </div>
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
