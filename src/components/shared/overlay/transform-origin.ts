import type { Placement } from '@floating-ui/dom'

type FloatingSide = 'top' | 'right' | 'bottom' | 'left'

export interface TransformOriginOptions {
  gutter?: number
  overlap?: boolean
  reference: { height: number; width: number; x: number; y: number }
  shift?: { x?: number; y?: number }
  x: number
  y: number
}

export function getTransformOrigin(
  placement: Placement,
  direction: 'ltr' | 'rtl',
  options: TransformOriginOptions,
): string {
  const [basePlacement, alignment] = placement.split('-') as [
    FloatingSide,
    'start' | 'end' | undefined,
  ]
  const isVertical = basePlacement === 'top' || basePlacement === 'bottom'
  const crossAxisShift = isVertical ? (options.shift?.x ?? 0) : (options.shift?.y ?? 0)
  const mainAxisShift = isVertical ? (options.shift?.y ?? 0) : (options.shift?.x ?? 0)
  const gutter = options.gutter ?? 0
  const crossOrigin =
    alignment && Math.abs(crossAxisShift) <= 1
      ? (alignment === 'start') === (isVertical && direction === 'rtl')
        ? '100%'
        : '0%'
      : `${
          isVertical
            ? options.reference.x + options.reference.width / 2 - options.x
            : options.reference.y + options.reference.height / 2 - options.y
        }px`
  let sideOrigin =
    basePlacement === 'top' || basePlacement === 'left'
      ? `calc(100% + ${gutter}px)`
      : `${-gutter}px`

  if (options.overlap && Math.abs(mainAxisShift) > gutter) {
    sideOrigin = `${
      isVertical
        ? options.reference.y + options.reference.height / 2 - options.y
        : options.reference.x + options.reference.width / 2 - options.x
    }px`
  }

  if (isVertical) {
    return `${crossOrigin} ${sideOrigin}`
  }

  return `${sideOrigin} ${crossOrigin}`
}
