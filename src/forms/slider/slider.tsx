import type { JSX } from 'solid-js'
import { For, mergeProps, onMount, splitProps } from 'solid-js'

import { HiddenInput } from '../../shared/hidden-input.tsx'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useId } from '../../shared/utils.ts'
import { useFormField } from '../form-field/form-field-context.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options.ts'

import { useSlider } from './hook/index.ts'
import type { SliderVariantProps } from './slider.class.ts'
import {
  sliderDividerVariants,
  sliderRangeVariants,
  sliderRootVariants,
  sliderThumbVariants,
  sliderTrackVariants,
} from './slider.class.ts'

export namespace SliderT {
  export type Value = number | number[]

  export interface Slot<T = unknown> {
    /**
     * Slider container that owns track, range, thumbs, and labels.
     */
    root?: T

    /** Background rail representing the full slider range. */
    track?: T

    /** Filled segment between the start of the range and active thumb values. */
    range?: T

    /** Visual marker for one slider step. */
    divider?: T

    /** Draggable handle for one slider value. */
    thumb?: T
  }

  export type Variant = SliderVariantProps

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Slider component.
   */
  export interface Base<TValue = Value>
    extends
      FormIdentityOptions,
      FormValueOptions<TValue>,
      FormRequiredOption,
      FormDisableOption,
      FormReadOnlyOption {
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
     * Step increment between values.
     * When omitted, pointer movement is continuous.
     */
    step?: number

    /**
     * Minimum steps required between thumbs in a multi-thumb slider.
     * @default 0
     */
    minStepsBetweenThumbs?: number

    /**
     * Whether to show visual step dividers on the track, only applicable when `step` is defined and greater than 0.
     * @default false
     */
    divider?: boolean

    /**
     * Whether dragging can continue across another thumb when there is no minimum gap.
     * @default true
     */
    allowThumbCrossing?: boolean

    /**
     * Callback when the slider selection changes during interaction.
     */
    onValueChange?: (value: TValue) => void

    /**
     * Callback when the slider selection change is committed.
     */
    onChange?: (value: TValue) => void
  }

  /**
   * Props for the Slider component.
   */
  export type Props<TValue = Value> = BaseProps<'div', Base<TValue>, Variant, Slot>
}

/**
 * Props for the Slider component.
 */
export interface SliderProps<TValue = SliderT.Value> extends SliderT.Props<TValue> {}

/** Range slider component with single or multi-thumb support and step markers. */
export function Slider<TValue extends SliderT.Value = SliderT.Value>(
  props: SliderProps<TValue>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
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
  const merged = mergeProps(
    {
      min: 0,
      max: 100,
      minStepsBetweenThumbs: 0,
      allowThumbCrossing: true,
      orientation: 'horizontal' as const,
      size: 'md' as const,
      inverted: false,
    },
    local,
  )

  const generatedId = useId(() => merged.id, 'slider')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled,
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
    }),
  )
  const slider = useSlider(merged, {
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
  })

  onMount(() => {
    if (field.value() === undefined) {
      field.setFormValue(slider.getPublicValue(slider.currentValues()))
    }
  })

  return (
    <div
      id={`${field.id()}-root`}
      role="group"
      data-slot="root"
      data-orientation={merged.orientation}
      data-disabled={field.disabled() ? '' : undefined}
      data-invalid={field.invalid() ? '' : undefined}
      data-readonly={merged.readOnly ? '' : undefined}
      data-required={merged.required ? '' : undefined}
      style={{ ...merged.styles?.root, ...merged.style }}
      class={sliderRootVariants(
        { orientation: merged.orientation },
        field.disabled() && 'effect-dis',
        merged.classes?.root,
        merged.class,
      )}
      {...rest}
    >
      <div
        ref={(element) => {
          slider.setTrackRef(element)
        }}
        data-slot="track"
        data-orientation={merged.orientation}
        style={merged.styles?.track}
        class={sliderTrackVariants(
          {
            size: field.size(),
            orientation: merged.orientation,
            variant: merged.variant,
          },
          merged.classes?.track,
        )}
        onPointerDown={slider.onTrackPointerDown}
        onPointerMove={slider.onTrackPointerMove}
        onPointerUp={slider.onTrackPointerUp}
        onPointerCancel={slider.onPointerCancel}
        onLostPointerCapture={slider.onPointerCancel}
      >
        <div
          data-slot="range"
          data-orientation={merged.orientation}
          style={{
            ...slider.rangeStyle(),
            ...merged.styles?.range,
          }}
          class={sliderRangeVariants(
            {
              orientation: merged.orientation,
              variant: merged.variant,
              inverted: merged.inverted,
            },
            merged.classes?.range,
          )}
        />

        <For each={slider.dividerIndexes()}>
          {(dividerIndex) => (
            <div
              data-slot="divider"
              data-orientation={merged.orientation}
              style={{ ...slider.getDividerStyle(dividerIndex), ...merged.styles?.divider }}
              class={sliderDividerVariants(
                {
                  orientation: merged.orientation,
                  variant: merged.variant,
                },
                merged.classes?.divider,
              )}
            />
          )}
        </For>
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
            data-dragging={
              slider.dragging() && slider.activeThumbIndexState() === thumbIndex ? '' : undefined
            }
            data-disabled={field.disabled() ? '' : undefined}
            data-invalid={field.invalid() ? '' : undefined}
            data-readonly={merged.readOnly ? '' : undefined}
            data-required={merged.required ? '' : undefined}
            role="slider"
            tabIndex={field.disabled() ? undefined : 0}
            style={{
              ...slider.thumbStyles()[thumbIndex],
              ...merged.styles?.thumb,
            }}
            class={sliderThumbVariants(
              {
                inverted: merged.inverted,
                orientation: merged.orientation,
                size: field.size(),
                variant: merged.variant,
              },
              merged.classes?.thumb,
            )}
            aria-valuemin={slider.getThumbMinValue(thumbIndex)}
            aria-valuenow={slider.currentValues()[thumbIndex] ?? merged.min!}
            aria-valuemax={slider.getThumbMaxValue(thumbIndex)}
            aria-valuetext={slider.getThumbValueText(thumbIndex)}
            aria-orientation={merged.orientation}
            aria-label={
              slider.currentValues().length <= 1
                ? 'Thumb'
                : `Thumb ${thumbIndex + 1} of ${slider.currentValues().length}`
            }
            aria-required={merged.required || undefined}
            aria-disabled={field.disabled() || undefined}
            aria-readonly={merged.readOnly || undefined}
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
              type="range"
              id={field.id() + (thumbIndex === 0 ? '' : `-${thumbIndex + 1}`)}
              name={field.name()}
              min={slider.getThumbMinValue(thumbIndex)}
              max={slider.getThumbMaxValue(thumbIndex)}
              step={slider.definedStep() ?? 'any'}
              value={slider.currentValues()[thumbIndex] ?? merged.min!}
              required={merged.required}
              disabled={field.disabled()}
              readOnly={merged.readOnly}
              tabIndex={field.disabled() ? undefined : -1}
              aria-valuetext={slider.getThumbValueText(thumbIndex)}
              aria-orientation={merged.orientation}
              aria-required={merged.required || undefined}
              aria-disabled={field.disabled() || undefined}
              aria-readonly={merged.readOnly || undefined}
              {...field.ariaAttrs()}
            />
          </div>
        )}
      </For>
    </div>
  )
}
