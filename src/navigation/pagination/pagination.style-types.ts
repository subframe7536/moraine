import type { ButtonStyleVariant } from '../../element/button/button.style-types'
import type { ComponentSize } from '../../theme/style/style-types.ts'

export interface PaginationStyleSlot<T = unknown> {
  /**
   * Navigation container for page controls.
   */
  root?: T

  /** Wrapper that lays out page, ellipsis, previous, and next controls. */
  list?: T

  /** Structural wrapper for a page control, ellipsis, previous control, or next control. */
  listItem?: T

  /** Interactive numbered page control. */
  item?: T

  /** Control that navigates to the previous page. */
  prev?: T

  /** Control that navigates to the next page. */
  next?: T

  /** Non-interactive marker for skipped page ranges. */
  ellipsis?: T

  /** Label text for previous/next control buttons on larger screens. */
  controlLabel?: T
}

export interface PaginationStyleVariant {
  /**
   * Size of the pagination buttons.
   * @default 'md'
   */
  size?: ComponentSize

  /**
   * Visual variant for the page buttons.
   * @default 'ghost'
   */
  variant?: ButtonStyleVariant['variant']

  /**
   * Visual variant for the active page button.
   * @default 'outline'
   */
  activeVariant?: ButtonStyleVariant['variant']

  /**
   * Visual variant for the previous/next control buttons.
   * @default 'ghost'
   */
  controlVariant?: ButtonStyleVariant['variant']
}
