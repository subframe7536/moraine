import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { Button } from '../../elements/button'
import type { ButtonProps } from '../../elements/button'
import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import type { FormFieldSize } from '../../forms/form-field/form-field-context'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'

type PaginationVariant = ButtonProps['variant']

export namespace PaginationT {
  export type Slot = 'root' | 'list' | 'item' | 'link' | 'prev' | 'next' | 'ellipsis'
  export type Variant = {}
  export interface Items {}
  export type Extend = never
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>

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
     * Accessibility label for the navigation element.
     * @default 'Pagination'
     */
    'aria-label'?: string

    /**
     * ARIA role for the navigation element.
     * @default 'navigation'
     */
    role?: JSX.HTMLAttributes<HTMLElement>['role']

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
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
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
  const merged = mergeProps(
    {
      'aria-label': 'Pagination',
      role: 'navigation',
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
    props,
  ) as PaginationProps

  const [styleProps, uiProps, pagingProps, restProps] = splitProps(
    merged,
    ['size', 'variant', 'activeVariant', 'controlVariant'],
    ['classes', 'styles', 'prevIcon', 'prevText', 'nextIcon', 'nextText', 'ellipsisIcon'],
    [
      'page',
      'defaultPage',
      'onPageChange',
      'itemsPerPage',
      'total',
      'siblingCount',
      'showControls',
      'disabled',
      'to',
    ],
  )

  const [internalPage, setInternalPage] = createSignal(pagingProps.defaultPage || 1)

  const pageCount = createMemo(() => {
    const safeItemsPerPage = Math.max(1, pagingProps.itemsPerPage || 1)
    const safeTotal = Math.max(0, pagingProps.total || 0)
    return Math.max(1, Math.ceil(safeTotal / safeItemsPerPage))
  })

  const resolvedPage = createMemo(() => clampPage(pagingProps.page ?? internalPage(), pageCount()))

  const paginationItems = createMemo(() => {
    const page = resolvedPage()
    const count = pageCount()
    const siblings = Math.max(0, pagingProps.siblingCount || 0)

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
    if (pagingProps.disabled) {
      return
    }

    const next = clampPage(targetPage, pageCount())
    if (next === resolvedPage()) {
      return
    }

    if (pagingProps.page === undefined) {
      setInternalPage(next)
    }
    pagingProps.onPageChange?.(next)
  }

  const getControlProps = (target: number, isEdge: boolean, rel?: string) => {
    const disabled = Boolean(pagingProps.disabled || isEdge)
    const href = disabled ? undefined : pagingProps.to?.(target)
    return href ? { as: 'a', href, rel } : { type: 'button', disabled }
  }

  return (
    <nav
      data-slot="root"
      style={uiProps.styles?.root}
      class={cn('w-full', uiProps.classes?.root)}
      {...restProps}
    >
      <ul
        data-slot="list"
        style={uiProps.styles?.list}
        class={cn('flex gap-1 items-center justify-center', uiProps.classes?.list)}
      >
        <Show when={pagingProps.showControls}>
          <li data-slot="item" style={uiProps.styles?.item} class={cn(uiProps.classes?.item)}>
            <Button
              data-slot="prev"
              style={uiProps.styles?.prev}
              variant={styleProps.controlVariant}
              size={getSize(styleProps.size, uiProps.prevText)}
              aria-label="Go to previous page"
              classes={{ root: uiProps.classes?.prev }}
              onClick={() => selectPage(resolvedPage() - 1)}
              {...getControlProps(resolvedPage() - 1, resolvedPage() <= 1, 'prev')}
              leading={<Icon name={uiProps.prevIcon} />}
            >
              {uiProps.prevText}
            </Button>
          </li>
        </Show>

        <For each={paginationItems()}>
          {(item) => {
            const isActive = () => item === resolvedPage()
            return (
              <li
                data-slot="item"
                style={uiProps.styles?.item}
                aria-hidden={item < 0 ? true : undefined}
                class={cn(item < 0 && 'flex size-6 items-center', uiProps.classes?.item)}
              >
                <Show
                  when={item >= 0}
                  fallback={
                    <Icon
                      slotName="ellipsis"
                      style={uiProps.styles?.ellipsis}
                      name={uiProps.ellipsisIcon}
                      class={cn(uiProps.classes?.ellipsis)}
                    />
                  }
                >
                  <Button
                    data-slot="link"
                    style={uiProps.styles?.link}
                    variant={isActive() ? styleProps.activeVariant : styleProps.variant}
                    size={getSize(styleProps.size)}
                    aria-current={isActive() ? 'page' : undefined}
                    aria-label={isActive() ? `Page ${item}, current page` : `Go to page ${item}`}
                    data-current={isActive() ? '' : undefined}
                    classes={{ root: ['outline-none', uiProps.classes?.link] }}
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

        <Show when={pagingProps.showControls}>
          <li data-slot="item" style={uiProps.styles?.item} class={cn(uiProps.classes?.item)}>
            <Button
              data-slot="next"
              style={uiProps.styles?.next}
              variant={styleProps.controlVariant}
              size={getSize(styleProps.size, uiProps.nextText)}
              aria-label="Go to next page"
              classes={{ root: uiProps.classes?.next }}
              onClick={() => selectPage(resolvedPage() + 1)}
              {...getControlProps(resolvedPage() + 1, resolvedPage() >= pageCount(), 'next')}
              trailing={<Icon name={uiProps.nextIcon} />}
            >
              {uiProps.nextText}
            </Button>
          </li>
        </Show>
      </ul>
    </nav>
  )
}
