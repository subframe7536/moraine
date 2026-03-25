import * as KobalteSlider from '@kobalte/core/slider'
import type { JSX, ValidComponent } from 'solid-js'
import { For, createEffect, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'
import { FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS } from '../form-field/form-options'

import type { SliderVariantProps } from './slider.class'
import {
  sliderRangeVariants,
  sliderRootVariants,
  sliderThumbVariants,
  sliderTrackVariants,
} from './slider.class'

export namespace SliderT {
  export type Slot = 'root' | 'track' | 'range' | 'thumb'

  export type Variant = SliderVariantProps

  export interface Items {}

  export type Value = number | number[]

  export type Extend = KobalteSlider.SliderRootProps
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

  /**
   * Base props for the Slider component.
   */
  export interface Base
    extends
      FormIdentityOptions,
      FormValueOptions<Value>,
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
     * @default 1
     */
    step?: number

    /**
     * Minimum steps required between thumbs in a multi-thumb slider.
     * @default 0
     */
    minStepsBetweenThumbs?: number

    /**
     * Orientation of the slider.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical'

    /**
     * Whether to invert the slider axis.
     * @default false
     */
    inverted?: boolean

    highlight?: boolean

    /**
     * Callback when the slider selection changes during interaction.
     */
    onValueChange?: (value: Value) => void

    /**
     * Callback when the slider selection change is committed.
     */
    onChange?: (value: Value) => void
  }

  /**
   * Props for the Slider component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot, 'minValue' | 'maxValue'> {}
}

/**
 * Props for the Slider component.
 */
export interface SliderProps extends SliderT.Props {}

function normalizeSliderValues(
  value: SliderT.Value | undefined,
  fallback: number,
): number[] | undefined {
  if (value === undefined) {
    return undefined
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? [...value] : [fallback]
  }

  return [value]
}

function createThumbAriaLabel(index: number, total: number): string {
  if (total <= 1) {
    return 'Thumb'
  }

  return `Thumb ${index + 1} of ${total}`
}

/** Range slider component with single or multi-thumb support and step markers. */
export function Slider(props: SliderProps): JSX.Element {
  const merged = mergeProps(
    {
      as: 'div' as ValidComponent,
      min: 0,
      max: 100,
      step: 1,
      minStepsBetweenThumbs: 0,
      orientation: 'horizontal' as const,
      size: 'md' as const,
    },
    props,
  )

  const [formProps, rangeProps, styleProps, restProps] = splitProps(
    merged as SliderProps,
    [...FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS, 'readOnly', 'onValueChange', 'onChange'],
    ['min', 'max', 'step', 'minStepsBetweenThumbs', 'orientation', 'inverted'],
    ['size', 'classes', 'styles', 'highlight'],
  )

  const generatedId = useId(() => formProps.id, 'slider')
  const field = useFormField(
    () => ({
      id: formProps.id,
      name: formProps.name,
      size: styleProps.size,
      highlight: styleProps.highlight,
      disabled: formProps.disabled,
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: formProps.defaultValue ?? rangeProps.min,
    }),
  )

  const kobalteValue = createMemo(() => normalizeSliderValues(formProps.value, rangeProps.min!))
  const kobalteDefaultValue = createMemo(() =>
    normalizeSliderValues(formProps.defaultValue, rangeProps.min!),
  )
  const [uncontrolledValues, setUncontrolledValues] = createSignal<number[]>([0])

  const thumbValues = () => kobalteValue() ?? kobalteDefaultValue() ?? [rangeProps.min!]
  const thumbIndexes = () => Array.from({ length: thumbValues().length }, (_, index) => index)

  createEffect(() => {
    if (formProps.value !== undefined) {
      return
    }

    const initial = kobalteDefaultValue() ?? [rangeProps.min!]
    setUncontrolledValues(initial)
  })

  function inputIdForIndex(index: number): string {
    if (index === 0) {
      return field.id()
    }

    return `${field.id()}-${index + 1}`
  }

  function toPublicValue(values: number[]): SliderT.Value {
    if (Array.isArray(formProps.value) || Array.isArray(formProps.defaultValue)) {
      return [...values]
    }

    return values[0] ?? rangeProps.min!
  }

  function resolveThumbPercent(index: number): number {
    const range = rangeProps.max! - rangeProps.min!

    if (range <= 0) {
      return 0
    }

    const visualValues = kobalteValue() ?? uncontrolledValues()
    const nextValue = visualValues[index] ?? rangeProps.min!
    const percent = ((nextValue - rangeProps.min!) / range) * 100

    if (!Number.isFinite(percent)) {
      return 0
    }

    return Math.max(0, Math.min(100, percent))
  }

  function thumbStyle(index: number): JSX.CSSProperties {
    const percent = resolveThumbPercent(index)

    if (rangeProps.orientation === 'vertical') {
      const startEdge = rangeProps.inverted ? 'top' : 'bottom'
      const transform = rangeProps.inverted ? 'translateY(-50%)' : 'translateY(50%)'

      return {
        [startEdge]: `calc(${percent}%)`,
        transform,
      } as JSX.CSSProperties
    }

    const startEdge = rangeProps.inverted ? 'right' : 'left'
    const transform = rangeProps.inverted ? 'translateX(50%)' : 'translateX(-50%)'

    return {
      [startEdge]: `calc(${percent}%)`,
      transform,
    } as JSX.CSSProperties
  }

  function onValueChange(values: number[]): void {
    if (formProps.value === undefined) {
      setUncontrolledValues([...values])
    }

    const nextValue = toPublicValue(values)
    field.setFormValue(nextValue)
    formProps.onValueChange?.(nextValue)
    field.emit('input')
  }

  function onChange(values: number[]): void {
    const nextValue = toPublicValue(values)

    field.setFormValue(nextValue)
    formProps.onChange?.(nextValue)
    field.emit('change')
  }

  return (
    <KobalteSlider.Root
      id={`${field.id()}-root`}
      name={field.name()}
      minValue={rangeProps.min}
      maxValue={rangeProps.max}
      step={rangeProps.step}
      minStepsBetweenThumbs={rangeProps.minStepsBetweenThumbs}
      orientation={rangeProps.orientation}
      inverted={rangeProps.inverted}
      value={kobalteValue()}
      defaultValue={kobalteDefaultValue()}
      required={formProps.required}
      disabled={field.disabled()}
      readOnly={formProps.readOnly}
      onChange={onValueChange}
      onChangeEnd={onChange}
      data-slot="root"
      style={styleProps.styles?.root}
      data-highlight={field.highlight() ? '' : undefined}
      data-disabled={field.disabled() ? '' : undefined}
      class={sliderRootVariants(
        {
          size: field.size(),
          orientation: rangeProps.orientation,
        },
        styleProps.classes?.root,
      )}
      {...restProps}
    >
      <KobalteSlider.Track
        data-slot="track"
        style={styleProps.styles?.track}
        data-highlight={field.highlight() ? '' : undefined}
        class={sliderTrackVariants(
          {
            size: field.size(),
            orientation: rangeProps.orientation,
          },
          styleProps.classes?.track,
        )}
      >
        <KobalteSlider.Fill
          data-slot="range"
          style={styleProps.styles?.range}
          data-highlight={field.highlight() ? '' : undefined}
          class={sliderRangeVariants(
            {
              orientation: rangeProps.orientation,
            },
            styleProps.classes?.range,
          )}
        />
      </KobalteSlider.Track>

      <For each={thumbIndexes()}>
        {(thumbIndex) => (
          <KobalteSlider.Thumb
            data-slot="thumb"
            data-highlight={field.highlight() ? '' : undefined}
            aria-label={createThumbAriaLabel(thumbIndex, thumbValues().length)}
            style={{ ...thumbStyle(thumbIndex), ...styleProps.styles?.thumb }}
            class={sliderThumbVariants(
              {
                size: field.size(),
              },
              styleProps.classes?.thumb,
            )}
            onFocus={() => field.emit('focus')}
            onBlur={() => field.emit('blur')}
          >
            <KobalteSlider.Input id={inputIdForIndex(thumbIndex)} {...field.ariaAttrs()} />
          </KobalteSlider.Thumb>
        )}
      </For>
    </KobalteSlider.Root>
  )
}
