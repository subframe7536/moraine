import type { Ref } from 'solid-js'

import type { ButtonProps } from '../../elements/button/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

type PaginationVariant = ButtonProps['variant']

export namespace PaginationT {
  export interface Slot<T = unknown> {
    /**
     * Navigation container for page controls.
     */
    root?: T

    /** Wrapper that lays out page, ellipsis, previous, and next controls. */
    list?: T

    /** Individual page control or ellipsis item. */
    item?: T

    /** Clickable page navigation control. */
    link?: T

    /** Control that navigates to the previous page. */
    prev?: T

    /** Control that navigates to the next page. */
    next?: T

    /** Non-interactive marker for skipped page ranges. */
    ellipsis?: T

    /** Label text for previous/next control buttons on larger screens. */
    controlLabel?: T
  }

  export interface Variant {
    /**
     * Size of the pagination buttons.
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg'

    /**
     * Visual variant for the page buttons.
     * @default 'ghost'
     */
    variant?: PaginationVariant

    /**
     * Visual variant for the active page button.
     * @default 'outline'
     */
    activeVariant?: PaginationVariant

    /**
     * Visual variant for the previous/next control buttons.
     * @default 'ghost'
     */
    controlVariant?: PaginationVariant
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Pagination component.
   */
  export interface Base {
    /**
     * Ref forwarded to the root `<nav>` element.
     */
    ref?: Ref<HTMLElement>

    /**
     * Controlled current page number (1-indexed).
     */
    page?: number

    /**
     * Initial page number when uncontrolled.
     * @default 1
     */
    defaultPage?: number

    /**
     * Callback triggered when the page changes.
     */
    onPageChange?: (page: number) => void

    /**
     * Number of items to display per page.
     * @default 10
     */
    itemsPerPage?: number

    /**
     * Total number of items across all pages.
     * @default 0
     */
    total?: number

    /**
     * Number of page buttons to show on either side of the current page.
     * @default 2
     * Finite integer values are clamped between 0 and 100.
     */
    siblingCount?: number

    /**
     * Whether to show previous and next control buttons.
     * @default true
     */
    showControls?: boolean

    /**
     * Whether the pagination is disabled.
     */
    disabled?: boolean

    /**
     * Icon name for the previous button.
     * @default 'icon-chevron-left'
     */
    prevIcon?: IconT.Name

    /**
     * Text to display in the previous button.
     */
    prevText?: string

    /**
     * Icon name for the next button.
     * @default 'icon-chevron-right'
     */
    nextIcon?: IconT.Name

    /**
     * Text to display in the next button.
     */
    nextText?: string

    /**
     * Icon name for the ellipsis indicator.
     * @default 'icon-ellipsis'
     */
    ellipsisIcon?: IconT.Name

    /**
     * Function to generate a destination URL for a given page number.
     * If provided, pagination items will render as anchor tags.
     */
    to?: (page: number) => string | undefined
  }

  /**
   * Props for the Pagination component.
   */
  export type Props = BaseProps<'nav', Base, Variant, Classes, Styles>
}

/**
 * Props for the Pagination component.
 */
export interface PaginationProps extends PaginationT.Props {}
