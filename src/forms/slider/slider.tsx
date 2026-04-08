import * as KobalteSlider from '@kobalte/core/slider'
import type { JSX } from 'solid-js'
import { For, createEffect, createMemo, mergeProps, splitProps } from 'solid-js'

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
  export type Value = number | number[]

  export type Slot = 'root' | 'track' | 'range' | 'thumb'

  export type Variant = SliderVariantProps

  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = KobalteSlider.SliderRootProps

  export interface Items {}

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
  export interface Props extends BaseProps<
    Base,
    Variant,
    Extend,
    Slot,
    'minValue' | 'maxValue' | 'as'
  > {}
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

function areEqualValues(a: number[] | undefined, b: number[] | undefined): boolean {
  if (a === b) {
    return true
  }

  if (!a || !b || a.length !== b.length) {
    return false
  }

  return a.every((value, index) => value === b[index])
}

/** Range slider component with single or multi-thumb support and step markers. */
export function Slider(props: SliderProps): JSX.Element {
  const merged = mergeProps(
    {
      min: 0,
      max: 100,
      step: 1,
      minStepsBetweenThumbs: 0,
      orientation: 'horizontal' as const,
      size: 'md' as const,
    },
    props,
  )

  const [local, rest] = splitProps(merged, [
    ...FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS,
    'readOnly',
    'onValueChange',
    'onChange',
    'min',
    'max',
    'step',
    'minStepsBetweenThumbs',
    'orientation',
    'inverted',
    'size',
    'classes',
    'styles',
  ])

  const generatedId = useId(() => local.id, 'slider')
  const field = useFormField(
    () => ({
      id: local.id,
      name: local.name,
      size: local.size,
      disabled: local.disabled,
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: local.defaultValue ?? local.min,
    }),
  )

  const kobalteValue = createMemo(() => normalizeSliderValues(local.value, local.min!))
  const kobalteDefaultValue = createMemo(() =>
    normalizeSliderValues(local.defaultValue, local.min!),
  )
  let lastInputValues: number[] | undefined

  const thumbValues = () => kobalteValue() ?? kobalteDefaultValue() ?? [local.min!]
  const thumbIndexes = () => Array.from({ length: thumbValues().length }, (_, index) => index)

  createEffect(() => {
    if (areEqualValues(kobalteValue(), lastInputValues)) {
      lastInputValues = undefined
    }
  })

  function inputIdForIndex(index: number): string {
    if (index === 0) {
      return field.id()
    }

    return `${field.id()}-${index + 1}`
  }

  function toPublicValue(values: number[]): SliderT.Value {
    if (Array.isArray(local.value) || Array.isArray(local.defaultValue)) {
      return [...values]
    }

    return values[0] ?? local.min!
  }

  function onValueChange(values: number[]): void {
    if (
      areEqualValues(values, lastInputValues) ||
      (lastInputValues !== undefined && areEqualValues(values, kobalteValue()))
    ) {
      return
    }

    lastInputValues = [...values]

    const nextValue = toPublicValue(values)
    field.setFormValue(nextValue)
    local.onValueChange?.(nextValue)
    field.emit('input')
  }

  function onChange(values: number[]): void {
    lastInputValues = undefined

    const nextValue = toPublicValue(values)

    field.setFormValue(nextValue)
    local.onChange?.(nextValue)
    field.emit('change')
  }

  function SliderThumb(props: { thumbIndex: number }): JSX.Element {
    const context = KobalteSlider.useSliderContext()

    const style = createMemo<JSX.CSSProperties>(() => {
      const percent = context.state.getThumbPercent(props.thumbIndex) * 100
      const transform =
        context.state.orientation() === 'vertical'
          ? context.inverted()
            ? 'translateY(-50%)'
            : 'translateY(50%)'
          : context.inverted()
            ? 'translateX(50%)'
            : 'translateX(-50%)'

      return {
        [context.startEdge()]: `calc(${percent}%)`,
        transform,
        ...local.styles?.thumb,
      }
    })

    return (
      <KobalteSlider.Thumb
        data-slot="thumb"
        aria-label={createThumbAriaLabel(props.thumbIndex, thumbValues().length)}
        style={style()}
        class={sliderThumbVariants(
          {
            size: field.size(),
          },
          local.classes?.thumb,
        )}
        onFocus={() => field.emit('focus')}
        onBlur={() => field.emit('blur')}
      >
        <KobalteSlider.Input id={inputIdForIndex(props.thumbIndex)} {...field.ariaAttrs()} />
      </KobalteSlider.Thumb>
    )
  }

  return (
    <KobalteSlider.Root
      id={`${field.id()}-root`}
      name={field.name()}
      minValue={local.min}
      maxValue={local.max}
      step={local.step}
      minStepsBetweenThumbs={local.minStepsBetweenThumbs}
      orientation={local.orientation}
      inverted={local.inverted}
      value={kobalteValue()}
      defaultValue={kobalteDefaultValue()}
      required={local.required}
      disabled={field.disabled()}
      readOnly={local.readOnly}
      onChange={onValueChange}
      onChangeEnd={onChange}
      data-slot="root"
      style={local.styles?.root}
      data-disabled={field.disabled() ? '' : undefined}
      class={sliderRootVariants(
        {
          size: field.size(),
          orientation: local.orientation,
        },
        local.classes?.root,
      )}
      {...rest}
    >
      <KobalteSlider.Track
        data-slot="track"
        style={local.styles?.track}
        class={sliderTrackVariants(
          {
            size: field.size(),
            orientation: local.orientation,
          },
          local.classes?.track,
        )}
      >
        <KobalteSlider.Fill
          data-slot="range"
          style={local.styles?.range}
          class={sliderRangeVariants(
            {
              orientation: local.orientation,
            },
            local.classes?.range,
          )}
        />
      </KobalteSlider.Track>

      <For each={thumbIndexes()}>{(thumbIndex) => <SliderThumb thumbIndex={thumbIndex} />}</For>
    </KobalteSlider.Root>
  )
}
