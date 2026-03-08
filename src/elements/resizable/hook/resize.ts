import { clamp } from '@kobalte/utils'

import type { ResizableResolvedPanel, ResizableResizeStrategy, ResizableSize } from './panel'
import { fixToPrecision, nearlyEqual, normalizeSizeVector, resolveSize } from './panel'

interface IndexSpan {
  start: number
  end: number
}

interface ResizeAction {
  precedingRange: IndexSpan
  followingRange: IndexSpan
  negate?: boolean
}

const RESIZE_DIRECTION_FLAG_PRECEDING = 1 << 0
const RESIZE_DIRECTION_FLAG_INCREASING = 1 << 1
type ResizeDirection = 0 | 1 | 2 | 3

function getResizeDirection(
  side: 'preceding' | 'following',
  desiredPercentage: number,
): ResizeDirection {
  let direction = 0

  if (side === 'preceding') {
    direction |= RESIZE_DIRECTION_FLAG_PRECEDING
  }

  const shouldIncrease = (side === 'preceding') === desiredPercentage >= 0
  if (shouldIncrease) {
    direction |= RESIZE_DIRECTION_FLAG_INCREASING
  }

  return direction as ResizeDirection
}

function isPrecedingDirection(direction: ResizeDirection): boolean {
  return (direction & RESIZE_DIRECTION_FLAG_PRECEDING) !== 0
}

function isIncreasingDirection(direction: ResizeDirection): boolean {
  return (direction & RESIZE_DIRECTION_FLAG_INCREASING) !== 0
}

function applyDistributedSizeChange(input: {
  resizeDirection: ResizeDirection
  distributedPercentage: number
  panelSize: number
  previousSize: number
  nextSize: number
}): number {
  const previousDelta = input.previousSize - input.panelSize
  const nextDelta = input.nextSize - input.panelSize

  if (isPrecedingDirection(input.resizeDirection)) {
    return input.distributedPercentage + (nextDelta - previousDelta)
  }

  return input.distributedPercentage - (nextDelta - previousDelta)
}

function resolveExpandedSize(input: {
  resizeDirection: ResizeDirection
  panel: ResizableResolvedPanel
  panelSize: number
  availablePercentage: number
}): { nextSize: number; collapsed: boolean } {
  let nextSize = input.panel.minSize
  let collapsed = false

  if (Math.abs(input.availablePercentage) >= input.panel.minSize - input.panel.collapsedSize) {
    if (isPrecedingDirection(input.resizeDirection)) {
      nextSize = Math.min(input.panel.maxSize, input.panelSize + input.availablePercentage)
    } else {
      nextSize = Math.min(input.panel.maxSize, input.panelSize - input.availablePercentage)
    }
  } else {
    collapsed = true
  }

  return { nextSize, collapsed }
}

function distributePercentage(input: {
  desiredPercentage: number
  side: 'preceding' | 'following'
  range: IndexSpan
  sizes: number[]
  panels: ResizableResolvedPanel[]
  collapsible: boolean
}): [number, boolean] {
  const desiredPercentage = fixToPrecision(input.desiredPercentage)
  const { start, end } = input.range

  if (end < start) {
    return [0, false]
  }

  const resizeDirection = getResizeDirection(input.side, desiredPercentage)
  const precedingDirection = isPrecedingDirection(resizeDirection)
  const increasingDirection = isIncreasingDirection(resizeDirection)

  const targetIndex = precedingDirection ? end : start
  const originalTargetSize = input.sizes[targetIndex] ?? 0

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

    if (panel.collapsible && nearlyEqual(panelSize, panel.collapsedSize)) {
      continue
    }

    const availablePercentage = fixToPrecision(desiredPercentage - distributedPercentage)

    if (nearlyEqual(availablePercentage, 0)) {
      break
    }

    const boundarySize = increasingDirection ? panel.maxSize : panel.minSize
    const signedAvailable = precedingDirection ? availablePercentage : -availablePercentage
    const nextSize = increasingDirection
      ? Math.min(boundarySize, panelSize + signedAvailable)
      : Math.max(boundarySize, panelSize + signedAvailable)

    input.sizes[i] = nextSize
    const delta = nextSize - panelSize
    distributedPercentage += precedingDirection ? delta : -delta
  }

  distributedPercentage = fixToPrecision(distributedPercentage)

  if (!input.collapsible || nearlyEqual(distributedPercentage, desiredPercentage)) {
    return [distributedPercentage, false]
  }

  const panel = input.panels[targetIndex]

  if (!panel || !panel.collapsible) {
    return [distributedPercentage, false]
  }

  const availablePercentage = fixToPrecision(desiredPercentage - distributedPercentage)
  const panelSize = originalTargetSize
  const collapsedSize = panel.collapsedSize
  const minSize = panel.minSize
  const collapseThreshold = Math.min(panel.collapseThreshold, Math.max(0, minSize - collapsedSize))
  const isCollapsed = nearlyEqual(panelSize, collapsedSize)

  if (Math.abs(availablePercentage) < collapseThreshold) {
    return [fixToPrecision(distributedPercentage), false]
  }

  if (!increasingDirection && !isCollapsed) {
    const previousSize = input.sizes[targetIndex] ?? panelSize
    input.sizes[targetIndex] = collapsedSize
    return [fixToPrecision(applyDistributedSizeChange({
      resizeDirection,
      distributedPercentage,
      panelSize,
      previousSize,
      nextSize: collapsedSize,
    })), true]
  }

  if (increasingDirection && isCollapsed) {
    const previousSize = input.sizes[targetIndex] ?? panelSize
    const expanded = resolveExpandedSize({
      resizeDirection,
      panel,
      panelSize,
      availablePercentage,
    })

    input.sizes[targetIndex] = expanded.nextSize
    return [fixToPrecision(applyDistributedSizeChange({
      resizeDirection,
      distributedPercentage,
      panelSize,
      previousSize,
      nextSize: expanded.nextSize,
    })), expanded.collapsed]
  }

  return [fixToPrecision(distributedPercentage), false]
}

function getDistributablePercentage(input: {
  desiredPercentage: number
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
  collapsible: boolean
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

    let [precedingPercentage, collapsedPreceding] = distributePercentage({
      desiredPercentage,
      side: 'preceding',
      range: action.precedingRange,
      sizes: nextSizes,
      panels: input.panels,
      collapsible: input.collapsible,
    })

    let [followingPercentage, collapsedFollowing] = distributePercentage({
      desiredPercentage,
      side: 'following',
      range: action.followingRange,
      sizes: nextSizes,
      panels: input.panels,
      collapsible: input.collapsible,
    })

    if (action.negate) {
      precedingPercentage = -precedingPercentage
      followingPercentage = -followingPercentage
    }

    if (collapsedPreceding) {
      followingPercentage = precedingPercentage
    }

    if (collapsedFollowing) {
      precedingPercentage = followingPercentage
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
  collapsible: boolean
  actions: ResizeAction[]
}): number[] {
  const nextSizes = [...input.initialSizes]

  for (const action of input.actions) {
    const deltaPercentage = action.negate
      ? -input.distributablePercentage
      : input.distributablePercentage

    distributePercentage({
      desiredPercentage: deltaPercentage,
      side: 'preceding',
      range: action.precedingRange,
      sizes: nextSizes,
      panels: input.panels,
      collapsible: input.collapsible,
    })

    distributePercentage({
      desiredPercentage: deltaPercentage,
      side: 'following',
      range: action.followingRange,
      sizes: nextSizes,
      panels: input.panels,
      collapsible: input.collapsible,
    })
  }

  return normalizeSizeVector(nextSizes)
}

function computeResize(input: {
  desiredPercentage: number
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
  collapsible: boolean
  actions: ResizeAction[]
}): number[] {
  const distributablePercentage = getDistributablePercentage(input)

  return applyResize({
    distributablePercentage,
    initialSizes: input.initialSizes,
    panels: input.panels,
    collapsible: input.collapsible,
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
  const panelCount = input.panels.length

  if (panelCount <= 1 || input.handleIndex < 0 || input.handleIndex >= panelCount - 1) {
    return normalizeSizeVector(input.initialSizes)
  }

  if (input.altKey && panelCount > 2) {
    let panelIndex = input.handleIndex
    let deltaPercentage = input.deltaPercentage

    const isPrecedingHandle = panelIndex === 0
    if (isPrecedingHandle) {
      panelIndex += 1
      deltaPercentage = -deltaPercentage
    }

    const panel = input.panels[panelIndex]
    const panelSize = input.initialSizes[panelIndex] ?? 0
    const minDelta = panel.minSize - panelSize
    const maxDelta = panel.maxSize - panelSize
    const cappedDelta = clamp(deltaPercentage * 2, minDelta, maxDelta) / 2

    return computeResize({
      desiredPercentage: cappedDelta,
      initialSizes: input.initialSizes,
      panels: input.panels,
      collapsible: false,
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
    panels: input.panels,
    collapsible: true,
    actions: [{
      precedingRange: { start: 0, end: input.handleIndex },
      followingRange: { start: input.handleIndex + 1, end: panelCount - 1 },
    }],
  })
}

function resizePanelByDelta(input: {
  panelIndex: number
  deltaPercentage: number
  strategy: ResizableResizeStrategy
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
  collapsible: boolean
}): number[] {
  const panelCount = input.panels.length
  const targetPanel = input.panels[input.panelIndex]

  if (!targetPanel) {
    return normalizeSizeVector(input.initialSizes)
  }

  let strategy = input.strategy

  if (input.panelIndex === 0) {
    strategy = 'following'
  } else if (input.panelIndex === panelCount - 1) {
    strategy = 'preceding'
  }

  const precedingRange: IndexSpan = { start: 0, end: input.panelIndex - 1 }
  const followingRange: IndexSpan = { start: input.panelIndex + 1, end: panelCount - 1 }

  if (strategy === 'both') {
    return computeResize({
      desiredPercentage: input.deltaPercentage / 2,
      initialSizes: input.initialSizes,
      panels: input.panels,
      collapsible: input.collapsible,
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
    strategy === 'preceding' ? precedingRange : { start: 0, end: input.panelIndex }
  const adjustedFollowing =
    strategy === 'following' ? followingRange : { start: input.panelIndex, end: panelCount - 1 }

  if (strategy === 'preceding') {
    desiredPercentage = -desiredPercentage
  }

  return computeResize({
    desiredPercentage,
    initialSizes: input.initialSizes,
    panels: input.panels,
    collapsible: input.collapsible,
    actions: [{ precedingRange: adjustedPreceding, followingRange: adjustedFollowing }],
  })
}

export function resizePanelToSize(input: {
  panelIndex: number
  size: ResizableSize
  strategy: ResizableResizeStrategy
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
  rootSize: number
}): number[] {
  const panel = input.panels[input.panelIndex]
  if (!panel) {
    return normalizeSizeVector(input.initialSizes)
  }

  const requestedSize = resolveSize(input.size, input.rootSize)
  const allowedSize = clamp(requestedSize, panel.minSize, panel.maxSize)
  const deltaPercentage = allowedSize - (input.initialSizes[input.panelIndex] ?? 0)

  return resizePanelByDelta({
    panelIndex: input.panelIndex,
    deltaPercentage,
    strategy: input.strategy,
    initialSizes: input.initialSizes,
    panels: input.panels,
    collapsible: false,
  })
}

export function collapsePanel(input: {
  panelIndex: number
  strategy: ResizableResizeStrategy
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
}): number[] {
  const panel = input.panels[input.panelIndex]
  if (!panel) {
    return normalizeSizeVector(input.initialSizes)
  }

  const panelSize = input.initialSizes[input.panelIndex] ?? 0
  if (!panel.collapsible || nearlyEqual(panelSize, panel.collapsedSize)) {
    return normalizeSizeVector(input.initialSizes)
  }

  return resizePanelByDelta({
    panelIndex: input.panelIndex,
    deltaPercentage: panel.collapsedSize - panelSize,
    strategy: input.strategy,
    initialSizes: input.initialSizes,
    panels: input.panels,
    collapsible: true,
  })
}

export function expandPanel(input: {
  panelIndex: number
  strategy: ResizableResizeStrategy
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
}): number[] {
  const panel = input.panels[input.panelIndex]
  if (!panel) {
    return normalizeSizeVector(input.initialSizes)
  }

  const panelSize = input.initialSizes[input.panelIndex] ?? 0
  if (!panel.collapsible || !nearlyEqual(panelSize, panel.collapsedSize)) {
    return normalizeSizeVector(input.initialSizes)
  }

  return resizePanelByDelta({
    panelIndex: input.panelIndex,
    deltaPercentage: panel.minSize - panelSize,
    strategy: input.strategy,
    initialSizes: input.initialSizes,
    panels: input.panels,
    collapsible: true,
  })
}

export function toggleHandleNearestPanel(input: {
  handleIndex: number
  initialSizes: number[]
  panels: ResizableResolvedPanel[]
}): number[] {
  const precedingPanel = input.panels[input.handleIndex]
  const followingPanel = input.panels[input.handleIndex + 1]

  const panelIndex =
    precedingPanel?.collapsible === true
      ? input.handleIndex
      : followingPanel?.collapsible === true
        ? input.handleIndex + 1
        : -1

  if (panelIndex < 0) {
    return normalizeSizeVector(input.initialSizes)
  }

  const panel = input.panels[panelIndex]!
  const panelSize = input.initialSizes[panelIndex] ?? 0

  if (nearlyEqual(panelSize, panel.collapsedSize)) {
    return expandPanel({
      panelIndex,
      strategy: 'following',
      initialSizes: input.initialSizes,
      panels: input.panels,
    })
  }

  return collapsePanel({
    panelIndex,
    strategy: 'following',
    initialSizes: input.initialSizes,
    panels: input.panels,
  })
}
