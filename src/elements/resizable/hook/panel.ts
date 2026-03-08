import { clamp } from '@kobalte/utils'
import type { JSX } from 'solid-js'

import type { ResizableHandleOptions } from './handle'

export type ResizableOrientation = 'vertical' | 'horizontal'

export type ResizableSize = number | `${number}px`
export interface ResizablePanelItem extends ResizableHandleOptions {
  panelId?: string
  size?: ResizableSize
  initialSize?: ResizableSize
  minSize?: ResizableSize
  maxSize?: ResizableSize
  collapsible?: boolean
  collapsedSize?: ResizableSize
  collapseThreshold?: ResizableSize
  onResize?: (size: number) => void
  onCollapse?: (size: number) => void
  onExpand?: (size: number) => void
  class?: string
  style?: JSX.CSSProperties
  content?: JSX.Element
}

export type ResizableResizeStrategy = 'preceding' | 'following' | 'both'

export const PRECISION = 6
export const EPSILON = 10 ** -PRECISION

export interface ResizableResolvedPanel extends Omit<
  ResizablePanelItem,
  | 'size'
  | 'initialSize'
  | 'minSize'
  | 'maxSize'
  | 'collapsible'
  | 'collapsedSize'
  | 'collapseThreshold'
> {
  panelId: string
  initialSize?: ResizableSize
  minSize: number
  maxSize: number
  collapsible: boolean
  collapsedSize: number
  collapseThreshold: number
}

export interface ResizableHandleAria {
  controls?: string
  valueNow: number
  valueMin: number
  valueMax: number
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON
}

export function fixToPrecision(value: number): number {
  return Number.parseFloat(value.toFixed(PRECISION))
}

function correctRemainder(sizes: number[], total: number): void {
  const lastIndex = sizes.length - 1
  const remainder = fixToPrecision(1 - total)
  sizes[lastIndex] = fixToPrecision((sizes[lastIndex] ?? 0) + remainder)
}

export function normalizeSizeVector(sizes: number[]): number[] {
  const sizeCount = sizes.length
  if (sizeCount === 0) {
    return []
  }

  const normalized: number[] = []
  let total = 0

  for (let index = 0; index < sizeCount; index += 1) {
    const size = sizes[index]
    const clamped = isFiniteNumber(size) ? Math.max(0, size) : 0

    normalized[index] = clamped
    total += clamped
  }

  if (total <= EPSILON) {
    const equal = fixToPrecision(1 / sizeCount)
    let fallbackTotal = 0

    for (let index = 0; index < sizeCount; index += 1) {
      normalized[index] = equal
      fallbackTotal += equal
    }

    correctRemainder(normalized, fallbackTotal)
    return normalized
  }

  let normalizedTotal = 0

  for (let index = 0; index < sizeCount; index += 1) {
    const nextSize = fixToPrecision(normalized[index] / total)
    normalized[index] = nextSize
    normalizedTotal += nextSize
  }

  correctRemainder(normalized, normalizedTotal)

  return normalized
}

export function resolveSize(size: ResizableSize | undefined | null, rootSize: number): number {
  const safeRootSize = rootSize > EPSILON ? rootSize : 1

  if (!size) {
    return 0
  }

  if (isFiniteNumber(size)) {
    return size
  }

  if (typeof size === 'string' && size.endsWith('px')) {
    const pixel = Number.parseFloat(size)
    if (!Number.isFinite(pixel)) {
      return 0
    }

    return fixToPrecision(pixel / safeRootSize)
  }

  return 0
}

export function resolveKeyboardDelta(delta: ResizableSize | undefined, rootSize: number): number {
  if (delta === undefined) {
    return 0.1
  }

  return resolveSize(delta, rootSize)
}

export function normalizePanelSizes(input: {
  panelCount: number
  rootSize: number
  panelInitialSizes: Array<ResizableSize | undefined>
  controlledSizes?: Array<ResizableSize | undefined>
}): number[] {
  const { panelCount, rootSize, panelInitialSizes, controlledSizes } = input

  if (panelCount === 0) {
    return []
  }

  if (controlledSizes && controlledSizes.length > 0) {
    const aligned: number[] = []
    let definedSum = 0
    let undefinedCount = 0

    for (let index = 0; index < panelCount; index += 1) {
      const controlledSize = controlledSizes[index]
      if (controlledSize === undefined) {
        aligned[index] = 0
        undefinedCount += 1
        continue
      }

      const resolvedControlledSize = resolveSize(controlledSize, rootSize)
      const clampedControlledSize = Math.max(0, resolvedControlledSize)
      aligned[index] = clampedControlledSize
      definedSum += clampedControlledSize
    }

    if (undefinedCount > 0) {
      const remaining = 1 - definedSum
      const fallbackSize = remaining > EPSILON ? remaining / undefinedCount : 0

      for (let index = 0; index < panelCount; index += 1) {
        if (controlledSizes[index] === undefined) {
          aligned[index] = fallbackSize
        }
      }
    }

    return normalizeSizeVector(aligned)
  }

  const resolved: number[] = []
  let definedSum = 0
  let undefinedCount = 0

  for (let index = 0; index < panelCount; index += 1) {
    const panelSize = panelInitialSizes[index]
    if (panelSize === undefined) {
      resolved[index] = 0
      undefinedCount += 1
      continue
    }

    const size = resolveSize(panelSize, rootSize)
    resolved[index] = size
    definedSum += size
  }

  if (undefinedCount > 0) {
    const remaining = 1 - definedSum
    const fallbackSize = remaining > EPSILON ? remaining / undefinedCount : 1 / panelCount

    for (let index = 0; index < panelCount; index += 1) {
      if (resolved[index] === 0 && panelInitialSizes[index] === undefined) {
        resolved[index] = fallbackSize
      }
    }
  }

  return normalizeSizeVector(resolved)
}

export function resolvePanels(
  panels: ResizablePanelItem[] | undefined,
  rootSize: number,
  panelIdPrefix: string,
): ResizableResolvedPanel[] {
  return (panels ?? []).map((panel, index) => {
    const minSize = clamp(resolveSize(panel.minSize ?? 0, rootSize), 0, 1)
    const maxSize = clamp(resolveSize(panel.maxSize ?? 1, rootSize), minSize, 1)
    const collapsedSize = clamp(resolveSize(panel.collapsedSize ?? 0, rootSize), 0, minSize)
    const collapseThreshold = clamp(
      resolveSize(panel.collapseThreshold ?? 0.05, rootSize),
      0,
      Math.max(0, minSize - collapsedSize),
    )

    return {
      panelId: panel.panelId ?? `${panelIdPrefix}-panel-${index + 1}`,
      initialSize: panel.initialSize,
      minSize,
      maxSize,
      collapsible: panel.collapsible === true,
      collapsedSize,
      collapseThreshold,
      renderHandle: panel.renderHandle,
      disableHandle: panel.disableHandle,
      intersection: panel.intersection,
      onHandleDragStart: panel.onHandleDragStart,
      onHandleDrag: panel.onHandleDrag,
      onHandleDragEnd: panel.onHandleDragEnd,
      onResize: panel.onResize,
      onCollapse: panel.onCollapse,
      onExpand: panel.onExpand,
      class: panel.class,
      style: panel.style,
      content: panel.content,
    }
  })
}

export function isPanelCollapsed(size: number, panel: ResizableResolvedPanel): boolean {
  return panel.collapsible && nearlyEqual(size, panel.collapsedSize)
}

export function getHandleAria(input: {
  handleIndex: number
  sizes: number[]
  panels: ResizableResolvedPanel[]
}): ResizableHandleAria {
  const { handleIndex, sizes, panels } = input
  let valueNow = 0
  let valueMin = 0
  let followingMin = 0

  for (let index = 0; index <= handleIndex; index += 1) {
    valueNow += sizes[index] ?? 0
    valueMin += panels[index]?.minSize ?? 0
  }

  for (let index = handleIndex + 1; index < panels.length; index += 1) {
    followingMin += panels[index]?.minSize ?? 0
  }

  return {
    controls: panels[handleIndex]?.panelId,
    valueNow: fixToPrecision(valueNow),
    valueMin: fixToPrecision(valueMin),
    valueMax: fixToPrecision(1 - followingMin),
  }
}
