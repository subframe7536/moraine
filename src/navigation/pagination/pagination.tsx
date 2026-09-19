import type { JSX } from 'solid-js'
import { For, Show, createSignal, mergeProps, splitProps } from 'solid-js'

import { Button } from '../../elements/button'
import type { ButtonProps } from '../../elements/button'
import { Icon } from '../../elements/icon'
import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types.ts'
import { callRef } from '../../shared/utils'

import { paginationRecipe } from './pagination.recipe'
import type { PaginationProps } from './pagination.types'

const MAX_SIBLING_COUNT = 100
const ELLIPSIS = -1

type PaginationButtonProps = ButtonProps<ValidComponent> & {
  onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
  type?: 'button'
}

const PaginationButton = Button as (props: PaginationButtonProps) => JSX.Element

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

function getPaginationItems(page: number, count: number, siblingCount: number): number[] {
  if (siblingCount * 2 + 5 >= count) {
    return createRange(1, count)
  }

  const left = Math.max(page - siblingCount, 1)
  const right = Math.min(page + siblingCount, count)
  const showLeft = left > 2
  const showRight = right < count - 1

  if (!showLeft && showRight) {
    return [...createRange(1, 3 + siblingCount * 2), ELLIPSIS, count]
  }
  if (showLeft && !showRight) {
    return [1, ELLIPSIS, ...createRange(count - (2 + siblingCount * 2), count)]
  }
  return [1, ELLIPSIS, ...createRange(left, right), ELLIPSIS, count]
}

interface InteractiveProps {
  as: ValidComponent
  href?: string
  rel?: string
  type?: 'button'
  disabled?: boolean
}

function getSize(size: string | null | undefined, text?: string): ButtonProps['size'] {
  if (size === null || size === undefined) {
    return size
  }
  return (text ? size : `icon-${size}`) as ButtonProps['size']
}

/**
 * Page navigation component with configurable sibling count and edge display.
 */
export function Pagination(props: PaginationProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'ref',
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
    'itemAs',
    'controlAs',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createStyles(paginationRecipe, local)

  const merged = mergeProps(
    {
      'aria-label': 'Pagination',
      role: 'navigation' as const,
      itemsPerPage: 10,
      total: 0,
      siblingCount: 2,
      showControls: true,

      prevIcon: 'icon-chevron-left' as const,
      nextIcon: 'icon-chevron-right' as const,
      ellipsisIcon: 'icon-ellipsis' as const,
      defaultPage: 1,
    },

    local,
  )

  const [internalPage, setInternalPage] = createSignal(
    normalizeInteger(merged.defaultPage, 1, 1, Number.MAX_SAFE_INTEGER),
  )

  const pageCount = () => {
    const safeItemsPerPage = normalizeInteger(merged.itemsPerPage, 10, 1, Number.MAX_SAFE_INTEGER)
    const safeTotal = normalizeInteger(merged.total, 0, 0, Number.MAX_SAFE_INTEGER)
    return Math.max(1, Math.ceil(safeTotal / safeItemsPerPage))
  }

  const currentPage = () =>
    clampPage(
      normalizeInteger(merged.page ?? internalPage(), 1, 1, Number.MAX_SAFE_INTEGER),
      pageCount(),
    )

  const paginationItems = () =>
    getPaginationItems(
      currentPage(),
      pageCount(),
      normalizeInteger(merged.siblingCount, 2, 0, MAX_SIBLING_COUNT),
    )

  const selectPage = (targetPage: number, event?: MouseEvent): void => {
    if (event?.defaultPrevented || merged.disabled) {
      return
    }

    const next = clampPage(targetPage, pageCount())
    if (next === currentPage()) {
      return
    }

    if (merged.page === undefined) {
      setInternalPage(next)
    }
    merged.onPageChange?.(next)
  }

  const getItemProps = (target: number): InteractiveProps => {
    if (merged.disabled) {
      return { as: 'button', type: 'button', disabled: true }
    }

    const href = merged.to?.(target)
    if (merged.itemAs) {
      return href ? { as: merged.itemAs, href } : { as: merged.itemAs }
    }
    return href ? { as: 'a', href } : { as: 'button', type: 'button' }
  }

  const getControlProps = (target: number, isEdge: boolean, rel?: string): InteractiveProps => {
    if (merged.disabled || isEdge) {
      return { as: 'button', type: 'button', disabled: true }
    }

    const href = merged.to?.(target)
    if (merged.controlAs) {
      return href ? { as: merged.controlAs, href, rel } : { as: merged.controlAs }
    }
    return href ? { as: 'a', href, rel } : { as: 'button', type: 'button' }
  }

  const getPageLabel = (page: number, isCurrent: boolean): string => {
    const total = pageCount()
    if (isCurrent) {
      return `Page ${page} of ${total}, current page`
    }
    return `Go to page ${page} of ${total}`
  }

  const getPrevLabel = (): string => {
    const current = currentPage()
    if (current <= 1) {
      return 'Go to previous page'
    }
    return `Go to previous page, page ${current - 1}`
  }

  const getNextLabel = (): string => {
    const current = currentPage()
    const total = pageCount()
    if (current >= total) {
      return 'Go to next page'
    }
    return `Go to next page, page ${current + 1}`
  }

  return (
    <nav
      ref={(el) => callRef(local.ref, el)}
      data-slot="root"
      aria-label={merged['aria-label']}
      role={merged.role}
      {...resolved.styles.root}
      {...rest}
    >
      <ul data-slot="list" {...resolved.styles.list}>
        <Show when={merged.showControls}>
          <li data-slot="list-item" {...resolved.styles.listItem}>
            <PaginationButton
              data-slot="prev"
              variant={resolved.variants.controlVariant}
              size={getSize(resolved.variants.size, merged.prevText)}
              aria-label={getPrevLabel()}
              data-text={merged.prevText ? '' : undefined}
              {...resolved.styles.prev}
              classes={{ label: merged.prevText ? resolved.styles.controlLabel.class : undefined }}
              onClick={(event) => selectPage(currentPage() - 1, event)}
              {...getControlProps(currentPage() - 1, currentPage() <= 1, 'prev')}
              leading={merged.prevText ? merged.prevIcon : undefined}
            >
              <Show when={merged.prevText} fallback={<Icon name={merged.prevIcon} />}>
                {merged.prevText}
              </Show>
            </PaginationButton>
          </li>
        </Show>

        <For each={paginationItems()}>
          {(item) => {
            const isActive = () => item === currentPage()
            return (
              <li
                data-slot="list-item"
                aria-hidden={item === ELLIPSIS ? true : undefined}
                data-ellipsis={item === ELLIPSIS ? '' : undefined}
                {...resolved.styles.listItem}
              >
                <Show
                  when={item !== ELLIPSIS}
                  fallback={
                    <Icon
                      slotName="ellipsis"
                      name={merged.ellipsisIcon}
                      {...resolved.styles.ellipsis}
                    />
                  }
                >
                  <PaginationButton
                    data-slot="item"
                    variant={
                      isActive() ? resolved.variants.activeVariant : resolved.variants.variant
                    }
                    size={getSize(resolved.variants.size)}
                    aria-current={isActive() ? 'page' : undefined}
                    aria-label={getPageLabel(item, isActive())}
                    data-current={isActive() ? '' : undefined}
                    {...resolved.styles.item}
                    onClick={(event) => selectPage(item, event)}
                    {...getItemProps(item)}
                  >
                    {item}
                  </PaginationButton>
                </Show>
              </li>
            )
          }}
        </For>

        <Show when={merged.showControls}>
          <li data-slot="list-item" {...resolved.styles.listItem}>
            <PaginationButton
              data-slot="next"
              variant={resolved.variants.controlVariant}
              size={getSize(resolved.variants.size, merged.nextText)}
              aria-label={getNextLabel()}
              data-text={merged.nextText ? '' : undefined}
              {...resolved.styles.next}
              classes={{ label: merged.nextText ? resolved.styles.controlLabel.class : undefined }}
              onClick={(event) => selectPage(currentPage() + 1, event)}
              {...getControlProps(currentPage() + 1, currentPage() >= pageCount(), 'next')}
              trailing={merged.nextText ? merged.nextIcon : undefined}
            >
              <Show when={merged.nextText} fallback={<Icon name={merged.nextIcon} />}>
                {merged.nextText}
              </Show>
            </PaginationButton>
          </li>
        </Show>
      </ul>

      <div data-slot="status" role="status" aria-live="polite" aria-atomic="true" class="sr-only">
        Page {currentPage()} of {pageCount()}
      </div>
    </nav>
  )
}
