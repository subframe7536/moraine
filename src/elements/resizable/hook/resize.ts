import { clamp } from '@kobalte/utils'

import { fixToPrecision, nearlyEqual, normalizeSizeVector, resolveSize } from './size'
import type { ResizableResolvedPanel, ResizableSize } from './types'

interface IndexSpan {
  start: number
  end: number
}

interface ResizeAction {
  precedingRange: IndexSpan
  followingRange: IndexSpan
  negate?: boolean
}

const RESIZE_DIRECTION_PRECEDING = 1 << 0
const RESIZE_DIRECTION_INCREASING = 1 << 1
type ResizeDirection = 0 | 1 | 2 | 3

export const RESIZE_FLAG_PRECEDING = 1
export const RESIZE_FLAG_FOLLOWING = 2
export const RESIZE_FLAG_BOTH = 3
type ResizeStrategy = 1 | 2 | 3
type ResizeSide = 1 | 2

function isCollapsedSize(size: number, collapsedSize: number): boolean {
  return size < collapsedSize || nearlyEqual(size, collapsedSize)
}

function withCollapsedPanelMinOverride(
  panels: ResizableResolvedPanel[],
  initialSizes: number[],
): ResizableResolvedPanel[] {
  let changed = false
  const nextPanels = panels.map((panel, index) => {
    const size = initialSizes[index] ?? 0

    if (
      !panel.collapsible ||
      panel.min <= panel.collapsibleMin ||
      !isCollapsedSize(size, panel.collapsibleMin)
    ) {
      return panel
    }

    changed = true
    return {
      ...panel,
      min: panel.collapsibleMin,
    }
  })

  return changed ? nextPanels : panels
}

function getResizeDirection(side: ResizeSide, desiredPercentage: number): ResizeDirection {
  let direction = 0

  if (side === RESIZE_FLAG_PRECEDING) {
    direction |= RESIZE_DIRECTION_PRECEDING
  }

  const shouldIncrease = (side === RESIZE_FLAG_PRECEDING) === desiredPercentage >= 0
  if (shouldIncrease) {
    direction |= RESIZE_DIRECTION_INCREASING
  }

  return direction as ResizeDirection
}

function isPrecedingDirection(direction: ResizeDirection): boolean {
  return (direction & RESIZE_DIRECTION_PRECEDING) !== 0
}

function isIncreasingDirection(direction: ResizeDirection): boolean {
  return (direction & RESIZE_DIRECTION_INCREASING) !== 0
}

function distributePercentage(input: {
  desiredPercentage: number
  side: ResizeSide
  range: IndexSpan
  sizes: number[]
  panels: ResizableResolvedPanel[]
}): number {
  const desiredPercentage = fixToPrecision(input.desiredPercentage)
  const { start, end } = input.range

  if (end < start) {
    return 0
  }

  const resizeDirection = getResizeDirection(input.side, desiredPercentage)
  const precedingDirection = isPrecedingDirection(resizeDirection)
  const increasingDirection = isIncreasingDirection(resizeDirection)

  let distributedPercentage = 0

  for (
    let i = precedingDirection ? end : start;
    precedingDirection ? i >= start : i <= end;
    i += precedingDirection ? -1 : 1
  ) {
    const panel = input.panels[i]
    const panelSize = input.sizes[i] ?? 0

    if (!panel) {
      continue
    }

    const availablePercentage = fixToPrecision(desiredPercentage - distributedPercentage)

    if (nearlyEqual(availablePercentage, 0)) {
      break
    }

    const boundarySize = increasingDirection ? panel.max : panel.min
    const signedAvailable = precedingDirection ? availablePercentage : -availablePercentage
    const nextSize = increasingDirection
      ? Math.min(boundarySize, panelSize + signedAvailable)
      : Math.max(boundarySize, panelSize + signedAvailable)

    input.sizes[i] = nextSize
    const delta = nextSize - panelSize
    distributedPercentage += precedingDirection ? delta : -delta
  }

  distributedPercentage = fixToPrecision(distributedPercentage)
  return fixToPrecision(distributedPercentage)
}

function getDistributablePercentage(input: {
  desiredPercentage: number
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
  actions: ResizeAction[]
}): number {
  if (input.actions.length === 0) {
    return 0
  }

  let distributablePercentage =
    input.desiredPercentage >= 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
  const nextSizes = [...input.initialSizes]

  for (const action of input.actions) {
    const desiredPercentage = action.negate ? -input.desiredPercentage : input.desiredPercentage

    let precedingPercentage = distributePercentage({
      desiredPercentage,
      side: RESIZE_FLAG_PRECEDING,
      range: action.precedingRange,
      sizes: nextSizes,
      panels: input.panels,
    })

    let followingPercentage = distributePercentage({
      desiredPercentage,
      side: RESIZE_FLAG_FOLLOWING,
      range: action.followingRange,
      sizes: nextSizes,
      panels: input.panels,
    })

    if (action.negate) {
      precedingPercentage = -precedingPercentage
      followingPercentage = -followingPercentage
    }

    distributablePercentage =
      input.desiredPercentage >= 0
        ? Math.min(distributablePercentage, Math.min(precedingPercentage, followingPercentage))
        : Math.max(distributablePercentage, Math.max(precedingPercentage, followingPercentage))
  }

  if (!Number.isFinite(distributablePercentage)) {
    return 0
  }

  return fixToPrecision(distributablePercentage)
}

function applyResize(input: {
  distributablePercentage: number
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
  actions: ResizeAction[]
}): number[] {
  const nextSizes = [...input.initialSizes]

  for (const action of input.actions) {
    const deltaPercentage = action.negate
      ? -input.distributablePercentage
      : input.distributablePercentage

    distributePercentage({
      desiredPercentage: deltaPercentage,
      side: RESIZE_FLAG_PRECEDING,
      range: action.precedingRange,
      sizes: nextSizes,
      panels: input.panels,
    })

    distributePercentage({
      desiredPercentage: deltaPercentage,
      side: RESIZE_FLAG_FOLLOWING,
      range: action.followingRange,
      sizes: nextSizes,
      panels: input.panels,
    })
  }

  return normalizeSizeVector(nextSizes)
}

function computeResize(input: {
  desiredPercentage: number
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
  actions: ResizeAction[]
}): number[] {
  const distributablePercentage = getDistributablePercentage(input)

  return applyResize({
    distributablePercentage,
    initialSizes: input.initialSizes,
    panels: input.panels,
    actions: input.actions,
  })
}

export function resizeFromHandle(input: {
  handleIndex: number
  deltaPercentage: number
  altKey: boolean
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
}): number[] {
  const panels = withCollapsedPanelMinOverride(input.panels, input.initialSizes)
  const panelCount = panels.length

  if (panelCount <= 1 || input.handleIndex < 0 || input.handleIndex >= panelCount - 1) {
    return normalizeSizeVector(input.initialSizes)
  }

  if (!input.altKey && panelCount === 2 && input.handleIndex === 0) {
    return resizePanelByDelta({
      panelIndex: 0,
      deltaPercentage: input.deltaPercentage,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: input.initialSizes,
      panels,
    })
  }

  if (input.altKey && panelCount > 2) {
    let panelIndex = input.handleIndex
    let deltaPercentage = input.deltaPercentage

    const isPrecedingHandle = panelIndex === 0
    if (isPrecedingHandle) {
      panelIndex += 1
      deltaPercentage = -deltaPercentage
    }

    const panel = panels[panelIndex]
    const panelSize = input.initialSizes[panelIndex] ?? 0
    const minDelta = panel.min - panelSize
    const maxDelta = panel.max - panelSize
    const cappedDelta = clamp(deltaPercentage * 2, minDelta, maxDelta) / 2

    return computeResize({
      desiredPercentage: cappedDelta,
      initialSizes: input.initialSizes,
      panels,
      actions: [
        {
          precedingRange: { start: 0, end: panelIndex },
          followingRange: { start: panelIndex + 1, end: panelCount - 1 },
        },
        {
          precedingRange: { start: 0, end: panelIndex - 1 },
          followingRange: { start: panelIndex, end: panelCount - 1 },
          negate: true,
        },
      ],
    })
  }

  return computeResize({
    desiredPercentage: input.deltaPercentage,
    initialSizes: input.initialSizes,
    panels,
    actions: [
      {
        precedingRange: { start: 0, end: input.handleIndex },
        followingRange: { start: input.handleIndex + 1, end: panelCount - 1 },
      },
    ],
  })
}

function resizePanelByDelta(input: {
  panelIndex: number
  deltaPercentage: number
  strategy: ResizeStrategy
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
}): number[] {
  const panelCount = input.panels.length
  const targetPanel = input.panels[input.panelIndex]

  if (!targetPanel) {
    return normalizeSizeVector(input.initialSizes)
  }

  let strategy: ResizeStrategy = input.strategy

  if (input.panelIndex === 0) {
    strategy = RESIZE_FLAG_FOLLOWING
  } else if (input.panelIndex === panelCount - 1) {
    strategy = RESIZE_FLAG_PRECEDING
  }

  const precedingRange: IndexSpan = { start: 0, end: input.panelIndex - 1 }
  const followingRange: IndexSpan = { start: input.panelIndex + 1, end: panelCount - 1 }

  if (strategy === RESIZE_FLAG_BOTH) {
    return computeResize({
      desiredPercentage: input.deltaPercentage / 2,
      initialSizes: input.initialSizes,
      panels: input.panels,
      actions: [
        {
          precedingRange: { start: 0, end: input.panelIndex },
          followingRange,
        },
        {
          precedingRange,
          followingRange: { start: input.panelIndex, end: panelCount - 1 },
          negate: true,
        },
      ],
    })
  }

  let desiredPercentage = input.deltaPercentage
  const adjustedPreceding =
    strategy === RESIZE_FLAG_PRECEDING ? precedingRange : { start: 0, end: input.panelIndex }
  const adjustedFollowing =
    strategy === RESIZE_FLAG_FOLLOWING
      ? followingRange
      : { start: input.panelIndex, end: panelCount - 1 }

  if (strategy === RESIZE_FLAG_PRECEDING) {
    desiredPercentage = -desiredPercentage
  }

  return computeResize({
    desiredPercentage,
    initialSizes: input.initialSizes,
    panels: input.panels,
    actions: [{ precedingRange: adjustedPreceding, followingRange: adjustedFollowing }],
  })
}

export function resizePanelToSize(input: {
  panelIndex: number
  size: ResizableSize
  strategy: ResizeStrategy
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
  rootSize: number
}): number[] {
  const panel = input.panels[input.panelIndex]
  if (!panel) {
    return normalizeSizeVector(input.initialSizes)
  }

  const requestedSize = resolveSize(input.size, input.rootSize)
  const allowedSize = clamp(requestedSize, panel.min, panel.max)
  const deltaPercentage = allowedSize - (input.initialSizes[input.panelIndex] ?? 0)

  return resizePanelByDelta({
    panelIndex: input.panelIndex,
    deltaPercentage,
    strategy: input.strategy,
    initialSizes: input.initialSizes,
    panels: input.panels,
  })
}

function withPanelMinOverride(
  panels: ResizableResolvedPanel[],
  panelIndex: number,
  min: number,
): ResizableResolvedPanel[] {
  return panels.map((panel, index) => (index === panelIndex ? { ...panel, min } : panel))
}

export function collapsePanel(input: {
  panelIndex: number
  strategy: ResizeStrategy
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
}): number[] {
  const panel = input.panels[input.panelIndex]
  if (!panel) {
    return normalizeSizeVector(input.initialSizes)
  }

  const panelSize = input.initialSizes[input.panelIndex] ?? 0
  if (!panel.collapsible || isCollapsedSize(panelSize, panel.collapsibleMin)) {
    return normalizeSizeVector(input.initialSizes)
  }

  const collapsePanels = withPanelMinOverride(input.panels, input.panelIndex, panel.collapsibleMin)

  return resizePanelByDelta({
    panelIndex: input.panelIndex,
    deltaPercentage: panel.collapsibleMin - panelSize,
    strategy: input.strategy,
    initialSizes: input.initialSizes,
    panels: collapsePanels,
  })
}

function resolveExpandedTargetSize(input: {
  panelIndex: number
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
  expandedSize?: number
}): number {
  const panel = input.panels[input.panelIndex]
  if (!panel) {
    return 0
  }

  // Internal sizes are normalized ratios, so resolve defaultSize in a unit-sized root (1).
  const fallbackDefaultSize = panel.defaultSize ? resolveSize(panel.defaultSize, 1) : panel.max
  const preferred = input.expandedSize ?? fallbackDefaultSize
  const normalizedPreferred = Number.isFinite(preferred) ? preferred : panel.max

  return clamp(normalizedPreferred, panel.min, panel.max)
}

export function expandPanel(input: {
  panelIndex: number
  strategy: ResizeStrategy
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
  expandedSize?: number
}): number[] {
  const panel = input.panels[input.panelIndex]
  if (!panel) {
    return normalizeSizeVector(input.initialSizes)
  }

  const panelSize = input.initialSizes[input.panelIndex] ?? 0
  if (!panel.collapsible || !isCollapsedSize(panelSize, panel.collapsibleMin)) {
    return normalizeSizeVector(input.initialSizes)
  }

  const nextSize = resolveExpandedTargetSize(input)

  return resizePanelByDelta({
    panelIndex: input.panelIndex,
    deltaPercentage: nextSize - panelSize,
    strategy: input.strategy,
    initialSizes: input.initialSizes,
    panels: input.panels,
  })
}

function resolveCollapsiblePanelIndex(
  panels: ResizableResolvedPanel[],
  handleIndex: number,
): number {
  const precedingPanel = panels[handleIndex]
  const followingPanel = panels[handleIndex + 1]

  if (precedingPanel?.collapsible === true) {
    return handleIndex
  }

  if (followingPanel?.collapsible === true) {
    return handleIndex + 1
  }

  return -1
}

export function togglePanel(input: {
  panelIndex: number
  strategy: ResizeStrategy
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
  expandedSize?: number
}): number[] {
  const panel = input.panels[input.panelIndex]
  if (!panel?.collapsible) {
    return normalizeSizeVector(input.initialSizes)
  }

  const panelSize = input.initialSizes[input.panelIndex] ?? 0

  if (isCollapsedSize(panelSize, panel.collapsibleMin)) {
    return expandPanel(input)
  }

  return collapsePanel(input)
}

export function toggleHandleNearestPanel(input: {
  handleIndex: number
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
  expandedSizes?: Array<number | undefined>
}): number[] {
  const panelIndex = resolveCollapsiblePanelIndex(input.panels, input.handleIndex)

  if (panelIndex < 0) {
    return normalizeSizeVector(input.initialSizes)
  }

  return togglePanel({
    panelIndex,
    strategy: RESIZE_FLAG_FOLLOWING,
    initialSizes: input.initialSizes,
    panels: input.panels,
    expandedSize: input.expandedSizes?.[panelIndex],
  })
}
