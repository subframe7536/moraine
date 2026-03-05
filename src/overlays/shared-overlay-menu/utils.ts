import type { JSX } from 'solid-js'

export type OverlayMenuSide = 'top' | 'right' | 'bottom' | 'left'

export type OverlayMenuPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'

export type OverlayMenuItems<TItem> = TItem[] | TItem[][]

export type OverlayMenuContentSlot = (context: { sub: boolean }) => JSX.Element

export function resolveOverlayMenuSide(placement?: string): OverlayMenuSide {
  if (placement?.startsWith('right')) {
    return 'right'
  }

  if (placement?.startsWith('bottom')) {
    return 'bottom'
  }

  if (placement?.startsWith('left')) {
    return 'left'
  }

  return 'top'
}

function isGroupedItems<TItem>(items: OverlayMenuItems<TItem>): items is TItem[][] {
  return Array.isArray(items[0])
}

export function normalizeOverlayMenuGroups<TItem>(items?: OverlayMenuItems<TItem>): TItem[][] {
  if (!items || items.length === 0) {
    return []
  }

  if (isGroupedItems(items)) {
    return items
  }

  return [items]
}

export function getOverlayMenuTextValue(item: {
  label?: JSX.Element
  description?: JSX.Element
}): string | undefined {
  if (typeof item.label === 'string') {
    return item.label
  }

  if (typeof item.description === 'string') {
    return item.description
  }

  return undefined
}
