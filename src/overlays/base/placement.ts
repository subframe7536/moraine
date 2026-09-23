import type { Placement } from '@floating-ui/dom'

import type { OverlayAlign, OverlayPlacement } from '../../theme/style/style-types.ts'

export function resolveFloatingPlacement(
  placement: OverlayPlacement,
  align: OverlayAlign,
): Placement {
  return align === 'center' ? placement : `${placement}-${align}`
}

export function parseFloatingPlacement(placement: string): {
  side: OverlayPlacement
  align: OverlayAlign
} {
  const [side, align] = placement.split('-') as [OverlayPlacement, OverlayAlign?]
  return { side, align: align ?? 'center' }
}
