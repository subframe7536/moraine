import type { JSX } from 'solid-js'
import { createMemo, Show, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { useFieldContext } from '../field/field-context'
import { Slider } from '../slider'
import type { SliderT } from '../slider'

import {
  BOLD_SLIDER_FILL_CLASS,
  BOLD_SLIDER_FILL_LAYER_CLASS,
  BOLD_SLIDER_LAYER_CLASS,
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
    'subtle',
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

  function Content(state: SliderT.ChildrenRenderProps<number>): JSX.Element {
    const percent = () => (state.percentages[0] ?? 0) * 100
    const formatted = createMemo(() => formatValue(state.values[0] ?? props.min ?? 0))
    const indicatorPosition = () => {
      // Near the minimum the indicator slides past the start edge and is clipped by the content box.
      const offset = `calc(${percent()}% - var(--bs-indicator-gap) - var(--bs-indicator-width))`
      return {
        style: props.inverted ? { 'inset-inline-end': offset } : { 'inset-inline-start': offset },
      }
    }

    function Layer(layerProps: { fill?: boolean }): JSX.Element {
      return (
        <>
          <div class={BOLD_SLIDER_LAYER_CLASS}>
            <Show when={local.label}>
              <span
                data-slot="bold-slider-label"
                {...boldSliderDataAttributes.label({ fill: () => layerProps.fill })}
                {...slots.label}
              >
                {local.label}
              </span>
            </Show>
            <Show when={local.showValue ?? true}>
              <span
                data-slot="bold-slider-value"
                {...boldSliderDataAttributes.value({ fill: () => layerProps.fill })}
                {...slots.value}
              >
                {formatted()}
              </span>
            </Show>
          </div>
          <div
            data-slot="bold-slider-indicator"
            {...boldSliderDataAttributes.indicator({ fill: () => layerProps.fill })}
            {...slotWith('indicator', undefined, indicatorPosition)}
          />
        </>
      )
    }

    return (
      <div data-slot="bold-slider-content" aria-hidden="true" {...slots.content}>
        <Layer />
        <div class={BOLD_SLIDER_FILL_CLASS} style={{ width: `${percent()}%` }}>
          <div class={BOLD_SLIDER_FILL_LAYER_CLASS}>
            <Layer fill />
          </div>
        </div>
      </div>
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
      {(state: SliderT.ChildrenRenderProps<number>) => <Content {...state} />}
    </Slider>
  )
}
