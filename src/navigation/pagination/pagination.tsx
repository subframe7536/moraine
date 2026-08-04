import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { Button } from '../../elements/button/index.ts'
import type { ButtonProps } from '../../elements/button/index.ts'
import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import type { FormFieldSize } from '../../forms/form-field/form-field-context.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn } from '../../shared/utils.ts'

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
  }
  export type Variant = never
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
     * Size of the pagination buttons.
     * @default 'md'
     */
    size?: FormFieldSize

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
  export type Props = BaseProps<'nav', Base, Variant, Slot>
}

/**
 * Props for the Pagination component.
 */
export interface PaginationProps extends PaginationT.Props {}

function clampPage(page: number, count: number): number {
  return Math.min(Math.max(page, 1), Math.max(count, 1))
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
  const merged = mergeProps(
    {
      'aria-label': 'Pagination',
      role: 'navigation' as JSX.HTMLAttributes<HTMLElement>['role'],
      itemsPerPage: 10,
      total: 0,
      siblingCount: 2,
      showControls: true,
      size: 'md' as PaginationProps['size'],
      variant: 'ghost' as PaginationVariant,
      activeVariant: 'outline' as PaginationVariant,
      controlVariant: 'ghost' as PaginationVariant,
      prevIcon: 'icon-chevron-left' as IconT.Name,
      nextIcon: 'icon-chevron-right' as IconT.Name,
      ellipsisIcon: 'icon-ellipsis' as IconT.Name,
      defaultPage: 1,
    },
    local,
  )

  const [internalPage, setInternalPage] = createSignal(merged.defaultPage || 1)

  const pageCount = createMemo(() => {
    const safeItemsPerPage = Math.max(1, merged.itemsPerPage || 1)
    const safeTotal = Math.max(0, merged.total || 0)
    return Math.max(1, Math.ceil(safeTotal / safeItemsPerPage))
  })

  const resolvedPage = createMemo(() => clampPage(merged.page ?? internalPage(), pageCount()))

  const paginationItems = createMemo(() => {
    const page = resolvedPage()
    const count = pageCount()
    const siblings = Math.max(0, merged.siblingCount || 0)

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

  const selectPage = (targetPage: number): void => {
    if (merged.disabled) {
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
    const disabled = Boolean(merged.disabled || isEdge)
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

  return (
    <nav
      data-slot="root"
      aria-label={merged['aria-label']}
      role={merged.role}
      style={{ ...merged.styles?.root, ...merged.style }}
      class={cn('w-full', merged.classes?.root, merged.class)}
      {...rest}
    >
      <ul
        data-slot="list"
        style={merged.styles?.list}
        class={cn('flex gap-1 items-center justify-center', merged.classes?.list)}
      >
        <Show when={merged.showControls}>
          <li data-slot="item" style={merged.styles?.item} class={cn(merged.classes?.item)}>
            <Button
              data-slot="prev"
              style={merged.styles?.prev}
              variant={merged.controlVariant}
              size={getSize(merged.size, merged.prevText)}
              aria-label={getPrevLabel()}
              class={merged.classes?.prev}
              onClick={() => selectPage(resolvedPage() - 1)}
              {...getControlProps(resolvedPage() - 1, resolvedPage() <= 1, 'prev')}
              leading={<Icon name={merged.prevIcon} />}
            >
              {merged.prevText}
            </Button>
          </li>
        </Show>

        <For each={paginationItems()}>
          {(item) => {
            const isActive = () => item === resolvedPage()
            return (
              <li
                data-slot="item"
                style={merged.styles?.item}
                aria-hidden={item < 0 ? true : undefined}
                class={cn(item < 0 && 'flex size-6 items-center', merged.classes?.item)}
              >
                <Show
                  when={item >= 0}
                  fallback={
                    <Icon
                      slotName="ellipsis"
                      style={merged.styles?.ellipsis}
                      name={merged.ellipsisIcon}
                      class={cn(merged.classes?.ellipsis)}
                    />
                  }
                >
                  <Button
                    data-slot="link"
                    style={merged.styles?.link}
                    variant={isActive() ? merged.activeVariant : merged.variant}
                    size={getSize(merged.size)}
                    aria-current={isActive() ? 'page' : undefined}
                    aria-label={getPageLabel(item, isActive())}
                    data-current={isActive() ? '' : undefined}
                    class={cn('outline-none', merged.classes?.link)}
                    onClick={() => selectPage(item)}
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
          <li data-slot="item" style={merged.styles?.item} class={cn(merged.classes?.item)}>
            <Button
              data-slot="next"
              style={merged.styles?.next}
              variant={merged.controlVariant}
              size={getSize(merged.size, merged.nextText)}
              aria-label={getNextLabel()}
              class={merged.classes?.next}
              onClick={() => selectPage(resolvedPage() + 1)}
              {...getControlProps(resolvedPage() + 1, resolvedPage() >= pageCount(), 'next')}
              trailing={<Icon name={merged.nextIcon} />}
            >
              {merged.nextText}
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
