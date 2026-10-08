import type { JSX } from 'solid-js'
import { For, Show, mergeProps, splitProps } from 'solid-js'

import { Button } from '../../element/button'
import type { ButtonProps } from '../../element/button'
import { Icon } from '../../element/icon'
import { createStyles } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { createControllableValue } from '../../shared/controllable-value'
import type { ValidComponent } from '../../shared/types'
import { callRef } from '../../shared/utils'
import { VISUALLY_HIDDEN_CLASS } from '../../theme/recipe-common.class'

import { paginationDataAttributes, paginationRecipe } from './pagination.recipe'
import type { PaginationProps } from './pagination.types'

interface InteractiveProps {
  as?: ValidComponent
  href?: string
  rel?: string
  type?: 'button'
  disabled?: boolean
}

const MAX_SIBLING_COUNT = 100
const ELLIPSIS = -1

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
  const messages = useMessages()

  const merged = mergeProps(
    {
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

  const [page, setPage] = createControllableValue<number>({
    value: () =>
      merged.page !== undefined
        ? normalizeInteger(merged.page, 1, 1, Number.MAX_SAFE_INTEGER)
        : undefined,
    defaultValue: () => normalizeInteger(merged.defaultPage, 1, 1, Number.MAX_SAFE_INTEGER),
  })

  const pageCount = () => {
    const safeItemsPerPage = normalizeInteger(merged.itemsPerPage, 10, 1, Number.MAX_SAFE_INTEGER)
    const safeTotal = normalizeInteger(merged.total, 0, 0, Number.MAX_SAFE_INTEGER)
    return Math.max(1, Math.ceil(safeTotal / safeItemsPerPage))
  }

  const currentPage = () => clampPage(page(), pageCount())

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

    setPage(next)
    merged.onPageChange?.(next)
  }

  const getItemProps = (target: number): InteractiveProps => {
    if (merged.disabled) {
      return { as: 'button', type: 'button', disabled: true }
    }

    const isCurrent = target === currentPage()
    const href = isCurrent ? undefined : merged.to?.(target)
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
    const pagination = messages().pagination
    return isCurrent ? pagination.currentPage({ page, total }) : pagination.page({ page, total })
  }

  const getPrevLabel = (): string => {
    const current = currentPage()
    return messages().pagination.prev({ page: current <= 1 ? undefined : current - 1 })
  }

  const getNextLabel = (): string => {
    const current = currentPage()
    const total = pageCount()
    return messages().pagination.next({ page: current >= total ? undefined : current + 1 })
  }

  return (
    <nav
      ref={(el) => callRef(local.ref, el)}
      data-slot="pagination"
      role={merged.role}
      {...resolved.styles.root}
      {...rest}
      aria-label={rest['aria-label'] ?? messages().pagination.label}
    >
      <ul data-slot="pagination-list" {...resolved.styles.list}>
        <Show when={merged.showControls}>
          <li data-slot="pagination-list-item" {...resolved.styles.listItem}>
            <Button
              slotName="pagination-prev"
              variant={resolved.variants.controlVariant}
              size={getSize(resolved.variants.size, merged.prevText)}
              aria-label={getPrevLabel()}
              {...paginationDataAttributes.prev({
                disabled: undefined,
                loading: undefined,
                text: () => Boolean(merged.prevText),
              })}
              {...resolved.styles.prev}
              classes={{ label: merged.prevText ? resolved.styles.controlLabel.class : undefined }}
              styles={{ label: merged.prevText ? resolved.styles.controlLabel.style : undefined }}
              onClick={(event) => selectPage(currentPage() - 1, event)}
              {...getControlProps(currentPage() - 1, currentPage() <= 1, 'prev')}
              leading={merged.prevText ? merged.prevIcon : undefined}
            >
              <Show when={merged.prevText} fallback={<Icon name={merged.prevIcon} />}>
                {merged.prevText}
              </Show>
            </Button>
          </li>
        </Show>

        <For each={paginationItems()}>
          {(item) => {
            const isActive = () => item === currentPage()
            return (
              <li
                data-slot="pagination-list-item"
                aria-hidden={item === ELLIPSIS ? true : undefined}
                {...paginationDataAttributes.ellipsis({
                  ellipsis: () => item === ELLIPSIS,
                })}
                {...resolved.styles.listItem}
              >
                <Show
                  when={item !== ELLIPSIS}
                  fallback={
                    <Icon
                      slotName="pagination-ellipsis"
                      name={merged.ellipsisIcon}
                      {...resolved.styles.ellipsis}
                    />
                  }
                >
                  <Button
                    slotName="pagination-item"
                    variant={
                      isActive() ? resolved.variants.activeVariant : resolved.variants.variant
                    }
                    size={getSize(resolved.variants.size)}
                    aria-current={isActive() ? 'page' : undefined}
                    aria-label={getPageLabel(item, isActive())}
                    {...paginationDataAttributes.item({
                      current: isActive,
                      disabled: undefined,
                      loading: undefined,
                    })}
                    {...resolved.styles.item}
                    onClick={(event) => selectPage(item, event)}
                    {...getItemProps(item)}
                  >
                    {item}
                  </Button>
                </Show>
              </li>
            )
          }}
        </For>

        <Show when={merged.showControls}>
          <li data-slot="pagination-list-item" {...resolved.styles.listItem}>
            <Button
              slotName="pagination-next"
              variant={resolved.variants.controlVariant}
              size={getSize(resolved.variants.size, merged.nextText)}
              aria-label={getNextLabel()}
              {...paginationDataAttributes.next({
                disabled: undefined,
                loading: undefined,
                text: () => Boolean(merged.nextText),
              })}
              {...resolved.styles.next}
              classes={{ label: merged.nextText ? resolved.styles.controlLabel.class : undefined }}
              styles={{ label: merged.nextText ? resolved.styles.controlLabel.style : undefined }}
              onClick={(event) => selectPage(currentPage() + 1, event)}
              trailing={merged.nextText ? merged.nextIcon : undefined}
              {...getControlProps(currentPage() + 1, currentPage() >= pageCount(), 'next')}
            >
              <Show when={merged.nextText} fallback={<Icon name={merged.nextIcon} />}>
                {merged.nextText}
              </Show>
            </Button>
          </li>
        </Show>
      </ul>

      <div
        data-slot="pagination-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        class={VISUALLY_HIDDEN_CLASS}
      >
        {messages().pagination.status({ page: currentPage(), total: pageCount() })}
      </div>
    </nav>
  )
}
