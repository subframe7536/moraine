import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { Button } from '../../elements/button/index.ts'
import type { ButtonProps } from '../../elements/button/index.ts'
import { Icon } from '../../elements/icon/index.ts'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { callRef } from '../../shared/utils.ts'

import type { PaginationProps } from './pagination.types.ts'

export * from './pagination.types.ts'

const MAX_SIBLING_COUNT = 100

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
    'classes',
    'styles',
    'class',
    'style',
  ])
  const design = useMoraineDesign()
  const paginationDesign = () => design().pagination

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
    () => paginationDesign()?.defaultVariants,
    local,
  )

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return paginationDesign()?.recipe()
      },
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
      ref={(el) => callRef(local.ref, el)}
      data-slot="root"
      aria-label={merged['aria-label']}
      role={merged.role}
      {...resolved.rootClassAndStyle()}
      {...rest}
    >
      <ul data-slot="list" {...resolved.slotClassAndStyle('list')}>
        <Show when={merged.showControls}>
          <li data-slot="item" {...resolved.slotClassAndStyle('item')}>
            <Button
              data-slot="prev"
              variant={merged.controlVariant}
              size={getSize(merged.size, hasPrevText() ? merged.prevText : undefined)}
              aria-label={getPrevLabel()}
              data-text={hasPrevText() ? '' : undefined}
              {...resolved.slotClassAndStyle('prev')}
              classes={{ label: hasPrevText() ? resolved.slotClass('controlLabel') : undefined }}
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
                aria-hidden={item < 0 ? true : undefined}
                data-ellipsis={item < 0 ? '' : undefined}
                {...resolved.slotClassAndStyle('item')}
              >
                <Show
                  when={item >= 0}
                  fallback={
                    <Icon
                      slotName="ellipsis"
                      name={merged.ellipsisIcon}
                      {...resolved.slotClassAndStyle('ellipsis')}
                    />
                  }
                >
                  <Button
                    data-slot="link"
                    variant={isActive() ? merged.activeVariant : merged.variant}
                    size={getSize(merged.size)}
                    aria-current={isActive() ? 'page' : undefined}
                    aria-label={getPageLabel(item, isActive())}
                    data-current={isActive() ? '' : undefined}
                    {...resolved.slotClassAndStyle('link')}
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
          <li data-slot="item" {...resolved.slotClassAndStyle('item')}>
            <Button
              data-slot="next"
              variant={merged.controlVariant}
              size={getSize(merged.size, hasNextText() ? merged.nextText : undefined)}
              aria-label={getNextLabel()}
              data-text={hasNextText() ? '' : undefined}
              {...resolved.slotClassAndStyle('next')}
              classes={{ label: hasNextText() ? resolved.slotClass('controlLabel') : undefined }}
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
