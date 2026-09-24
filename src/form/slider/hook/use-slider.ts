import type { JSX, Setter } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  onMount,
} from 'solid-js'

import { useControllableValue } from '../../../shared/use-controllable-value.ts'
import type { Orientation } from '../../../theme/style/style-types.ts'
import type { SliderT } from '../slider.types'
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
} from '../utils'
import type { SliderValue } from '../utils'

export type UseSliderProps<TValue extends SliderValue = SliderValue> = {
  allowThumbCrossing?: boolean
  defaultValue?: TValue
  divider?: boolean
  inverted?: boolean
  max?: number
  min?: number
  minStepsBetweenThumbs?: number
  orientation?: Orientation
  readOnly?: boolean
  step?: number
  styles?: { mark?: JSX.CSSProperties }
  value?: TValue
  variant?: SliderT.Variant['variant'] | null
}

export type UseSliderOptions<TValue extends SliderValue = SliderValue> = {
  disabled?: () => boolean | undefined
  onBlur?: (event: FocusEvent) => void
  onFocus?: (event: FocusEvent) => void
  onValueCommit?: (value: TValue) => void
  onValueInput?: (value: TValue) => void
}

export type UseSliderReturn<TValue extends SliderValue = SliderValue> = {
  activeThumbIndexState: () => number | undefined
  currentValues: () => number[]
  definedStep: () => number | undefined
  dividerIndexes: () => number[]
  dragging: () => boolean
  getDividerStyle: (index: number) => JSX.CSSProperties
  getPublicValue: (values: number[]) => TValue
  getThumbMaxValue: (index: number) => number
  getThumbMinValue: (index: number) => number
  getThumbValueText: (index: number) => string
  onPointerCancel: (event: PointerEvent) => void
  onThumbBlur: (event: FocusEvent) => void
  onThumbFocus: (index: number, event: FocusEvent) => void
  onThumbKeyDown: (index: number, event: KeyboardEvent) => void
  onThumbKeyUp: (event: KeyboardEvent) => void
  onThumbPointerDown: (index: number, event: PointerEvent) => void
  onThumbPointerMove: (event: PointerEvent) => void
  onThumbPointerUp: (event: PointerEvent) => void
  onTrackPointerDown: (event: PointerEvent) => void
  onTrackPointerMove: (event: PointerEvent) => void
  onTrackPointerUp: (event: PointerEvent) => void
  rangeStyle: () => JSX.CSSProperties
  resetValues: (values?: number[]) => void
  setThumbRefs: Setter<Array<HTMLDivElement | undefined>>
  setTrackRef: (element: HTMLDivElement | undefined) => void
  thumbStyles: () => JSX.CSSProperties[]
}

export function useSlider<TValue extends SliderValue = SliderValue>(
  rawProps: UseSliderProps<TValue>,
  options: UseSliderOptions<TValue> = {},
): UseSliderReturn<TValue> {
  const merged = mergeProps(
    {
      min: 0,
      max: 100,
      minStepsBetweenThumbs: 0,
      allowThumbCrossing: true,
      orientation: 'horizontal' as const,
      inverted: false,
    },
    rawProps,
  )
  const normalizeValues = (value: SliderValue | undefined) =>
    normalizeSliderValues(value, merged.min, merged.min, merged.max)
  const getInitialValues = () => normalizeValues(merged.defaultValue) ?? [merged.min]
  const [currentValues, setCurrentValues] = useControllableValue<number[]>({
    value: () => normalizeValues(merged.value),
    defaultValue: getInitialValues,
  })

  const [dragging, setDragging] = createSignal(false)
  const definedStep = createMemo(() =>
    typeof merged.step === 'number' && merged.step > 0 ? merged.step : undefined,
  )
  const keyboardStep = createMemo(() => {
    const range = merged.max - merged.min
    return definedStep() ?? (range > 0 ? range / 100 : 1)
  })
  const pageSize = createMemo(() => {
    let calcPageSize = (merged.max - merged.min) / 10
    const step = definedStep()
    if (!step) {
      return calcPageSize
    }

    calcPageSize = snapValueToStep(calcPageSize, 0, calcPageSize + step, step)
    return Math.max(calcPageSize, step)
  })
  const [thumbRefs, setThumbRefs] = createSignal<Array<HTMLDivElement | undefined>>([])
  const [trackElement, setTrackElement] = createSignal<HTMLDivElement | undefined>(undefined)
  const [direction, setDirection] = createSignal<'ltr' | 'rtl'>('ltr')
  const [activeThumbIndexState, setActiveThumbIndexState] = createSignal<number | undefined>(
    undefined,
  )
  let pendingValues: number[] | undefined
  let activePointerId: number | undefined
  let activePointerTarget: HTMLDivElement | undefined
  let activeThumbIndex: number | undefined
  let lastUsedThumbIndex: number | undefined
  let lastPointerPosition = 0
  let suppressNextBlurCommit = false

  function setActiveThumbIndex(index: number | undefined): void {
    activeThumbIndex = index
    if (index !== undefined) {
      lastUsedThumbIndex = index
    }
    setActiveThumbIndexState(index)
  }

  function resolveDirection(track = trackElement()): 'ltr' | 'rtl' {
    const ownerDocument = track?.ownerDocument
    const localDirection = track?.closest<HTMLElement>('[dir]')?.getAttribute('dir')
    if (localDirection === 'ltr' || localDirection === 'rtl') {
      return localDirection
    }

    const direction = track && ownerDocument?.defaultView?.getComputedStyle(track).direction
    if (direction === 'ltr' || direction === 'rtl') {
      return direction
    }

    return (ownerDocument?.dir || ownerDocument?.documentElement?.dir || 'ltr') === 'rtl'
      ? 'rtl'
      : 'ltr'
  }

  function setTrackRef(element: HTMLDivElement | undefined): void {
    setTrackElement(element)
    setDirection(resolveDirection(element))
  }

  onMount(() => {
    setDirection(resolveDirection())
  })

  const getSliderEdges = createMemo(() =>
    resolveSliderEdges(merged.orientation, merged.inverted, direction() === 'rtl'),
  )
  const isActionDisabled = createMemo(() => options.disabled?.() || merged.readOnly)
  const interactionValues = () => pendingValues ?? currentValues()
  const thumbStyles = createMemo<JSX.CSSProperties[]>(() => {
    const { startEdge } = getSliderEdges()

    return currentValues().map((value) => ({
      [startEdge]: `${getValuePercent(value) * 100}%`,
    }))
  })
  const dividerIndexes = createMemo(() => {
    const step = definedStep()
    if (!step || merged.max <= merged.min) {
      return []
    }

    const dividerCount = Math.floor((merged.max - merged.min) / step)
    return Array.from({ length: Math.max(dividerCount - 1, 0) }, (_, index) => index + 1)
  })
  const getDividerStyle = (index: number): JSX.CSSProperties => {
    const { startEdge } = getSliderEdges()
    const value = merged.min + keyboardStep() * index

    return {
      [startEdge]: `${getValuePercent(value) * 100}%`,
      ...merged.styles?.mark,
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

  const controlledValueSnapshot = () => {
    const value = merged.value
    return Array.isArray(value) ? value.slice() : value
  }

  createEffect(
    on([controlledValueSnapshot, () => merged.min, () => merged.max], ([value, min, max]) => {
      const controlled = normalizeSliderValues(value, min, min, max)
      if (controlled !== undefined) {
        pendingValues = undefined
      }
    }),
  )

  createEffect(
    on(
      [() => merged.value, currentValues, () => merged.min, () => merged.max],
      ([value, displayed, min, max]) => {
        if (value !== undefined) {
          return
        }
        const normalized = normalizeSliderValues(displayed, min, min, max) ?? [min]
        if (!areValuesEqual(displayed, normalized)) {
          setCurrentValues(normalized)
        }
      },
    ),
  )

  onCleanup(() => {
    if (activePointerId !== undefined && activePointerTarget?.hasPointerCapture(activePointerId)) {
      activePointerTarget.releasePointerCapture(activePointerId)
    }

    activePointerId = undefined
    activePointerTarget = undefined
    pendingValues = undefined
  })

  function resetValues(values?: number[]): void {
    pendingValues = undefined
    setCurrentValues([...(values ?? getInitialValues())])
  }

  function areValuesEqual(left: number[], right: number[]): boolean {
    return (
      left.length === right.length && left.every((value, index) => Object.is(value, right[index]))
    )
  }

  function getPublicValue(values: number[]): TValue {
    if (Array.isArray(merged.value) || Array.isArray(merged.defaultValue)) {
      return [...values] as TValue
    }

    return (values[0] ?? merged.min) as TValue
  }

  function getThumbMinValueFor(values: number[], index: number): number {
    const thumbGap = merged.minStepsBetweenThumbs * keyboardStep()
    return index === 0
      ? merged.min
      : clamp((values[index - 1] ?? merged.min) + thumbGap, merged.min, merged.max)
  }

  function getThumbMaxValueFor(values: number[], index: number): number {
    const thumbGap = merged.minStepsBetweenThumbs * keyboardStep()
    return index === values.length - 1
      ? merged.max
      : clamp((values[index + 1] ?? merged.max) - thumbGap, merged.min, merged.max)
  }

  function getThumbMinValue(index: number): number {
    return getThumbMinValueFor(currentValues(), index)
  }

  function getThumbMaxValue(index: number): number {
    return getThumbMaxValueFor(currentValues(), index)
  }

  function getValueFromPointer(pointerPosition: number): number {
    const rect = trackElement()?.getBoundingClientRect()
    if (!rect) {
      return merged.min
    }

    const orientation = merged.orientation
    const input: [number, number] = [0, orientation === 'vertical' ? rect.height : rect.width]

    let output: [number, number] =
      orientation === 'vertical'
        ? merged.inverted
          ? [merged.min, merged.max]
          : [merged.max, merged.min]
        : getSliderEdges().startEdge === 'left'
          ? [merged.min, merged.max]
          : [merged.max, merged.min]

    const value = linearScale(input, output)
    const offset = orientation === 'vertical' ? rect.top : rect.left

    return clamp(value(pointerPosition - offset), merged.min, merged.max)
  }

  function startInteraction(index: number, event: PointerEvent): boolean {
    if (activePointerId !== undefined && activePointerId !== event.pointerId) {
      return false
    }

    const target = event.currentTarget as HTMLDivElement

    activePointerId = event.pointerId
    activePointerTarget = target
    setActiveThumbIndex(index)
    lastPointerPosition = merged.orientation === 'vertical' ? event.clientY : event.clientX
    pendingValues = undefined
    setDragging(true)

    target.setPointerCapture(event.pointerId)
    event.preventDefault()
    event.stopPropagation()
    return true
  }

  function commitPendingValues(): void {
    if (!pendingValues) {
      return
    }

    options.onValueCommit?.(getPublicValue(pendingValues))
    pendingValues = undefined
  }

  function finishInteraction(event: PointerEvent, target: HTMLDivElement): void {
    if (activePointerId !== event.pointerId) {
      return
    }

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId)
    }

    activePointerId = undefined
    activePointerTarget = undefined
    setActiveThumbIndex(undefined)
    lastPointerPosition = 0
    setDragging(false)
    commitPendingValues()
  }

  function getResolvedThumbValues(
    values: number[],
    index: number,
    candidateValue: number,
  ): { nextIndex: number; nextValues: number[] } | undefined {
    const allowsThumbCrossing = merged.allowThumbCrossing && merged.minStepsBetweenThumbs === 0
    const minValue = allowsThumbCrossing ? merged.min : getThumbMinValueFor(values, index)
    const maxValue = allowsThumbCrossing ? merged.max : getThumbMaxValueFor(values, index)
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
          merged.minStepsBetweenThumbs * keyboardStep(),
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

    if (areValuesEqual(interactionValues(), nextValues)) {
      return nextIndex
    }

    pendingValues = nextValues
    setCurrentValues(nextValues)

    options.onValueInput?.(getPublicValue(nextValues))

    return nextIndex
  }

  function focusThumb(index: number): void {
    const thumb = thumbRefs()[index]
    if (!thumb || thumb.ownerDocument.activeElement === thumb) {
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

  function getClosestThumbIndex(values: number[], pointerValue: number): number {
    // Match established slider behavior: when stacked thumbs are equally close,
    // keep manipulating the thumb the user most recently focused or dragged.
    const closestIndex = getClosestValueIndex(values, pointerValue)
    if (lastUsedThumbIndex === undefined || values.length < 2) {
      return closestIndex
    }

    const closestDistance = Math.abs((values[closestIndex] ?? pointerValue) - pointerValue)
    const lastUsedDistance = Math.abs((values[lastUsedThumbIndex] ?? pointerValue) - pointerValue)
    return lastUsedDistance === closestDistance ? lastUsedThumbIndex : closestIndex
  }

  function handlePointerMove(event: PointerEvent): void {
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

  function onTrackPointerDown(event: PointerEvent): void {
    if (isActionDisabled() || event.button !== 0) {
      return
    }

    const pointerPosition = merged.orientation === 'vertical' ? event.clientY : event.clientX
    const pointerValue = getValueFromPointer(pointerPosition)
    const nextActiveThumbIndex = getClosestThumbIndex(interactionValues(), pointerValue)
    if (!startInteraction(nextActiveThumbIndex, event)) {
      return
    }
    applyThumbValue(nextActiveThumbIndex, pointerValue)
    focusThumb(nextActiveThumbIndex)
  }

  function onTrackPointerMove(event: PointerEvent): void {
    handlePointerMove(event)
  }

  function onTrackPointerUp(event: PointerEvent): void {
    const target = event.currentTarget as HTMLDivElement
    finishInteraction(event, target)
  }

  function onPointerCancel(event: PointerEvent): void {
    const target = event.currentTarget as HTMLDivElement
    finishInteraction(event, target)
  }

  function onThumbPointerDown(index: number, event: PointerEvent): void {
    if (isActionDisabled() || event.button !== 0) {
      return
    }

    if (!startInteraction(index, event)) {
      return
    }
    const target = event.currentTarget as HTMLDivElement
    if (merged.variant === 'bold') {
      target.blur()
      return
    }

    target.focus()
  }

  function onThumbPointerMove(event: PointerEvent): void {
    handlePointerMove(event)
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
    const isLTR = () => direction() === 'ltr'

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
      applyThumbValue(index, getThumbMinValueFor(interactionValues(), index))
      return
    }

    if (key === 'End') {
      applyThumbValue(index, getThumbMaxValueFor(interactionValues(), index))
      return
    }

    let movementDirection = 0
    if (isPageUp) {
      movementDirection = 1
    } else if (isPageDown) {
      movementDirection = -1
    } else if (merged.orientation === 'vertical') {
      if (key === 'ArrowDown' || key === 'Down') {
        movementDirection = merged.inverted ? 1 : -1
      } else if (key === 'ArrowUp' || key === 'Up') {
        movementDirection = merged.inverted ? -1 : 1
      } else if (isIncrementKey) {
        movementDirection = isLTR() ? 1 : -1
      } else if (isDecrementKey) {
        movementDirection = isLTR() ? -1 : 1
      }
    } else if (isIncrementKey) {
      movementDirection = isLTR() ? 1 : -1
    } else if (isDecrementKey) {
      movementDirection = isLTR() ? -1 : 1
    }

    const stepSize = isPageUp || isPageDown || event.shiftKey ? pageSize() : keyboardStep()

    const oldValue = interactionValues()[index] ?? merged.min
    const candidateValue = oldValue + movementDirection * stepSize
    applyThumbValue(index, candidateValue)
    const newValue = interactionValues()[index] ?? merged.min

    if (!merged.allowThumbCrossing && interactionValues().length > 1 && newValue === oldValue) {
      const atGlobalBoundary =
        (movementDirection > 0 && oldValue === merged.max) ||
        (movementDirection < 0 && oldValue === merged.min)
      if (!atGlobalBoundary) {
        const adjacentIndex = movementDirection > 0 ? index + 1 : index - 1
        if (adjacentIndex >= 0 && adjacentIndex < interactionValues().length) {
          focusThumb(adjacentIndex)
        }
      }
    }
  }

  function isThumbTarget(target: EventTarget | null): boolean {
    return thumbRefs().some((thumb) => {
      const Node = thumb?.ownerDocument.defaultView?.Node
      return Node !== undefined && target instanceof Node && thumb?.contains(target)
    })
  }

  function onThumbFocus(index: number, event: FocusEvent): void {
    lastUsedThumbIndex = index
    if (!isThumbTarget(event.relatedTarget)) {
      options.onFocus?.(event)
    }
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

    if (!isNavigationKey) {
      return
    }

    commitPendingValues()
  }

  function onThumbBlur(event: FocusEvent): void {
    if (isThumbTarget(event.relatedTarget)) {
      suppressNextBlurCommit = false
      return
    }

    if (suppressNextBlurCommit) {
      suppressNextBlurCommit = false
    } else {
      commitPendingValues()
    }

    options.onBlur?.(event)
  }

  function getValuePercent(value: number): number {
    const range = merged.max - merged.min
    if (range <= 0) {
      return 0
    }

    return (value - merged.min) / range
  }

  function getThumbValueText(index: number): string {
    const values = currentValues()
    const value = values[index] ?? merged.min
    if (values.length === 2) {
      return `${value} ${index === 0 ? 'start' : 'end'} range`
    }
    if (values.length > 2) {
      return `${value} thumb ${index + 1} of ${values.length}`
    }

    return String(value)
  }

  return {
    activeThumbIndexState,
    currentValues,
    definedStep,
    dividerIndexes,
    dragging,
    getDividerStyle,
    getPublicValue,
    getThumbMaxValue,
    getThumbMinValue,
    getThumbValueText,
    onThumbBlur,
    onThumbFocus,
    onThumbKeyDown,
    onThumbKeyUp,
    onPointerCancel,
    onThumbPointerDown,
    onThumbPointerMove,
    onThumbPointerUp,
    onTrackPointerDown,
    onTrackPointerMove,
    onTrackPointerUp,
    rangeStyle,
    resetValues,
    setThumbRefs,
    setTrackRef,
    thumbStyles,
  }
}
