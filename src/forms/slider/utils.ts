export type SliderOrientation = 'horizontal' | 'vertical'

export type SliderEdge = 'left' | 'right' | 'top' | 'bottom'

export type SliderValue = number | number[]

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getDecimalCount(value: number): number {
  return (String(value).split('.')[1] || '').length
}

function roundValue(value: number, decimalCount: number): number {
  const rounder = 10 ** decimalCount
  return Math.round(value * rounder) / rounder
}

export function snapValueToStep(value: number, min: number, max: number, step: number): number {
  const remainder = (value - (Number.isNaN(min) ? 0 : min)) % step
  let snappedValue =
    Math.abs(remainder) * 2 >= step
      ? value + Math.sign(remainder) * (step - Math.abs(remainder))
      : value - remainder

  if (!Number.isNaN(min)) {
    snappedValue = Number.isNaN(max) ? Math.max(snappedValue, min) : clamp(snappedValue, min, max)
  } else if (!Number.isNaN(max) && snappedValue > max) {
    snappedValue = Math.floor(max / step) * step
  }

  const precision = getDecimalCount(step)
  if (precision > 0) {
    snappedValue = roundValue(snappedValue, precision)
  }

  return snappedValue
}

export function getNextSortedValues(
  prevValues: number[],
  nextValue: number,
  atIndex: number,
): number[] {
  const nextValues = [...prevValues]
  nextValues[atIndex] = nextValue
  return nextValues.sort((a, b) => a - b)
}

export function moveSortedValue(
  prevValues: number[],
  nextValue: number,
  fromIndex: number,
): { nextIndex: number; nextValues: number[] } {
  const currentValue = prevValues[fromIndex]
  if (currentValue === undefined || currentValue === nextValue) {
    return {
      nextIndex: fromIndex,
      nextValues: prevValues,
    }
  }

  const remainingValues = prevValues.filter((_, index) => index !== fromIndex)
  const movingForward = nextValue > currentValue
  let nextIndex = 0

  while (nextIndex < remainingValues.length) {
    const comparedValue = remainingValues[nextIndex]
    if (comparedValue === undefined) {
      break
    }

    if (movingForward ? comparedValue > nextValue : comparedValue >= nextValue) {
      break
    }

    nextIndex += 1
  }

  return {
    nextIndex,
    nextValues: [
      ...remainingValues.slice(0, nextIndex),
      nextValue,
      ...remainingValues.slice(nextIndex),
    ],
  }
}

function getStepsBetweenValues(values: number[]): number[] {
  return values.slice(0, -1).map((value, index) => (values[index + 1] ?? value) - value)
}

export function hasMinStepsBetweenValues(values: number[], minStepsBetweenValues: number): boolean {
  if (minStepsBetweenValues > 0) {
    const stepsBetweenValues = getStepsBetweenValues(values)
    const actualMinStepsBetweenValues = Math.min(...stepsBetweenValues)
    return actualMinStepsBetweenValues >= minStepsBetweenValues
  }

  return true
}

export function getClosestValueIndex(values: number[], nextValue: number): number {
  if (values.length === 1) {
    return 0
  }

  const distances = values.map((value) => Math.abs(value - nextValue))
  const closestDistance = Math.min(...distances)
  const closestIndex = distances.indexOf(closestDistance)

  const closestValue = values[closestIndex] ?? nextValue

  return nextValue < closestValue ? closestIndex : distances.lastIndexOf(closestDistance)
}

export function linearScale(
  input: readonly [number, number],
  output: readonly [number, number],
): (value: number) => number {
  return (value: number) => {
    if (input[0] === input[1] || output[0] === output[1]) {
      return output[0]
    }

    const ratio = (output[1] - output[0]) / (input[1] - input[0])
    return output[0] + ratio * (value - input[0])
  }
}

export function normalizeSliderValues(
  value: SliderValue | undefined,
  fallback: number,
  min: number,
  max: number,
): number[] | undefined {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    throw new RangeError('Slider `max` must be a finite number greater than `min`.')
  }

  if (value === undefined) {
    return undefined
  }

  if (Array.isArray(value)) {
    const values = value.length > 0 ? value : [fallback]
    return values
      .map((item) => clamp(Number.isFinite(item) ? item : fallback, min, max))
      .sort((a, b) => a - b)
  }

  return [clamp(Number.isFinite(value) ? value : fallback, min, max)]
}

export function resolveSliderEdges(
  orientation: SliderOrientation,
  inverted: boolean,
  isRtl: boolean,
): { startEdge: SliderEdge; endEdge: SliderEdge } {
  if (orientation === 'vertical') {
    return inverted
      ? { startEdge: 'top', endEdge: 'bottom' }
      : { startEdge: 'bottom', endEdge: 'top' }
  }

  return isRtl === inverted
    ? { startEdge: 'left', endEdge: 'right' }
    : { startEdge: 'right', endEdge: 'left' }
}
