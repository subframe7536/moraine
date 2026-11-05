import type { DrawerT } from './drawer.types'

export interface ResolvedDrawerSnapPoint {
  value: DrawerT.SnapPoint
  height: number
  offset: number
}

export function clampSnapValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Resolves the vertical swipe movement for a snap point, applying square-root damping once the drag
 * overshoots the fully-open edge (`nextOffset < 0`) so the popup resists travelling past it.
 */
export function getSnapPointSwipeMovement(baseOffset: number, movementValue: number): number {
  const nextOffset = baseOffset + movementValue
  if (nextOffset >= 0) {
    return movementValue
  }

  return -Math.sqrt(-nextOffset) - baseOffset
}

/**
 * Resolves a snap point to a pixel height. Numbers `<= 1` are a fraction of the
 * viewport height, numbers `> 1` are pixels; `px`/`rem` strings resolve directly.
 */
export function resolveSnapPointValue(
  snapPoint: DrawerT.SnapPoint,
  viewportHeight: number,
  rootFontSize: number,
): number | null {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) {
    return null
  }

  if (typeof snapPoint === 'number') {
    if (!Number.isFinite(snapPoint)) {
      return null
    }

    if (snapPoint <= 1) {
      return clampSnapValue(snapPoint, 0, 1) * viewportHeight
    }

    return snapPoint
  }

  const trimmed = snapPoint.trim()

  if (trimmed.endsWith('px')) {
    const value = Number.parseFloat(trimmed)
    return Number.isFinite(value) ? value : null
  }

  if (trimmed.endsWith('rem')) {
    const value = Number.parseFloat(trimmed)
    return Number.isFinite(value) ? value * rootFontSize : null
  }

  return null
}

/**
 * Returns the index of the value closest to `target`, or `-1` if `values` is empty.
 */
export function closestSnapPointIndex(values: number[], target: number): number {
  let closestIndex = -1
  let closestDistance = Infinity

  for (let index = 0; index < values.length; index += 1) {
    const distance = Math.abs(values[index]! - target)
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  }

  return closestIndex
}

/**
 * Resolves snap points to pixel heights and offsets, clamped to
 * `min(popupHeight, viewportHeight)` and deduplicated within 1px (later entries win).
 */
export function resolveSnapPoints(
  snapPoints: readonly DrawerT.SnapPoint[] | undefined,
  popupHeight: number,
  viewportHeight: number,
  rootFontSize: number,
): ResolvedDrawerSnapPoint[] {
  if (!snapPoints || snapPoints.length === 0 || viewportHeight <= 0 || popupHeight <= 0) {
    return []
  }

  const maxHeight = Math.min(popupHeight, viewportHeight)

  const resolved = snapPoints
    .map((value): ResolvedDrawerSnapPoint | null => {
      const resolvedHeight = resolveSnapPointValue(value, viewportHeight, rootFontSize)
      if (resolvedHeight === null) {
        return null
      }

      const clampedHeight = clampSnapValue(resolvedHeight, 0, maxHeight)
      return {
        value,
        height: clampedHeight,
        offset: Math.max(0, popupHeight - clampedHeight),
      }
    })
    .filter((point): point is ResolvedDrawerSnapPoint => point !== null)

  if (resolved.length <= 1) {
    return resolved
  }

  const deduped: ResolvedDrawerSnapPoint[] = []
  const seenHeights: number[] = []

  for (let index = resolved.length - 1; index >= 0; index -= 1) {
    const point = resolved[index]!
    const isDuplicate = seenHeights.some((height) => Math.abs(height - point.height) <= 1)
    if (isDuplicate) {
      continue
    }

    seenHeights.push(point.height)
    deduped.push(point)
  }

  deduped.reverse()
  return deduped
}
