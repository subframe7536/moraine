import type { JSX } from 'solid-js'
import { For, createEffect, createMemo, createSignal, mergeProps, onMount } from 'solid-js'

import { HiddenInput } from '../../shared/hidden-input'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useId, cn } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'

import type { SliderVariantProps } from './slider.class'
import {
  sliderDividerVariants,
  sliderRangeVariants,
  sliderRootVariants,
  sliderThumbVariants,
  sliderTrackVariants,
} from './slider.class'
import {
  clamp,
  getClosestValueIndex,
  getNextSortedValues,
  hasMinStepsBetweenValues,
  linearScale,
  moveSortedValue,
  normalizeSliderValues,
  resolveSliderEdges,
  snapValueToStep,
} from './utils'

export namespace SliderT {
  export type Value = number | number[]

  export interface Slot<T = unknown> {
    /** Slider container that owns track, range, thumbs, and labels. */
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
  export type Extend = never

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
     * Whether to show visual step dividers on the track.
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
  export interface Props<TValue = Value> extends BaseProps<
    Base<TValue>,
    Variant,
    Extend,
    Classes,
    Styles
  > {}
}

/**
 * Props for the Slider component.
 */
export interface SliderProps<TValue = SliderT.Value> extends SliderT.Props<TValue> {}

/** Range slider component with single or multi-thumb support and step markers. */
export function Slider<TValue extends SliderT.Value = SliderT.Value>(
  props: SliderProps<TValue>,
): JSX.Element {
  const merged = mergeProps(
    {
      min: 0,
      max: 100,
      minStepsBetweenThumbs: 0,
      allowThumbCrossing: true,
      orientation: 'horizontal' as const,
      size: 'md' as const,
    },
    props,
  )

  const generatedId = useId(() => merged.id, 'slider')
  const [displayValues, setDisplayValues] = createSignal<number[]>([])
  const getControlledValues = () => normalizeSliderValues(merged.value, merged.min!)

  const [dragging, setDragging] = createSignal(false)
  const definedStep = createMemo(() =>
    typeof merged.step === 'number' && merged.step > 0 ? merged.step : undefined,
  )
  const keyboardStep = createMemo(() => {
    const range = merged.max! - merged.min!
    return definedStep() ?? (range > 0 ? range / 100 : 1)
  })
  const pageSize = createMemo(() => {
    let calcPageSize = (merged.max! - merged.min!) / 10
    const step = definedStep()
    if (!step) {
      return calcPageSize
    }

    calcPageSize = snapValueToStep(calcPageSize, 0, calcPageSize + step, step)
    return Math.max(calcPageSize, step)
  })
  const [thumbRefs, setThumbRefs] = createSignal<Array<HTMLDivElement | undefined>>([])
  const [trackElement, setTrackElementState] = createSignal<HTMLDivElement | undefined>(undefined)
  const [activeThumbIndexState, setActiveThumbIndexState] = createSignal<number | undefined>(
    undefined,
  )
  let pendingValues: number[] | undefined
  let activePointerId: number | undefined
  let activeThumbIndex: number | undefined
  let lastPointerPosition = 0
  let suppressNextBlurCommit = false

  function setActiveThumbIndex(index: number | undefined): void {
    activeThumbIndex = index
    setActiveThumbIndexState(index)
  }

  const isRTL = () =>
    typeof document === 'undefined'
      ? false
      : (document.dir || document.documentElement.dir || 'ltr') === 'rtl'

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

  const getSliderEdges = createMemo(() =>
    resolveSliderEdges(merged.orientation, Boolean(merged.inverted), isRTL()),
  )
  const isActionDisabled = createMemo(() => field.disabled() || merged.readOnly)
  const currentValues = createMemo(() => getControlledValues() ?? displayValues())
  const interactionValues = () => pendingValues ?? currentValues()
  const dataAttrs = createMemo(() => ({
    'data-disabled': field.disabled() ? '' : undefined,
    'data-invalid': field.invalid() ? '' : undefined,
    'data-readonly': merged.readOnly ? '' : undefined,
    'data-required': merged.required ? '' : undefined,
  }))
  const thumbStyles = createMemo<JSX.CSSProperties[]>(() => {
    const { startEdge } = getSliderEdges()

    return currentValues().map((value) => ({
      [startEdge]: `${getValuePercent(value) * 100}%`,
    }))
  })
  const dividerIndexes = createMemo(() => {
    const step = definedStep()
    if (!merged.divider || !step || merged.max! <= merged.min!) {
      return []
    }

    const dividerCount = Math.floor((merged.max! - merged.min!) / step)
    return Array.from({ length: Math.max(dividerCount - 1, 0) }, (_, index) => index + 1)
  })
  const getDividerStyle = (index: number): JSX.CSSProperties => {
    const { startEdge } = getSliderEdges()
    const value = merged.min! + keyboardStep() * index

    return {
      [startEdge]: `${getValuePercent(value) * 100}%`,
      ...merged.styles?.divider,
    }
  }
  const rangeStyle = createMemo<JSX.CSSProperties>(() => {
    const percentages = currentValues().map((value) => getValuePercent(value) * 100)
    const offsetStart = currentValues().length > 1 ? Math.min(...percentages) : 0
    const offsetEnd = 100 - Math.max(...percentages)
    const { startEdge, endEdge } = getSliderEdges()

    return {
      [startEdge]: `${offsetStart}%`,
      [endEdge]: `${offsetEnd}%`,
    }
  })

  onMount(() => {
    const initialValue = normalizeSliderValues(props.defaultValue, props.min ?? 0) ?? [
      props.min ?? 0,
    ]

    if (getControlledValues() === undefined) {
      setDisplayValues(initialValue)
    }

    if (field.value() === undefined) {
      field.setFormValue(toPublicValue(initialValue))
    }
  })

  createEffect(() => {
    const nextControlledValues = getControlledValues()
    if (nextControlledValues !== undefined) {
      setDisplayValues(nextControlledValues)
    }
  })

  function toPublicValue(values: number[]): TValue {
    if (Array.isArray(merged.value) || Array.isArray(merged.defaultValue)) {
      return [...values] as TValue
    }

    return (values[0] ?? merged.min!) as TValue
  }

  function getThumbMinValue(values: number[], index: number): number {
    const thumbGap = merged.minStepsBetweenThumbs! * keyboardStep()
    return index === 0
      ? merged.min!
      : clamp((values[index - 1] ?? merged.min!) + thumbGap, merged.min!, merged.max!)
  }

  function getThumbMaxValue(values: number[], index: number): number {
    const thumbGap = merged.minStepsBetweenThumbs! * keyboardStep()
    return index === values.length - 1
      ? merged.max!
      : clamp((values[index + 1] ?? merged.max!) - thumbGap, merged.min!, merged.max!)
  }

  function getValueFromPointer(pointerPosition: number): number {
    const rect = trackElement()?.getBoundingClientRect()
    if (!rect) {
      return merged.min!
    }

    const orientation = merged.orientation
    const input: [number, number] = [0, orientation === 'vertical' ? rect.height : rect.width]

    let output: [number, number] =
      orientation === 'vertical'
        ? merged.inverted
          ? [merged.min!, merged.max!]
          : [merged.max!, merged.min!]
        : merged.inverted
          ? [merged.max!, merged.min!]
          : [merged.min!, merged.max!]

    const value = linearScale(input, output)
    const offset = orientation === 'vertical' ? rect.top : rect.left

    return clamp(value(pointerPosition - offset), merged.min!, merged.max!)
  }

  function startInteraction(index: number, event: PointerEvent): void {
    const target = event.currentTarget as HTMLDivElement

    activePointerId = event.pointerId
    setActiveThumbIndex(index)
    lastPointerPosition = merged.orientation === 'vertical' ? event.clientY : event.clientX
    pendingValues = undefined
    setDragging(true)

    target.setPointerCapture(event.pointerId)
    event.preventDefault()
    event.stopPropagation()
  }

  function finishInteraction(event: PointerEvent, target: HTMLDivElement): void {
    if (activePointerId !== event.pointerId) {
      return
    }

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId)
    }

    activePointerId = undefined
    setActiveThumbIndex(undefined)
    lastPointerPosition = 0
    setDragging(false)

    if (!pendingValues) {
      return
    }

    const nextValue = toPublicValue(pendingValues)
    field.setFormValue(nextValue)
    merged.onChange?.(nextValue)
    field.emit('change')
    pendingValues = undefined
  }

  function getResolvedThumbValues(
    values: number[],
    index: number,
    candidateValue: number,
  ): { nextIndex: number; nextValues: number[] } | undefined {
    const allowsThumbCrossing = merged.allowThumbCrossing && merged.minStepsBetweenThumbs === 0
    const minValue = allowsThumbCrossing ? merged.min! : getThumbMinValue(values, index)
    const maxValue = allowsThumbCrossing ? merged.max! : getThumbMaxValue(values, index)
    const step = definedStep()
    const nextValue = step
      ? snapValueToStep(candidateValue, minValue, maxValue, step)
      : clamp(candidateValue, minValue, maxValue)

    let nextValues: number[]
    let nextIndex = index

    if (allowsThumbCrossing) {
      const movedValue = moveSortedValue(values, nextValue, index)
      nextValues = movedValue.nextValues
      nextIndex = movedValue.nextIndex
    } else {
      nextValues = [...values]
      nextValues[index] = nextValue

      if (
        !hasMinStepsBetweenValues(
          getNextSortedValues(values, nextValue, index),
          merged.minStepsBetweenThumbs! * keyboardStep(),
        )
      ) {
        return undefined
      }
    }

    return { nextIndex, nextValues }
  }

  function applyThumbValue(index: number, candidateValue: number): number | undefined {
    if (isActionDisabled()) {
      return undefined
    }

    const resolvedValues = getResolvedThumbValues(interactionValues(), index, candidateValue)
    if (!resolvedValues) {
      return undefined
    }

    const { nextIndex, nextValues } = resolvedValues

    pendingValues = nextValues
    setDisplayValues(nextValues)

    const publicValue = toPublicValue(nextValues)
    field.setFormValue(publicValue)
    merged.onValueChange?.(publicValue)
    field.emit('input')

    return nextIndex
  }

  function focusThumb(index: number): void {
    const thumb = thumbRefs()[index]
    if (!thumb || document.activeElement === thumb) {
      return
    }

    suppressNextBlurCommit = true
    thumb.focus()
  }

  function moveThumb(index: number, pointerValue: number): void {
    const nextIndex = applyThumbValue(index, pointerValue)

    if (nextIndex !== undefined && nextIndex !== index) {
      setActiveThumbIndex(nextIndex)
      focusThumb(nextIndex)
    }
  }

  function onTrackPointerDown(event: PointerEvent): void {
    if (isActionDisabled() || event.button !== 0) {
      return
    }

    const pointerPosition = merged.orientation === 'vertical' ? event.clientY : event.clientX
    const pointerValue = getValueFromPointer(pointerPosition)
    const nextActiveThumbIndex = getClosestValueIndex(interactionValues(), pointerValue)
    startInteraction(nextActiveThumbIndex, event)
    applyThumbValue(nextActiveThumbIndex, pointerValue)
  }

  function onTrackPointerMove(event: PointerEvent): void {
    if (isActionDisabled() || activePointerId !== event.pointerId) {
      return
    }

    const target = event.currentTarget as HTMLDivElement
    if (!target.hasPointerCapture(event.pointerId) || activeThumbIndex === undefined) {
      return
    }

    const pointerPosition = merged.orientation === 'vertical' ? event.clientY : event.clientX
    const delta = pointerPosition - lastPointerPosition
    if (delta === 0) {
      return
    }

    lastPointerPosition = pointerPosition

    moveThumb(activeThumbIndex, getValueFromPointer(pointerPosition))
  }

  function onTrackPointerUp(event: PointerEvent): void {
    const target = event.currentTarget as HTMLDivElement
    finishInteraction(event, target)
  }

  function onThumbPointerDown(index: number, event: PointerEvent): void {
    if (isActionDisabled() || event.button !== 0) {
      return
    }

    startInteraction(index, event)
    const target = event.currentTarget as HTMLDivElement
    if (merged.variant === 'bold') {
      target.blur()
      return
    }

    target.focus()
  }

  function onThumbPointerMove(event: PointerEvent): void {
    if (isActionDisabled() || activePointerId !== event.pointerId) {
      return
    }

    const target = event.currentTarget as HTMLDivElement
    if (!target.hasPointerCapture(event.pointerId) || activeThumbIndex === undefined) {
      return
    }

    const pointerPosition = merged.orientation === 'vertical' ? event.clientY : event.clientX
    const delta = pointerPosition - lastPointerPosition
    if (delta === 0) {
      return
    }

    lastPointerPosition = pointerPosition

    moveThumb(activeThumbIndex, getValueFromPointer(pointerPosition))
  }

  function onThumbPointerUp(event: PointerEvent): void {
    const target = event.currentTarget as HTMLDivElement
    finishInteraction(event, target)
  }

  function onThumbKeyDown(index: number, event: KeyboardEvent): void {
    if (isActionDisabled()) {
      return
    }

    const key = event.key === 'Spacebar' ? ' ' : event.key
    const isIncrementKey =
      key === 'ArrowRight' || key === 'ArrowUp' || key === 'Right' || key === 'Up'
    const isDecrementKey =
      key === 'ArrowLeft' || key === 'ArrowDown' || key === 'Left' || key === 'Down'
    const isPageUp = key === 'PageUp'
    const isPageDown = key === 'PageDown'
    const isLTR = () =>
      typeof document === 'undefined'
        ? true
        : (document.dir || document.documentElement.dir || 'ltr') !== 'rtl'

    if (
      !isIncrementKey &&
      !isDecrementKey &&
      key !== 'Home' &&
      key !== 'End' &&
      !isPageUp &&
      !isPageDown
    ) {
      return
    }

    event.preventDefault()

    if (key === 'Home') {
      applyThumbValue(index, getThumbMinValue(interactionValues(), index))
      return
    }

    if (key === 'End') {
      applyThumbValue(index, getThumbMaxValue(interactionValues(), index))
      return
    }

    let direction = 0
    if (isPageUp) {
      direction = 1
    } else if (isPageDown) {
      direction = -1
    } else if (merged.orientation === 'vertical') {
      if (key === 'ArrowDown' || key === 'Down') {
        direction = merged.inverted ? 1 : -1
      } else if (key === 'ArrowUp' || key === 'Up') {
        direction = merged.inverted ? -1 : 1
      } else if (isIncrementKey) {
        direction = isLTR() ? 1 : -1
      } else if (isDecrementKey) {
        direction = isLTR() ? -1 : 1
      }
    } else if (isIncrementKey) {
      direction = isLTR() ? 1 : -1
    } else if (isDecrementKey) {
      direction = isLTR() ? -1 : 1
    }

    const stepSize = isPageUp || isPageDown || event.shiftKey ? pageSize() : keyboardStep()

    const oldValue = interactionValues()[index] ?? merged.min!
    const candidateValue = oldValue + direction * stepSize
    applyThumbValue(index, candidateValue)
    const newValue = interactionValues()[index] ?? merged.min!

    if (!merged.allowThumbCrossing && interactionValues().length > 1 && newValue === oldValue) {
      const atGlobalBoundary =
        (direction > 0 && oldValue === merged.max!) || (direction < 0 && oldValue === merged.min!)
      if (!atGlobalBoundary) {
        const adjacentIndex = direction > 0 ? index + 1 : index - 1
        if (adjacentIndex >= 0 && adjacentIndex < interactionValues().length) {
          focusThumb(adjacentIndex)
        }
      }
    }
  }

  function onThumbFocus(): void {
    field.emit('focus')
  }

  function onThumbKeyUp(event: KeyboardEvent): void {
    if (isActionDisabled()) {
      return
    }

    const key = event.key === 'Spacebar' ? ' ' : event.key
    const isNavigationKey =
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowLeft' ||
      key === 'ArrowDown' ||
      key === 'Right' ||
      key === 'Up' ||
      key === 'Left' ||
      key === 'Down' ||
      key === 'Home' ||
      key === 'End' ||
      key === 'PageUp' ||
      key === 'PageDown'

    if (!isNavigationKey || !pendingValues) {
      return
    }

    const publicValue = toPublicValue(pendingValues)
    field.setFormValue(publicValue)
    merged.onChange?.(publicValue)
    field.emit('change')
    pendingValues = undefined
  }

  function onThumbBlur(): void {
    field.emit('blur')

    if (suppressNextBlurCommit) {
      suppressNextBlurCommit = false
      return
    }

    if (!pendingValues) {
      return
    }

    const publicValue = toPublicValue(pendingValues)
    field.setFormValue(publicValue)
    merged.onChange?.(publicValue)
    field.emit('change')
    pendingValues = undefined
  }

  function getValuePercent(value: number): number {
    const range = merged.max! - merged.min!
    if (range <= 0) {
      return 0
    }

    return (value - merged.min!) / range
  }

  function getThumbValueText(index: number): string {
    return String(currentValues()[index] ?? merged.min!)
  }

  return (
    <div
      id={`${field.id()}-root`}
      role="group"
      data-slot="root"
      data-orientation={merged.orientation}
      {...dataAttrs()}
      style={merged.styles?.root}
      class={sliderRootVariants(
        {
          size: field.size(),
          orientation: merged.orientation,
          variant: merged.variant,
        },
        field.disabled() && 'effect-dis',
        merged.classes?.root,
      )}
    >
      <div
        ref={(element) => {
          setTrackElementState(element)
        }}
        data-slot="track"
        data-orientation={merged.orientation}
        style={merged.styles?.track}
        class={cn(
          sliderTrackVariants(
            {
              size: field.size(),
              orientation: merged.orientation,
              variant: merged.variant,
            },
            merged.classes?.track,
          ),
        )}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={onTrackPointerUp}
      >
        <div
          data-slot="range"
          data-orientation={merged.orientation}
          style={{
            ...rangeStyle(),
            ...merged.styles?.range,
          }}
          class={cn(
            sliderRangeVariants(
              {
                orientation: merged.orientation,
                variant: merged.variant,
              },
              merged.classes?.range,
            ),
          )}
        />

        <For each={dividerIndexes()}>
          {(dividerIndex) => (
            <div
              data-slot="divider"
              data-orientation={merged.orientation}
              style={getDividerStyle(dividerIndex)}
              class={cn(
                sliderDividerVariants(
                  {
                    orientation: merged.orientation,
                  },
                  merged.classes?.divider,
                ),
              )}
            />
          )}
        </For>
      </div>

      <For each={Array.from({ length: currentValues().length }, (_, index) => index)}>
        {(thumbIndex) => (
          <div
            ref={(element) => {
              setThumbRefs((previous) => {
                const next = [...previous]
                next[thumbIndex] = element
                return next
              })
            }}
            data-slot="thumb"
            data-dragging={dragging() && activeThumbIndexState() === thumbIndex ? '' : undefined}
            {...dataAttrs()}
            role="slider"
            tabIndex={field.disabled() ? undefined : 0}
            style={{
              ...thumbStyles()[thumbIndex],
              ...merged.styles?.thumb,
            }}
            class={sliderThumbVariants(
              {
                inverted: Boolean(merged.inverted),
                orientation: merged.orientation,
                size: field.size(),
                variant: merged.variant,
              },
              merged.classes?.thumb,
            )}
            aria-valuemin={getThumbMinValue(currentValues(), thumbIndex)}
            aria-valuenow={currentValues()[thumbIndex] ?? merged.min!}
            aria-valuemax={getThumbMaxValue(currentValues(), thumbIndex)}
            aria-valuetext={getThumbValueText(thumbIndex)}
            aria-orientation={merged.orientation}
            aria-label={
              currentValues().length <= 1
                ? 'Thumb'
                : `Thumb ${thumbIndex + 1} of ${currentValues().length}`
            }
            aria-required={merged.required || undefined}
            aria-disabled={field.disabled() || undefined}
            aria-readonly={merged.readOnly || undefined}
            onPointerDown={(event) => {
              onThumbPointerDown(thumbIndex, event)
            }}
            onPointerMove={(event) => {
              onThumbPointerMove(event)
            }}
            onPointerUp={(event) => {
              onThumbPointerUp(event)
            }}
            onKeyDown={(event) => {
              onThumbKeyDown(thumbIndex, event)
            }}
            onKeyUp={onThumbKeyUp}
            onFocus={onThumbFocus}
            onBlur={onThumbBlur}
          >
            <HiddenInput
              type="range"
              id={field.id() + (thumbIndex === 0 ? '' : `-${thumbIndex + 1}`)}
              name={field.name()}
              min={getThumbMinValue(currentValues(), thumbIndex)}
              max={getThumbMaxValue(currentValues(), thumbIndex)}
              step={definedStep() ?? 'any'}
              value={currentValues()[thumbIndex] ?? merged.min!}
              required={merged.required}
              disabled={field.disabled()}
              readOnly={merged.readOnly}
              tabIndex={field.disabled() ? undefined : -1}
              aria-valuetext={getThumbValueText(thumbIndex)}
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
