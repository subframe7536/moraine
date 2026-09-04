import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { Button } from '../../elements/button/index.ts'
import type { ButtonProps } from '../../elements/button/index.ts'
import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn } from '../../shared/utils.ts'

import {
  PAGINATION_CONTROL_LABEL_CLASS,
  PAGINATION_ELLIPSIS_CLASS,
  PAGINATION_ITEM_CLASS,
  PAGINATION_LIST_CLASS,
  PAGINATION_NEXT_CLASS,
  PAGINATION_PREV_CLASS,
  PAGINATION_ROOT_CLASS,
} from './pagination.class.ts'

type PaginationVariant = ButtonProps['variant']

const MAX_SIBLING_COUNT = 100

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

    /**
     * Slot-based class overrides.
     */
    classes?: Classes

    /**
     * Slot-based style overrides.
     */
    styles?: Styles
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

function clampPage(page: number, count: number): number {
  return Math.min(Math.max(page, 1), Math.max(count, 1))
}

function normalizeInteger(value: number | undefined, fallback: number, min: number, max: number) {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(Math.max(Math.trunc(value), min), max)
}

function createRange(start: number, end: number): number[] {
  if (end < start) {
    return []
  }
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function getSize(size: string | undefined, text?: string): ButtonProps['size'] {
  return (text ? size : `icon-${size}`) as ButtonProps['size']
}

/**
 * Page navigation component with configurable sibling count and edge display.
 */
export function Pagination(props: PaginationProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'page',
    'defaultPage',
    'onPageChange',
    'itemsPerPage',
    'total',
    'siblingCount',
    'showControls',
    'disabled',
    'size',
    'variant',
    'activeVariant',
    'controlVariant',
    'prevIcon',
    'prevText',
    'nextIcon',
    'nextText',
    'ellipsisIcon',
    'to',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const config = useMoraineConfig()
  const providerPagination = () => config().pagination

  const merged = mergeProps(
    {
      'aria-label': 'Pagination',
      role: 'navigation' as const,
      itemsPerPage: 10,
      total: 0,
      siblingCount: 2,
      showControls: true,
      size: 'md' as const,
      variant: 'ghost' as const,
      activeVariant: 'outline' as const,
      controlVariant: 'ghost' as const,
      prevIcon: 'icon-chevron-left' as const,
      nextIcon: 'icon-chevron-right' as const,
      ellipsisIcon: 'icon-ellipsis' as const,
      defaultPage: 1,
    },
    () => providerPagination()?.variants,
    local,
  )

  const resolved = resolveComponentStyle({
    get provider() {
      return providerPagination()
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  const [internalPage, setInternalPage] = createSignal(
    normalizeInteger(merged.defaultPage, 1, 1, Number.MAX_SAFE_INTEGER),
  )

  const pageCount = createMemo(() => {
    const safeItemsPerPage = normalizeInteger(merged.itemsPerPage, 10, 1, Number.MAX_SAFE_INTEGER)
    const safeTotal = normalizeInteger(merged.total, 0, 0, Number.MAX_SAFE_INTEGER)
    return Math.max(1, Math.ceil(safeTotal / safeItemsPerPage))
  })

  const resolvedPage = createMemo(() =>
    clampPage(
      normalizeInteger(merged.page ?? internalPage(), 1, 1, Number.MAX_SAFE_INTEGER),
      pageCount(),
    ),
  )

  const paginationItems = createMemo(() => {
    const page = resolvedPage()
    const count = pageCount()
    const siblings = normalizeInteger(merged.siblingCount, 2, 0, MAX_SIBLING_COUNT)

    if (siblings * 2 + 5 >= count) {
      return createRange(1, count)
    }

    const left = Math.max(page - siblings, 1)
    const right = Math.min(page + siblings, count)
    const showLeft = left > 2
    const showRight = right < count - 1

    if (!showLeft && showRight) {
      return [...createRange(1, 3 + siblings * 2), -1, count]
    }
    if (showLeft && !showRight) {
      return [1, -1, ...createRange(count - (2 + siblings * 2), count)]
    }
    return [1, -1, ...createRange(left, right), -1, count]
  })

  const selectPage = (targetPage: number, event?: MouseEvent): void => {
    if (event?.defaultPrevented || merged.disabled) {
      return
    }

    const next = clampPage(targetPage, pageCount())
    if (next === resolvedPage()) {
      return
    }

    if (merged.page === undefined) {
      setInternalPage(next)
    }
    merged.onPageChange?.(next)
  }

  const getControlProps = (
    target: number,
    isEdge: boolean,
    rel?: string,
  ): {
    as?: 'a'
    href?: string
    rel?: string
    type?: 'button'
    disabled?: boolean
  } => {
    const disabled = Boolean(merged.disabled) || isEdge
    const href = disabled ? undefined : merged.to?.(target)
    return href ? { as: 'a' as const, href, rel } : { type: 'button' as const, disabled }
  }

  const getPageLabel = (page: number, isCurrent: boolean): string => {
    const total = pageCount()
    if (isCurrent) {
      return `Page ${page} of ${total}, current page`
    }
    return `Go to page ${page} of ${total}`
  }

  const getPrevLabel = (): string => {
    const current = resolvedPage()
    if (current <= 1) {
      return 'Go to previous page'
    }
    return `Go to previous page, page ${current - 1}`
  }

  const getNextLabel = (): string => {
    const current = resolvedPage()
    const total = pageCount()
    if (current >= total) {
      return 'Go to next page'
    }
    return `Go to next page, page ${current + 1}`
  }

  const hasPrevText = createMemo(() => Boolean(merged.prevText))
  const hasNextText = createMemo(() => Boolean(merged.nextText))

  return (
    <nav
      data-slot="root"
      aria-label={merged['aria-label']}
      role={merged.role}
      style={resolved.rootStyle()}
      class={cn(PAGINATION_ROOT_CLASS, resolved.rootClass())}
      {...rest}
    >
      <ul
        data-slot="list"
        style={resolved.slotStyle('list')}
        class={cn(PAGINATION_LIST_CLASS, resolved.slotClass('list'))}
      >
        <Show when={merged.showControls}>
          <li
            data-slot="item"
            style={resolved.slotStyle('item')}
            class={cn(PAGINATION_ITEM_CLASS, resolved.slotClass('item'))}
          >
            <Button
              data-slot="prev"
              style={resolved.slotStyle('prev')}
              variant={merged.controlVariant}
              size={getSize(merged.size, hasPrevText() ? merged.prevText : undefined)}
              aria-label={getPrevLabel()}
              class={[hasPrevText() && PAGINATION_PREV_CLASS, resolved.slotClass('prev')]}
              classes={{ label: hasPrevText() && PAGINATION_CONTROL_LABEL_CLASS }}
              onClick={(event) => selectPage(resolvedPage() - 1, event)}
              {...getControlProps(resolvedPage() - 1, resolvedPage() <= 1, 'prev')}
              leading={hasPrevText() ? merged.prevIcon : undefined}
            >
              <Show when={hasPrevText()} fallback={<Icon name={merged.prevIcon} />}>
                {merged.prevText}
              </Show>
            </Button>
          </li>
        </Show>

        <For each={paginationItems()}>
          {(item) => {
            const isActive = () => item === resolvedPage()
            return (
              <li
                data-slot="item"
                style={resolved.slotStyle('item')}
                aria-hidden={item < 0 ? true : undefined}
                class={cn(
                  item < 0 ? PAGINATION_ELLIPSIS_CLASS : PAGINATION_ITEM_CLASS,
                  resolved.slotClass('item'),
                )}
              >
                <Show
                  when={item >= 0}
                  fallback={
                    <Icon
                      slotName="ellipsis"
                      style={resolved.slotStyle('ellipsis')}
                      name={merged.ellipsisIcon}
                      class={resolved.slotClass('ellipsis')}
                    />
                  }
                >
                  <Button
                    data-slot="link"
                    style={resolved.slotStyle('link')}
                    variant={isActive() ? merged.activeVariant : merged.variant}
                    size={getSize(merged.size)}
                    aria-current={isActive() ? 'page' : undefined}
                    aria-label={getPageLabel(item, isActive())}
                    data-current={isActive() ? '' : undefined}
                    class={cn('outline-none', resolved.slotClass('link'))}
                    onClick={(event) => selectPage(item, event)}
                    {...getControlProps(item, false)}
                  >
                    {item}
                  </Button>
                </Show>
              </li>
            )
          }}
        </For>

        <Show when={merged.showControls}>
          <li
            data-slot="item"
            style={resolved.slotStyle('item')}
            class={cn(PAGINATION_ITEM_CLASS, resolved.slotClass('item'))}
          >
            <Button
              data-slot="next"
              style={resolved.slotStyle('next')}
              variant={merged.controlVariant}
              size={getSize(merged.size, hasNextText() ? merged.nextText : undefined)}
              aria-label={getNextLabel()}
              class={[hasNextText() && PAGINATION_NEXT_CLASS, resolved.slotClass('next')]}
              classes={{ label: hasNextText() && PAGINATION_CONTROL_LABEL_CLASS }}
              onClick={(event) => selectPage(resolvedPage() + 1, event)}
              {...getControlProps(resolvedPage() + 1, resolvedPage() >= pageCount(), 'next')}
              trailing={hasNextText() ? merged.nextIcon : undefined}
            >
              <Show when={hasNextText()} fallback={<Icon name={merged.nextIcon} />}>
                {merged.nextText}
              </Show>
            </Button>
          </li>
        </Show>
      </ul>

      <div data-slot="status" role="status" aria-live="polite" aria-atomic="true" class="sr-only">
        Page {resolvedPage()} of {pageCount()}
      </div>
    </nav>
  )
}
