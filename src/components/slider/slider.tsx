import type { JSX } from '@solidjs/web'
import {
  children as resolveChildren,
  createMemo,
  For,
  merge,
  onSettled,
  Show,
  omit,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { HiddenInput } from '../../shared/hidden-input'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler, callRef, createId, pick } from '../../shared/utils'
import type { Orientation } from '../../theme/style-types'
import { useFormField, useFieldContext } from '../field/field-context'
import { useFormReset } from '../shared/form/use-form-reset'

import { createSlider } from './hook'
import { defaultSliderMessages } from './slider.messages'
import { sliderDataAttributes, sliderRecipe } from './slider.recipe'
import type { SliderProps, SliderT } from './slider.types'
/**
 * Range slider for choosing a number or range by moving one or more thumbs; a number `value` gives
 * one thumb and an array gives a range. Use `NumberInput` when the value is typed and stepped
 * rather than dragged, and `BoldSlider` for a compact single value with the label inside the track.
 * Controlled with `value` and `onValueChange`, or uncontrolled with `defaultValue`; wrap it in
 * `Field` for a label and messages, or set `aria-label`.
 *
 * @example
 * ```tsx
 * import { createSignal, merge, For, omit } from 'solid-js'
 * import { Field, Slider } from 'moraine'
 *
 * const [volume, setVolume] = createSignal(50)
 *
 * <Field label="Volume">
 *   <Slider value={volume()} onValueChange={setVolume} min={0} max={100} step={5} markers />
 * </Field>
 * ```
 */
export function Slider<TValue extends SliderT.Value = SliderT.Value>(
  props: SliderProps<TValue>,
): JSX.Element {
  const local = pick(
    props,
    'ref',
    'inputRef',
    'id',
    'name',
    'form',
    'value',
    'defaultValue',
    'required',
    'disabled',
    'readOnly',
    'min',
    'max',
    'step',
    'minStepsBetweenThumbs',
    'markers',
    'allowThumbCrossing',
    'thumbAlignment',
    'onValueChange',
    'onValueCommit',
    'onFocus',
    'onBlur',
    'orientation',
    'reversed',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'aria-label',
    'translations',
    'formatOptions',
    'children',
  )
  const rest = omit(
    props,
    'ref',
    'inputRef',
    'id',
    'name',
    'form',
    'value',
    'defaultValue',
    'required',
    'disabled',
    'readOnly',
    'min',
    'max',
    'step',
    'minStepsBetweenThumbs',
    'markers',
    'allowThumbCrossing',
    'thumbAlignment',
    'onValueChange',
    'onValueCommit',
    'onFocus',
    'onBlur',
    'orientation',
    'reversed',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'aria-label',
    'translations',
    'formatOptions',
    'children',
  )
  const themeField = useFieldContext()
  const messages = useMessages('slider', defaultSliderMessages, () => local.translations)
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
        readonly: field.readOnly,
        required: field.required,
        reversed: () => merged.reversed,
        multiple: isMultiple,
        // The slider owns drags on its own axis, so a swipe-to-dismiss drawer
        // arbitrates touches that start on it like a native scroller.
        swipeIgnore: () => (merged.orientation === 'vertical' ? 'y' : 'x'),
      })),
      range: sliderDataAttributes.range(() => ({
        empty: () => {
          const values = slider.currentValues()
          if (values.length !== 1) {
            return false
          }
          const val = values[0]
          return val !== undefined && slider.getValuePercent(val) === 0
        },
        multiple: isMultiple,
        reversed: () => merged.reversed,
      })),
    },
    context: () => ({ variants: { size: themeField?.size } }),
    enforced: { range: () => ({ style: slider.rangeStyle() }) },
  })
  const merged = merge(
    {
      min: 0,
      max: 100,
      minStepsBetweenThumbs: 0,
      allowThumbCrossing: true,
      reversed: false,
    },
    local,
    {
      get orientation(): Orientation {
        return variants.orientation ?? 'horizontal'
      },
    },
  )

  const generatedId = createId(() => merged.id, 'slider')
  const field = useFormField(merged, {
    get defaultId() {
      return generatedId()
    },
  })
  const inputEls: Array<HTMLInputElement> = []

  const sliderProps = merge(merged, {
    get readOnly() {
      return field.readOnly()
    },
  })
  const slider = createSlider<TValue>(sliderProps, {
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
      callHandler(event, local.onFocus)
      field.emit('focus', event)
    },
    onBlur(event) {
      callHandler(event, local.onBlur)
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

  onSettled(() => {
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
      ref={(element) => callRef(() => local.ref, element)}
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

        <Show when={merged.markers}>
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
              reversed: () => merged.reversed,
              dragging: () => slider.dragging() && slider.activeThumbIndexState() === thumbIndex,
              focusVisible: () => slider.focusVisibleThumbIndex() === thumbIndex,
              disabled: field.disabled,
              invalid: field.invalid,
              readonly: field.readOnly,
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
              tabindex={field.disabled() ? undefined : 0}
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
                    callRef(() => local.inputRef, element)
                  }
                }}
                type="range"
                id={field.id() + (thumbIndex === 0 ? '' : `-${thumbIndex + 1}`)}
                name={field.name()}
                form={merged.form}
                min={slider.getThumbMinValue(thumbIndex)}
                max={slider.getThumbMaxValue(thumbIndex)}
                step={slider.definedStep() ?? 'any'}
                value={slider.currentValues()[thumbIndex] ?? merged.min}
                required={field.required()}
                disabled={field.disabled()}
                readonly={field.readOnly()}
                tabindex={field.disabled() ? undefined : -1}
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
