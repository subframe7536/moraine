import type { Placement } from '@floating-ui/dom'

import type { OverlayAlign, OverlayPlacement } from '../../../theme/style-types'

/** Shared open/close lifecycle props for interactive overlay roots. */
export interface OverlayDisclosureProps {
  /**
   * Controlled open state. Leave it `undefined` to manage state internally (see `defaultOpen`);
   * when set, update it from `onOpenChange`.
   */
  open?: boolean

  /**
   * Initial open state when `open` is not set.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Called with the next open state when the user opens or closes the overlay. Not called when
   * `open` is changed from outside.
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Called once each time the overlay finishes its exit after closing. It is not called while the
   * overlay is open.
   */
  onExitComplete?: () => void
}

/** Shared dismissal props for interactive overlays. */
export interface OverlayDismissProps {
  /**
   * Whether pressing Escape dismisses the overlay. When `false`, Escape fires `onClosePrevented`
   * instead.
   * @default true
   */
  closeOnEscape?: boolean

  /**
   * Whether a pointer press outside the overlay and its trigger dismisses it. Menus also close
   * when focus moves outside; dialogs do not, since a modal dialog keeps focus inside and a
   * non-modal one stays open. When `false`, a blocked attempt fires `onClosePrevented` instead.
   * @default true
   */
  closeOnOutsideClick?: boolean

  /**
   * Called with no arguments when Escape (`closeOnEscape` is `false`) or an outside interaction
   * (`closeOnOutsideClick` is `false`) tried to close the overlay and was blocked.
   */
  onClosePrevented?: () => void
}

/** Shared portal mount target prop for portalled overlays. */
export interface OverlayPortalProps {
  /**
   * DOM node the portal mounts into. Defaults to `document.body` (resolved from the trigger's
   * document when available).
   */
  mount?: Node
}

/** Shared floating positioning props for anchored overlays. */
export interface OverlayPositionProps {
  /**
   * Preferred side of the trigger the content appears on (`'top'`, `'right'`, `'bottom'` or
   * `'left'`). It may move to another side when `flip` is enabled and the side lacks space.
   * @default 'bottom'
   */
  placement?: OverlayPlacement

  /**
   * Alignment of the content along the side chosen by `placement`.
   * @default 'center'
   */
  align?: OverlayAlign

  /**
   * Gap in pixels between the trigger and the content.
   * @default 4
   */
  gutter?: number

  /**
   * Offset in pixels along the alignment axis.
   * @default 0
   */
  shift?: number

  /**
   * Whether the content flips to another side when it would overflow the viewport. Pass an array
   * of fallback placements to constrain which sides it tries.
   * @default true
   */
  flip?: boolean | Placement[]

  /**
   * Whether the content slides along the trigger edge to stay within the viewport.
   * @default true
   */
  slide?: boolean

  /**
   * Minimum padding in pixels kept between the content and the viewport edge when `flip` and
   * `slide` position it.
   * @default 4
   */
  overflowPadding?: number
}
