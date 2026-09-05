import type { JSX } from 'solid-js'
import { createMemo, For, mergeProps, onMount, Show, splitProps } from 'solid-js'

import { HiddenInput } from '../../shared/hidden-input.tsx'
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.ts'

import { useSlider } from './hook/index.ts'
import type { SliderVariantProps } from './slider.class.ts'
import { sliderRecipe, sliderStyleVars } from './slider.class.ts'

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
  export type Props<TValue = Value> = BaseProps<'div', Base<TValue>, Variant, Classes, Styles>
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

  const config = useMoraineConfig()
  const provider = () => config().slider

  const merged = mergeProps(
    {
      min: 0,
      max: 100,
      minStepsBetweenThumbs: 0,
      allowThumbCrossing: true,
      orientation: 'horizontal' as const,
      inverted: false,
      variant: 'default' as const,
    },
    () => provider()?.variants,
    local,
  )

  const generatedId = useId(() => merged.id, 'slider')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size ?? undefined,
      disabled: merged.disabled,
      required: local.required,
      readOnly: Boolean(merged.readOnly),
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
    }),
  )

  const styleVars = createMemo(() =>
    sliderStyleVars({
      size: field.size(),
      variant: merged.variant,
    }),
  )

  const slider = useSlider<TValue>(merged as any, {
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

  const slots = createMemo(() =>
    sliderRecipe({
      orientation: merged.orientation,
      size: field.size(),
      variant: merged.variant,
      inverted: merged.inverted,
      multiple: slider.currentValues().length > 1,
    }),
  )

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
    },
    get baseStyle() {
      return styleVars()
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
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
      data-dragging={slider.dragging() ? '' : undefined}
      data-disabled={field.disabled() ? '' : undefined}
      data-invalid={field.invalid() ? '' : undefined}
      data-readonly={merged.readOnly ? '' : undefined}
      data-required={field.required() ? '' : undefined}
      {...field.ariaAttrs()}
      {...resolved.rootClassAndStyle()}
      {...rest}
    >
      <div
        ref={(element) => {
          slider.setTrackRef(element)
        }}
        data-slot="track"
        data-orientation={merged.orientation}
        {...resolved.slotClassAndStyle('track')}
        onPointerDown={slider.onTrackPointerDown}
        onPointerMove={slider.onTrackPointerMove}
        onPointerUp={slider.onTrackPointerUp}
        onPointerCancel={slider.onPointerCancel}
        onLostPointerCapture={slider.onPointerCancel}
      >
        <div
          data-slot="range"
          data-orientation={merged.orientation}
          data-dragging={slider.dragging() ? '' : undefined}
          style={{
            ...slider.rangeStyle(),
            ...resolved.slotStyle('range'),
          }}
          class={resolved.slotClass('range')}
        />

        <Show when={merged.divider}>
          <For each={slider.dividerIndexes()}>
            {(dividerIndex) => (
              <div
                data-slot="divider"
                data-orientation={merged.orientation}
                style={{
                  ...slider.getDividerStyle(dividerIndex),
                  ...resolved.slotStyle('divider'),
                }}
                class={resolved.slotClass('divider')}
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
            data-dragging={
              slider.dragging() && slider.activeThumbIndexState() === thumbIndex ? '' : undefined
            }
            data-disabled={field.disabled() ? '' : undefined}
            data-invalid={field.invalid() ? '' : undefined}
            data-readonly={merged.readOnly ? '' : undefined}
            data-required={field.required() ? '' : undefined}
            role="slider"
            tabIndex={field.disabled() ? undefined : 0}
            style={{
              ...slider.thumbStyles()[thumbIndex],
              ...resolved.slotStyle('thumb'),
            }}
            class={resolved.slotClass('thumb')}
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

      {rest.children as JSX.Element}
    </div>
  )
}
