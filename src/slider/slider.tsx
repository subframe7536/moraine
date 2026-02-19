import * as KobalteSlider from '@kobalte/core/slider'
import type { JSX, ValidComponent } from 'solid-js'
import { For, createEffect, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { useFormField } from '../form-field/form-field-context'
import { useId } from '../shared/utils'

import type { SliderVariantProps } from './slider.class'
import {
  sliderInputVariants,
  sliderRangeVariants,
  sliderRootVariants,
  sliderThumbVariants,
  sliderTrackVariants,
} from './slider.class'

type SliderColor = NonNullable<SliderBaseProps['color']>
type SliderSize = NonNullable<SliderBaseProps['size']>
type SliderOrientation = NonNullable<SliderBaseProps['orientation']>

export type SliderValue = number | number[]

export interface SliderClasses {
  root?: string
  track?: string
  range?: string
  thumb?: string
  input?: string
}

export interface SliderBaseProps extends Pick<SliderVariantProps, 'color' | 'size' | 'highlight'> {
  as?: ValidComponent
  id?: string
  name?: string
  value?: SliderValue
  defaultValue?: SliderValue
  min?: number
  max?: number
  step?: number
  minStepsBetweenThumbs?: number
  orientation?: 'horizontal' | 'vertical'
  inverted?: boolean
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  onValueChange?: (value: SliderValue) => void
  onChange?: (value: SliderValue) => void
  classes?: SliderClasses
}

export type SliderProps = SliderBaseProps &
  Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof SliderBaseProps | 'id' | 'children' | 'class'>

function normalizeSliderColor(value?: string): SliderColor {
  return (value as SliderColor | undefined) ?? 'primary'
}

function normalizeSliderSize(value?: string): SliderSize {
  return (value as SliderSize | undefined) ?? 'md'
}

function normalizeSliderOrientation(value?: string): SliderOrientation {
  return (value as SliderOrientation | undefined) ?? 'horizontal'
}

function normalizeSliderValues(
  value: SliderValue | undefined,
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

export function Slider(props: SliderProps): JSX.Element {
  const merged = mergeProps(
    {
      as: 'div' as ValidComponent,
      min: 0,
      max: 100,
      step: 1,
      minStepsBetweenThumbs: 0,
      orientation: 'horizontal' as const,
      color: 'primary' as const,
      size: 'md' as const,
    },
    props,
  )

  const [local, rest] = splitProps(merged as SliderProps, [
    'as',
    'id',
    'name',
    'value',
    'defaultValue',
    'min',
    'max',
    'step',
    'minStepsBetweenThumbs',
    'orientation',
    'inverted',
    'required',
    'disabled',
    'readOnly',
    'onValueChange',
    'onChange',
    'color',
    'size',
    'highlight',
    'classes',
  ])

  const field = useFormField(() => ({
    id: local.id,
    name: local.name,
    size: local.size,
    color: local.color,
    highlight: local.highlight,
    disabled: local.disabled,
  }))
  const generatedId = useId(() => local.id, 'slider')

  const inputId = () => field.id() ?? generatedId()
  const resolvedColor = () => normalizeSliderColor(field.color() ?? local.color)
  const resolvedSize = () => normalizeSliderSize(field.size() ?? local.size)
  const resolvedOrientation = () => normalizeSliderOrientation(local.orientation)
  const resolvedHighlight = () => field.highlight() ?? local.highlight
  const disabled = () => field.disabled()
  const kobalteValue = createMemo(() => normalizeSliderValues(local.value, local.min!))
  const kobalteDefaultValue = createMemo(() =>
    normalizeSliderValues(local.defaultValue, local.min!),
  )
  const [uncontrolledValues, setUncontrolledValues] = createSignal<number[]>([0])

  const thumbValues = () => kobalteValue() ?? kobalteDefaultValue() ?? [local.min!]
  const thumbIndexes = () => Array.from({ length: thumbValues().length }, (_, index) => index)

  createEffect(() => {
    if (local.value !== undefined) {
      return
    }

    const initial = kobalteDefaultValue() ?? [local.min!]
    setUncontrolledValues(initial)
  })

  function inputIdForIndex(index: number): string {
    if (index === 0) {
      return inputId()
    }

    return `${inputId()}-${index + 1}`
  }

  function toPublicValue(values: number[]): SliderValue {
    if (Array.isArray(local.value) || Array.isArray(local.defaultValue)) {
      return [...values]
    }

    return values[0] ?? local.min!
  }

  function resolveThumbPercent(index: number): number {
    const range = local.max! - local.min!

    if (range <= 0) {
      return 0
    }

    const visualValues = kobalteValue() ?? uncontrolledValues()
    const nextValue = visualValues[index] ?? local.min!
    const percent = ((nextValue - local.min!) / range) * 100

    if (!Number.isFinite(percent)) {
      return 0
    }

    return Math.max(0, Math.min(100, percent))
  }

  function thumbStyle(index: number): JSX.CSSProperties {
    const percent = resolveThumbPercent(index)
    const orientation = resolvedOrientation()

    if (orientation === 'vertical') {
      const startEdge = local.inverted ? 'top' : 'bottom'
      const transform = local.inverted ? 'translateY(-50%)' : 'translateY(50%)'

      return {
        [startEdge]: `calc(${percent}%)`,
        transform,
      } as JSX.CSSProperties
    }

    const startEdge = local.inverted ? 'right' : 'left'
    const transform = local.inverted ? 'translateX(50%)' : 'translateX(-50%)'

    return {
      [startEdge]: `calc(${percent}%)`,
      transform,
    } as JSX.CSSProperties
  }

  function onValueChange(values: number[]): void {
    if (local.value === undefined) {
      setUncontrolledValues([...values])
    }

    local.onValueChange?.(toPublicValue(values))
    field.emitFormInput()
  }

  function onChange(values: number[]): void {
    local.onChange?.(toPublicValue(values))
    field.emitFormChange()
  }

  return (
    <KobalteSlider.Root
      as={local.as}
      id={`${inputId()}-root`}
      name={field.name()}
      value={kobalteValue()}
      defaultValue={kobalteDefaultValue()}
      minValue={local.min!}
      maxValue={local.max!}
      step={local.step}
      minStepsBetweenThumbs={local.minStepsBetweenThumbs}
      orientation={resolvedOrientation()}
      inverted={local.inverted}
      required={local.required}
      disabled={disabled()}
      readOnly={local.readOnly}
      onChange={onValueChange}
      onChangeEnd={onChange}
      data-slot="root"
      class={sliderRootVariants(
        {
          color: resolvedColor(),
          size: resolvedSize(),
          orientation: resolvedOrientation(),
          highlight: resolvedHighlight(),
          disabled: disabled(),
        },
        local.classes?.root,
      )}
      {...rest}
    >
      <KobalteSlider.Track
        data-slot="track"
        class={sliderTrackVariants(
          {
            color: resolvedColor(),
            size: resolvedSize(),
            orientation: resolvedOrientation(),
            highlight: resolvedHighlight(),
            disabled: disabled(),
          },
          local.classes?.track,
        )}
      >
        <KobalteSlider.Fill
          data-slot="range"
          class={sliderRangeVariants(
            {
              color: resolvedColor(),
              size: resolvedSize(),
              orientation: resolvedOrientation(),
              highlight: resolvedHighlight(),
              disabled: disabled(),
            },
            local.classes?.range,
          )}
        />
      </KobalteSlider.Track>

      <For each={thumbIndexes()}>
        {(thumbIndex) => (
          <KobalteSlider.Thumb
            data-slot="thumb"
            aria-label={createThumbAriaLabel(thumbIndex, thumbValues().length)}
            style={thumbStyle(thumbIndex)}
            class={sliderThumbVariants(
              {
                color: resolvedColor(),
                size: resolvedSize(),
                orientation: resolvedOrientation(),
                highlight: resolvedHighlight(),
                disabled: disabled(),
              },
              local.classes?.thumb,
            )}
            onFocus={() => field.emitFormFocus()}
            onBlur={() => field.emitFormBlur()}
          >
            <KobalteSlider.Input
              id={inputIdForIndex(thumbIndex)}
              data-slot="input"
              class={sliderInputVariants(
                {
                  color: resolvedColor(),
                  size: resolvedSize(),
                  orientation: resolvedOrientation(),
                  highlight: resolvedHighlight(),
                  disabled: disabled(),
                },
                local.classes?.input,
              )}
              {...(field.ariaAttrs() ?? {})}
            />
          </KobalteSlider.Thumb>
        )}
      </For>
    </KobalteSlider.Root>
  )
}
