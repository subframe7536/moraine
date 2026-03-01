import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { Button } from '../button'
import type { ButtonProps } from '../button'
import type { FieldGroupSize } from '../field-group'
import { Icon } from '../icon'
import type { IconName } from '../icon'
import type { SlotClasses } from '../shared/slot-class'
import { cn } from '../shared/utils'

type PaginationSlots = 'root' | 'list' | 'item' | 'control' | 'prev' | 'next' | 'ellipsis'

export type PaginationClasses = SlotClasses<PaginationSlots>

type PaginationVariant = ButtonProps['variant']

export interface PaginationBaseProps {
  page?: number
  defaultPage?: number
  onPageChange?: (page: number) => void
  itemsPerPage?: number
  total?: number
  siblingCount?: number
  showControls?: boolean
  disabled?: boolean
  size?: FieldGroupSize
  variant?: PaginationVariant
  activeVariant?: PaginationVariant
  controlVariant?: PaginationVariant
  prevIcon?: IconName
  prevText?: string
  nextIcon?: IconName
  nextText?: string
  ellipsisIcon?: IconName
  to?: (page: number) => string | undefined
  classes?: PaginationClasses
}

export type PaginationProps = PaginationBaseProps

function clampPage(page: number, count: number): number {
  return Math.min(Math.max(page, 1), Math.max(count, 1))
}

function createRange(start: number, end: number): number[] {
  if (end < start) {
    return []
  }
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export function Pagination(props: PaginationProps): JSX.Element {
  const merged = mergeProps(
    {
      'aria-label': 'pagination',
      itemsPerPage: 10,
      total: 0,
      siblingCount: 2,
      showControls: true,
      size: 'md' as PaginationBaseProps['size'],
      variant: 'ghost' as PaginationVariant,
      activeVariant: 'outline' as PaginationVariant,
      controlVariant: 'ghost' as PaginationVariant,
      prevIcon: 'icon-chevron-left' as IconName,
      nextIcon: 'icon-chevron-right' as IconName,
      ellipsisIcon: 'icon-ellipsis' as IconName,
      defaultPage: 1,
    },
    props,
  ) as PaginationProps

  const [styleProps, uiProps, pagingProps, rootProps] = splitProps(
    merged,
    ['size', 'variant', 'activeVariant', 'controlVariant'],
    ['classes', 'prevIcon', 'prevText', 'nextIcon', 'nextText', 'ellipsisIcon'],
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

  const size = createMemo(() => `icon-${styleProps.size!}` as const)
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
      return [...createRange(1, 3 + siblings * 2), 'ellipsis-end', count]
    }
    if (showLeft && !showRight) {
      return [1, 'ellipsis-start', ...createRange(count - (2 + siblings * 2), count)]
    }
    return [1, 'ellipsis-start', ...createRange(left, right), 'ellipsis-end', count]
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

  const getControlProps = (target: number, isEdge: boolean = false) => {
    const disabled = Boolean(pagingProps.disabled || isEdge)
    const href = disabled ? undefined : pagingProps.to?.(target)
    return href ? { as: 'a', href } : { type: 'button', disabled }
  }

  return (
    <nav data-slot="root" class={cn('w-full', uiProps.classes?.root)} {...rootProps}>
      <ul
        data-slot="list"
        class={cn('flex items-center justify-center gap-1', uiProps.classes?.list)}
      >
        <Show when={pagingProps.showControls}>
          <li data-slot="prev" class="me-2">
            <Button
              data-slot="control"
              variant={styleProps.controlVariant}
              size={size()}
              aria-label={uiProps.prevText || 'Previous'}
              onClick={() => selectPage(resolvedPage() - 1)}
              {...getControlProps(resolvedPage() - 1, resolvedPage() <= 1)}
              leading={<Icon name={uiProps.prevIcon} />}
            >
              {uiProps.prevText}
            </Button>
          </li>
        </Show>

        <For each={paginationItems()}>
          {(item) => {
            if (typeof item === 'string') {
              return (
                <li
                  data-slot="ellipsis"
                  class={cn('flex items-center size-6', uiProps.classes?.ellipsis)}
                >
                  <Icon name={uiProps.ellipsisIcon} class="size-full" />
                  <span class="sr-only">More pages</span>
                </li>
              )
            }

            const isActive = () => item === resolvedPage()

            return (
              <li data-slot="item">
                <Button
                  data-slot="control"
                  variant={isActive() ? styleProps.activeVariant : styleProps.variant}
                  size={size()}
                  aria-current={isActive() ? 'page' : undefined}
                  data-current={isActive() ? '' : undefined}
                  onClick={() => selectPage(item)}
                  {...getControlProps(item)}
                >
                  {item}
                </Button>
              </li>
            )
          }}
        </For>

        <Show when={pagingProps.showControls}>
          <li data-slot="next" class="ms-2">
            <Button
              data-slot="control"
              variant={styleProps.controlVariant}
              size={size()}
              aria-label={uiProps.nextText ?? 'Next'}
              onClick={() => selectPage(resolvedPage() + 1)}
              {...getControlProps(resolvedPage() + 1, resolvedPage() >= pageCount())}
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
