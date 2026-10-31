import type { JSX } from 'solid-js'
import {
  children as resolveChildren,
  createMemo,
  For,
  mergeProps,
  onMount,
  Show,
  splitProps,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { HiddenInput } from '../../shared/hidden-input'
import { renderWithProps } from '../../shared/render-with-props'
import { callRef, createId } from '../../shared/utils'
import type { Orientation } from '../../theme/style-types'
import { useFormField, useFieldContext } from '../field/field-context'
import { useFormReset } from '../shared/form/use-form-reset'

import { createSlider } from './hook'
import { defaultSliderMessages } from './slider.messages'
import { sliderDataAttributes, sliderRecipe } from './slider.recipe'
import type { SliderProps, SliderT } from './slider.types'

/** Range slider component with single or multi-thumb support and step markers. */
export function Slider<TValue extends SliderT.Value = SliderT.Value>(
  props: SliderProps<TValue>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'ref',
    'inputRef',
    'id',
    'name',
    'value',
    'defaultValue',
    'required',
    'disabled',
    'readOnly',
    'min',
    'max',
    'step',
    'minStepsBetweenThumbs',
    'marker',
    'allowThumbCrossing',
    'onValueChange',
    'onValueCommit',
    'orientation',
    'inverted',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'aria-label',
    'translations',
    'children',
  ])
  const themeField = useFieldContext()
  const messages = useMessages('slider', defaultSliderMessages, () => local.translations)
  let slider!: ReturnType<typeof createSlider<TValue>>
  const {
    slots: { root: rootSlot, track: trackSlot, range: rangeSlot },
    variants,
    slotWith,
  } = useRecipe(sliderRecipe, local, {
    data: {
      root: sliderDataAttributes.root(() => ({
        dragging: slider.dragging,
        disabled: field.disabled,
        invalid: field.invalid,
        readonly: () => merged.readOnly,
        required: field.required,
        inverted: () => merged.inverted,
        multiple: isMultiple,
      })),
      range: sliderDataAttributes.range(() => ({
        multiple: isMultiple,
        inverted: () => merged.inverted,
      })),
    },
    context: () => ({ variants: { size: themeField?.size } }),
    enforced: { range: () => ({ style: slider.rangeStyle() }) },
  })
  const merged = mergeProps(
    {
      min: 0,
      max: 100,
      minStepsBetweenThumbs: 0,
      allowThumbCrossing: true,
      inverted: false,
    },
    local,
    {
      get orientation(): Orientation {
        return variants.orientation ?? 'horizontal'
      },
    },
  )

  const generatedId = createId(() => merged.id, 'slider')
  const fieldProps = mergeProps(merged, {
    get readOnly() {
      return Boolean(merged.readOnly)
    },
  })
  const field = useFormField(fieldProps, {
    get defaultId() {
      return generatedId()
    },
  })
  const inputEls: HTMLInputElement[] = []

  slider = createSlider<TValue>(merged, {
    disabled: field.disabled,
    onValueInput(value) {
      field.setFormValue(value)
      merged.onValueChange?.(value)
      field.emit('input')
    },
    onValueCommit(value) {
      field.setFormValue(value)
      merged.onValueCommit?.(value)
      field.emit('change')
    },
    onFocus(event) {
      field.emit('focus', event)
    },
    onBlur(event) {
      field.emit('blur', event)
    },
  })

  useFormReset(
    () => inputEls[0]?.form,
    () => {
      slider.resetValues()
      const nextValues = slider.currentValues()
      for (let i = 0; i < nextValues.length; i++) {
        const input = inputEls[i]
        if (input) {
          input.value = String(nextValues[i] ?? merged.min)
        }
      }
      field.setFormValue(slider.getPublicValue(nextValues))
    },
  )

  onMount(() => {
    if (field.value() === undefined) {
      field.setFormValue(slider.getPublicValue(slider.currentValues()))
    }
  })

  const thumbCount = createMemo(() => slider.currentValues().length)
  const isMultiple = createMemo(() => thumbCount() > 1)
  const thumbIndexes = createMemo(() => Array.from({ length: thumbCount() }, (_, index) => index))
  const child = resolveChildren(() => local.children as JSX.Element)
  const resolvedChildren = createMemo(() => {
    const value = child() as SliderT.Base<TValue>['children']
    if (typeof value !== 'function') {
      return value
    }
    return renderWithProps<SliderT.ChildrenRenderProps<TValue>>(value, {
      get value() {
        return slider.getPublicValue(slider.currentValues())
      },
      get values() {
        return slider.currentValues()
      },
      get percentages() {
        return slider.currentValues().map(slider.getValuePercent)
      },
      get dragging() {
        return slider.dragging()
      },
      get startEdge() {
        return slider.startEdge()
      },
    })
  })

  return (
    <div
      role="group"
      data-slot="slider"
      {...rootSlot}
      {...rest}
      ref={(element) => callRef(local.ref, element)}
      id={`${field.id()}-root`}
      aria-label={local['aria-label']}
      {...field.ariaAttrs()}
    >
      <div
        ref={(element) => {
          slider.setTrackRef(element)
        }}
        data-slot="slider-track"
        {...trackSlot}
        onPointerDown={slider.onTrackPointerDown}
        onPointerMove={slider.onTrackPointerMove}
        onPointerUp={slider.onTrackPointerUp}
        onPointerCancel={slider.onPointerCancel}
        onLostPointerCapture={slider.onPointerCancel}
      >
        <div data-slot="slider-range" {...rangeSlot} />

        <Show when={merged.marker}>
          <For each={slider.markerIndexes()}>
            {(markerIndex) => {
              const markerSlot = slotWith('marker', {
                enforced: () => ({ style: slider.getMarkerStyle(markerIndex) }),
                data: sliderDataAttributes.marker({
                  active: () => slider.isMarkerInRange(markerIndex),
                }),
              })

              return <div data-slot="slider-marker" {...markerSlot} />
            }}
          </For>
        </Show>
      </div>

      <For each={thumbIndexes()}>
        {(thumbIndex) => {
          const thumbSlot = slotWith('thumb', {
            enforced: () => ({
              style: {
                left: slider.thumbStyles()[thumbIndex]?.left,
                right: slider.thumbStyles()[thumbIndex]?.right,
                top: slider.thumbStyles()[thumbIndex]?.top,
                bottom: slider.thumbStyles()[thumbIndex]?.bottom,
              },
            }),
            data: sliderDataAttributes.thumb({
              inverted: () => merged.inverted,
              dragging: () => slider.dragging() && slider.activeThumbIndexState() === thumbIndex,
              focusVisible: () => slider.focusVisibleThumbIndex() === thumbIndex,
              disabled: field.disabled,
              invalid: field.invalid,
              readonly: () => merged.readOnly,
              required: field.required,
            }),
          })

          return (
            <div
              ref={(element) => {
                slider.setThumbRefs((previous) => {
                  const next = [...previous]
                  next[thumbIndex] = element
                  return next
                })
                if (thumbIndex === 0) {
                  field.setControlRef(element)
                }
              }}
              data-slot="slider-thumb"
              {...thumbSlot}
              role="slider"
              tabIndex={field.disabled() ? undefined : 0}
              aria-valuemin={slider.getThumbMinValue(thumbIndex)}
              aria-valuenow={slider.currentValues()[thumbIndex] ?? merged.min}
              aria-valuemax={slider.getThumbMaxValue(thumbIndex)}
              aria-valuetext={slider.getThumbValueText(thumbIndex)}
              aria-orientation={merged.orientation ?? undefined}
              aria-label={messages().thumb({
                index: thumbIndex,
                total: slider.currentValues().length,
              })}
              {...field.ariaAttrs()}
              onPointerDown={(event) => {
                slider.onThumbPointerDown(thumbIndex, event)
              }}
              onPointerMove={(event) => {
                slider.onThumbPointerMove(event)
              }}
              onPointerUp={(event) => {
                slider.onThumbPointerUp(event)
              }}
              onPointerCancel={slider.onPointerCancel}
              onLostPointerCapture={slider.onPointerCancel}
              onKeyDown={(event) => {
                slider.onThumbKeyDown(thumbIndex, event)
              }}
              onKeyUp={slider.onThumbKeyUp}
              onFocus={(event) => {
                slider.onThumbFocus(thumbIndex, event)
              }}
              onBlur={slider.onThumbBlur}
            >
              <HiddenInput
                ref={(element) => {
                  inputEls[thumbIndex] = element
                  if (thumbIndex === 0) {
                    callRef(local.inputRef, element)
                  }
                }}
                type="range"
                id={field.id() + (thumbIndex === 0 ? '' : `-${thumbIndex + 1}`)}
                name={field.name()}
                min={slider.getThumbMinValue(thumbIndex)}
                max={slider.getThumbMaxValue(thumbIndex)}
                step={slider.definedStep() ?? 'any'}
                value={slider.currentValues()[thumbIndex] ?? merged.min}
                required={field.required()}
                disabled={field.disabled()}
                readonly={merged.readOnly}
                tabIndex={field.disabled() ? undefined : -1}
                aria-valuetext={slider.getThumbValueText(thumbIndex)}
                aria-orientation={merged.orientation ?? undefined}
                {...field.ariaAttrs()}
              />
            </div>
          )
        }}
      </For>

      {resolvedChildren()}
    </div>
  )
}
