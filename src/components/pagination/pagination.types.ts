import type { Component, JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps, ElementProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'

import type { defaultPaginationMessages } from './pagination.messages'
import type { PaginationStyleSlot, PaginationStyleVariants } from './pagination.style-types'

export namespace PaginationT {
  export type Kind = 'single'

  export type Slot<T = unknown> = PaginationStyleSlot<T>

  export type Variants = PaginationStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultPaginationMessages>
  export type Translations = Partial<Messages>

  /** Native anchor props passed to a custom page item component, including its ref and handlers. */
  export type ItemRenderProps = ElementProps<
    HTMLAnchorElement,
    JSX.AnchorHTMLAttributes<HTMLAnchorElement>
  >

  /** Native anchor props passed to a custom previous or next control component. */
  export type ControlRenderProps = ItemRenderProps

  /**
   * Base props for the Pagination component.
   */
  export interface Base {
    /**
     * Overrides for the localized accessibility strings of this instance; omitted keys fall back to
     * the locale defaults. `label` is the `nav` label; `status`, `page` and `currentPage` receive
     * `{ page, pageCount }`; `prev` and `next` receive `{ page }`, which is `undefined` when
     * already at that edge.
     * @example
     * ```tsx
     * import { Pagination } from 'moraine'
     *
     * <Pagination
     *   total={100}
     *   translations={{
     *     label: 'Pages des résultats',
     *     status: ({ page, pageCount }) => `Page ${page} sur ${pageCount}`,
     *     prev: () => 'Page précédente',
     *     next: () => 'Page suivante',
     *   }}
     * />
     * ```
     */
    translations?: Translations
    /**
     * Ref forwarded to the root `<nav>` element.
     */
    ref?: Ref<HTMLElement>

    /**
     * Controlled current page number (1-indexed). While `undefined` the page is uncontrolled and
     * follows `defaultPage`. Non-integers are truncated and the displayed page is clamped to the
     * valid range.
     */
    page?: number

    /**
     * Initial page number when uncontrolled. Ignored when `page` is set.
     * @default 1
     */
    defaultPage?: number

    /**
     * Called with the new page number when the user selects a different page through a numbered
     * item or the previous and next controls. It does not fire for the current page or while
     * `disabled`, and it fires in controlled mode too, so a controlled pagination must write the
     * value back to `page`.
     */
    onPageChange?: (page: number) => void

    /**
     * Number of items per page. Together with `total` it sets the page count,
     * `ceil(total / pageSize)`. Truncated to an integer of at least 1; invalid values fall back to
     * the default.
     * @default 10
     */
    pageSize?: number

    /**
     * Total number of items (records) across all pages, not the number of pages. The page count is
     * at least 1, so `0` still renders a single page.
     * @default 0
     */
    total?: number

    /**
     * Number of page buttons to show on either side of the current page.
     * Finite integer values are clamped between 0 and 100. When `2 * siblingCount + 5` is at least
     * the page count, every page is shown without ellipses.
     * @default 2
     */
    siblingCount?: number

    /**
     * Whether to show previous and next control buttons.
     * @default true
     */
    controls?: boolean

    /**
     * Disables every page item and control; they render as disabled buttons without links.
     * @default false
     */
    disabled?: boolean

    /**
     * Icon name for the previous button.
     * @default 'icon-chevron-left'
     */
    prevIcon?: IconT.Name

    /**
     * Text shown in the previous button. When set, the control shows the text with `prevIcon`
     * before it instead of an icon-only button, and the text replaces `translations.prev` as its
     * accessible name. The `controlLabel` slot hides the text visually below the `sm` breakpoint; it still names the control.
     */
    prevText?: string

    /**
     * Icon name for the next button.
     * @default 'icon-chevron-right'
     */
    nextIcon?: IconT.Name

    /**
     * Text shown in the next button. When set, the control shows the text with `nextIcon` after it
     * instead of an icon-only button, and the text replaces `translations.next` as its accessible
     * name. The `controlLabel` slot hides the text visually below the `sm` breakpoint; it still names the control.
     */
    nextText?: string

    /**
     * Icon name for the ellipsis indicator.
     * @default 'icon-ellipsis'
     */
    ellipsisIcon?: IconT.Name

    /**
     * Builds the destination URL for a page number. It is called with the target page of each
     * numbered item other than the current page, and of the previous and next controls. An item
     * that gets a URL renders as `<a href>` (or through `itemRender` / `controlRender` when set) and still calls
     * `onPageChange` on click; returning `undefined` keeps a plain button. It is ignored while
     * `disabled`, and previous on the first page and next on the last page stay disabled buttons.
     * @example
     * ```tsx
     * import { Pagination } from 'moraine'
     *
     * <Pagination total={100} pageSize={10} getPageHref={(page) => `/posts?page=${page}`} />
     * ```
     */
    getPageHref?: (page: number) => string | undefined

    /**
     * Component that renders every numbered page item in place of the default element, for example
     * a router link. It is mounted as a component and receives the item's native anchor props,
     * including `href` when `getPageHref` returns a URL, plus `class`, `children`, and handlers;
     * spread them onto the rendered element. By default an item renders as `<a>` when it has a URL
     * and as a `button` otherwise. Ignored while `disabled`.
     * @example
     * ```tsx
     * import { Pagination } from 'moraine'
     * import type { PaginationT } from 'moraine'
     *
     * const RouterLink = (props: PaginationT.ItemRenderProps) => <a {...props} />
     *
     * <Pagination
     *   total={100}
     *   pageSize={10}
     *   getPageHref={(page) => `/posts?page=${page}`}
     *   itemRender={RouterLink}
     * />
     * ```
     */
    itemRender?: Component<ItemRenderProps>

    /**
     * Component that renders the previous and next controls, like `itemRender` for page items. It
     * receives `href` and `rel` (`prev` or `next`) when `getPageHref` returns a URL. Controls at an
     * edge and all controls while `disabled` stay disabled buttons.
     */
    controlRender?: Component<ControlRenderProps>
  }

  /**
   * Props for the Pagination component.
   */
  export type Props = BaseProps<'nav', Base, Variants, Classes, Styles>
}

/**
 * Props for the Pagination component.
 */
export type PaginationProps = PaginationT.Props
