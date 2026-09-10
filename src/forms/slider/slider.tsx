import type { JSX, Ref } from 'solid-js'
import { For, mergeProps, onMount, Show, splitProps } from 'solid-js'

import { HiddenInput } from '../../shared/hidden-input'
import { createComponentStyles } from '../../shared/provider'
import { callRef, useId } from '../../shared/utils'
import { useFormField, useFormFieldContext } from '../form/form-context'

import { useSlider } from './hook'
import type { SliderProps, SliderT } from './slider.types'

type RootProps<TValue = SliderT.Value> = SliderProps<TValue> & {
  ref?: Ref<HTMLDivElement>
}

/** Range slider component with single or multi-thumb support and step markers. */
export function Slider<TValue extends SliderT.Value = SliderT.Value>(
  props: SliderProps<TValue>,
): JSX.Element {
  const [local, rest] = splitProps(props as RootProps<TValue>, [
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
    'divider',
    'allowThumbCrossing',
    'onValueChange',
    'onChange',
    'orientation',
    'inverted',
    'variant',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const themeField = useFormFieldContext()
  const resolved = createComponentStyles('slider', local, {
    inheritedVariants: () => ({ size: themeField?.size }),
  })
  const merged = mergeProps(
    {
      min: 0,
      max: 100,
      minStepsBetweenThumbs: 0,
      allowThumbCrossing: true,
      get orientation() {
        return resolved.variants.orientation ?? 'horizontal'
      },
      inverted: false,
    },

    local,
  )

  const generatedId = useId(() => merged.id, 'slider')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: local.size,
      disabled: merged.disabled,
      required: local.required,
      readOnly: Boolean(merged.readOnly),
    }),
    () => ({
      defaultId: generatedId(),
    }),
  )

  const slider = useSlider<TValue>(merged, {
    disabled: field.disabled,
    onValueInput(value) {
      field.setFormValue(value)
      merged.onValueChange?.(value)
      field.emit('input')
    },
    onValueCommit(value) {
      field.setFormValue(value)
      merged.onChange?.(value)
      field.emit('change')
    },
    onFocus() {
      field.emit('focus')
    },
    onBlur() {
      field.emit('blur')
    },
    onValueReset(value) {
      field.setFormValue(value)
    },
  })

  onMount(() => {
    if (field.value() === undefined) {
      field.setFormValue(slider.getPublicValue(slider.currentValues()))
    }
  })

  return (
    <div
      ref={(element) => callRef(local.ref, element)}
      id={`${field.id()}-root`}
      role="group"
      data-slot="root"
      data-dragging={slider.dragging() ? '' : undefined}
      data-disabled={field.disabled() ? '' : undefined}
      data-invalid={field.invalid() ? '' : undefined}
      data-readonly={merged.readOnly ? '' : undefined}
      data-required={field.required() ? '' : undefined}
      {...field.ariaAttrs()}
      {...resolved.root}
      {...rest}
    >
      <div
        ref={(element) => {
          slider.setTrackRef(element)
        }}
        data-slot="track"
        {...resolved.slot('track')}
        onPointerDown={slider.onTrackPointerDown}
        onPointerMove={slider.onTrackPointerMove}
        onPointerUp={slider.onTrackPointerUp}
        onPointerCancel={slider.onPointerCancel}
        onLostPointerCapture={slider.onPointerCancel}
      >
        <div
          data-slot="range"
          data-multiple={slider.currentValues().length > 1 ? '' : undefined}
          data-inverted={merged.inverted ? '' : undefined}
          data-dragging={slider.dragging() ? '' : undefined}
          style={{ ...slider.rangeStyle(), ...resolved.slot('range').style }}
          class={resolved.slot('range').class}
        />

        <Show when={merged.divider}>
          <For each={slider.dividerIndexes()}>
            {(dividerIndex) => (
              <div
                data-slot="divider"
                style={{
                  ...slider.getDividerStyle(dividerIndex),
                  ...resolved.slot('divider').style,
                }}
                class={resolved.slot('divider').class}
              />
            )}
          </For>
        </Show>
      </div>

      <For each={Array.from({ length: slider.currentValues().length }, (_, index) => index)}>
        {(thumbIndex) => (
          <div
            ref={(element) => {
              slider.setThumbRefs((previous) => {
                const next = [...previous]
                next[thumbIndex] = element
                return next
              })
            }}
            data-slot="thumb"
            data-inverted={merged.inverted ? '' : undefined}
            data-dragging={
              slider.dragging() && slider.activeThumbIndexState() === thumbIndex ? '' : undefined
            }
            data-disabled={field.disabled() ? '' : undefined}
            data-invalid={field.invalid() ? '' : undefined}
            data-readonly={merged.readOnly ? '' : undefined}
            data-required={field.required() ? '' : undefined}
            role="slider"
            tabIndex={field.disabled() ? undefined : 0}
            style={{ ...slider.thumbStyles()[thumbIndex], ...resolved.slot('thumb').style }}
            class={resolved.slot('thumb').class}
            aria-valuemin={slider.getThumbMinValue(thumbIndex)}
            aria-valuenow={slider.currentValues()[thumbIndex] ?? merged.min}
            aria-valuemax={slider.getThumbMaxValue(thumbIndex)}
            aria-valuetext={slider.getThumbValueText(thumbIndex)}
            aria-orientation={merged.orientation ?? undefined}
            aria-label={
              slider.currentValues().length <= 1
                ? 'Thumb'
                : `Thumb ${thumbIndex + 1} of ${slider.currentValues().length}`
            }
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
            onFocus={() => {
              slider.onThumbFocus(thumbIndex)
            }}
            onBlur={slider.onThumbBlur}
          >
            <HiddenInput
              ref={(element) => {
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
              readOnly={merged.readOnly}
              tabIndex={field.disabled() ? undefined : -1}
              aria-valuetext={slider.getThumbValueText(thumbIndex)}
              aria-orientation={merged.orientation ?? undefined}
              {...field.ariaAttrs()}
            />
          </div>
        )}
      </For>

      {rest.children}
    </div>
  )
}
