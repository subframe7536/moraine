import type { ResizableSize } from './types'
import { EPSILON, PRECISION } from './types'

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
    const nextSize = fixToPrecision(normalized[index]! / total)
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
    return fixToPrecision(size / safeRootSize)
  }

  if (typeof size === 'string' && size.endsWith('%')) {
    const percentage = Number.parseFloat(size)
    if (!Number.isFinite(percentage)) {
      return 0
    }

    return fixToPrecision(percentage / 100)
  }

  return 0
}

export function resolveKeyboardDelta(delta: ResizableSize | undefined, rootSize: number): number {
  if (delta === undefined) {
    return resolveSize('10%', rootSize)
  }

  return resolveSize(delta, rootSize)
}

type SizePriority = 0 | 1 | 2

function clampSize(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function sumSizes(sizes: number[]): number {
  let total = 0
  for (const size of sizes) {
    total += size
  }
  return total
}

function resolvePanelBounds(input: {
  panelCount: number
  panelMinSizes?: number[]
  panelMaxSizes?: number[]
}): { minSizes: number[]; maxSizes: number[] } {
  const minSizes: number[] = []
  const maxSizes: number[] = []

  for (let index = 0; index < input.panelCount; index += 1) {
    const rawMin = input.panelMinSizes?.[index]
    const rawMax = input.panelMaxSizes?.[index]
    const min = isFiniteNumber(rawMin) ? clampSize(rawMin, 0, 1) : 0
    const maxCandidate = isFiniteNumber(rawMax) ? clampSize(rawMax, 0, 1) : 1
    const max = Math.max(min, maxCandidate)

    minSizes[index] = min
    maxSizes[index] = max
  }

  return { minSizes, maxSizes }
}

function redistributeByPriority(input: {
  sizes: number[]
  minSizes: number[]
  maxSizes: number[]
  priorities: SizePriority[]
}): number[] {
  const nextSizes = input.sizes.map((size, index) =>
    clampSize(size, input.minSizes[index] ?? 0, input.maxSizes[index] ?? 1),
  )

  const priorityOrder: SizePriority[] = [0, 1, 2]
  let remainder = fixToPrecision(1 - sumSizes(nextSizes))
  let guard = 0

  while (Math.abs(remainder) > EPSILON && guard < 30) {
    const shouldGrow = remainder > 0
    let changed = false

    for (const priority of priorityOrder) {
      let pending = Math.abs(remainder)

      while (pending > EPSILON) {
        const candidates: number[] = []

        for (let index = 0; index < nextSizes.length; index += 1) {
          if ((input.priorities[index] ?? 0) !== priority) {
            continue
          }

          const room = shouldGrow
            ? (input.maxSizes[index] ?? 1) - (nextSizes[index] ?? 0)
            : (nextSizes[index] ?? 0) - (input.minSizes[index] ?? 0)

          if (room > EPSILON) {
            candidates.push(index)
          }
        }

        if (candidates.length === 0) {
          break
        }

        const share = pending / candidates.length
        let applied = 0

        for (const index of candidates) {
          const room = shouldGrow
            ? (input.maxSizes[index] ?? 1) - (nextSizes[index] ?? 0)
            : (nextSizes[index] ?? 0) - (input.minSizes[index] ?? 0)
          const delta = Math.min(room, share)

          if (delta <= EPSILON) {
            continue
          }

          nextSizes[index] = fixToPrecision(
            shouldGrow ? (nextSizes[index] ?? 0) + delta : (nextSizes[index] ?? 0) - delta,
          )
          applied += delta
        }

        if (applied <= EPSILON) {
          break
        }

        changed = true
        pending = fixToPrecision(pending - applied)
      }

      remainder = fixToPrecision(1 - sumSizes(nextSizes))
      if (Math.abs(remainder) <= EPSILON) {
        break
      }
    }

    if (!changed) {
      break
    }

    remainder = fixToPrecision(1 - sumSizes(nextSizes))
    guard += 1
  }

  return nextSizes
}

export function normalizePanelSizes(input: {
  panelCount: number
  rootSize: number
  panelInitialSizes: Array<ResizableSize | undefined>
  panelMinSizes?: number[]
  panelMaxSizes?: number[]
  controlledSizes?: Array<ResizableSize | undefined>
}): number[] {
  const { panelCount, rootSize, panelInitialSizes, controlledSizes } = input

  if (panelCount === 0) {
    return []
  }

  const { minSizes, maxSizes } = resolvePanelBounds({
    panelCount,
    panelMinSizes: input.panelMinSizes,
    panelMaxSizes: input.panelMaxSizes,
  })
  const priorities: SizePriority[] = []

  if (controlledSizes && controlledSizes.length > 0) {
    const aligned: number[] = []
    let preferredSum = 0
    let undefinedCount = 0

    for (let index = 0; index < panelCount; index += 1) {
      const controlledSize = controlledSizes[index]
      if (controlledSize === undefined) {
        const defaultSize = panelInitialSizes[index]

        if (defaultSize !== undefined) {
          const resolvedDefaultSize = resolveSize(defaultSize, rootSize)
          aligned[index] = Math.max(0, resolvedDefaultSize)
          priorities[index] = 1
          preferredSum += aligned[index] ?? 0
          continue
        }

        aligned[index] = 0
        priorities[index] = 0
        undefinedCount += 1
        continue
      }

      const resolvedControlledSize = resolveSize(controlledSize, rootSize)
      const clampedControlledSize = Math.max(0, resolvedControlledSize)
      aligned[index] = clampedControlledSize
      priorities[index] = 2
      preferredSum += clampedControlledSize
    }

    if (undefinedCount > 0) {
      const remaining = 1 - preferredSum
      const fallbackSize = remaining > EPSILON ? remaining / undefinedCount : 0

      for (let index = 0; index < panelCount; index += 1) {
        if (priorities[index] === 0) {
          aligned[index] = fallbackSize
        }
      }
    }

    return redistributeByPriority({
      sizes: normalizeSizeVector(aligned),
      minSizes,
      maxSizes,
      priorities,
    })
  }

  const resolved: number[] = []
  let definedSum = 0
  let undefinedCount = 0

  for (let index = 0; index < panelCount; index += 1) {
    const panelSize = panelInitialSizes[index]
    if (panelSize === undefined) {
      resolved[index] = 0
      priorities[index] = 0
      undefinedCount += 1
      continue
    }

    const size = resolveSize(panelSize, rootSize)
    resolved[index] = size
    priorities[index] = 1
    definedSum += size
  }

  if (undefinedCount > 0) {
    const remaining = 1 - definedSum
    const fallbackSize = remaining > EPSILON ? remaining / undefinedCount : 1 / panelCount

    for (let index = 0; index < panelCount; index += 1) {
      if (priorities[index] === 0) {
        resolved[index] = fallbackSize
      }
    }
  }

  return redistributeByPriority({
    sizes: normalizeSizeVector(resolved),
    minSizes,
    maxSizes,
    priorities,
  })
}
