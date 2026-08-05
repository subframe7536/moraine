import type { ElementProps, SlotStyleValue } from '../../shared/types.ts'

/** Props that an overlay render prop must forward to its trigger root. */
export type OverlayTriggerProps = Omit<
  ElementProps<HTMLElement>,
  'children' | 'class' | 'onContextMenu' | 'ref' | 'style'
> & {
  class?: string
  onContextMenu?: (event: MouseEvent) => void
  ref: (element: HTMLElement | undefined) => void
  style?: SlotStyleValue
}

export function validateOverlayTrigger(
  element: HTMLElement | undefined,
  overlayName: string,
): void {
  if (element instanceof HTMLElement) {
    return
  }

  throw new Error(
    `${overlayName} trigger render prop must forward the provided props to a single HTMLElement root.`,
  )
}
