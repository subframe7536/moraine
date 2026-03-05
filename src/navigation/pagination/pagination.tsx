import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { Button } from '../../elements/button'
import type { ButtonProps } from '../../elements/button'
import { Icon } from '../../elements/icon'
import type { IconName } from '../../elements/icon'
import type { FormFieldSize } from '../../forms/form-field/form-field-context'
import type { SlotClasses } from '../../shared/slot-class'
import { cn } from '../../shared/utils'

type PaginationSlots = 'root' | 'list' | 'item' | 'link' | 'prev' | 'next' | 'ellipsis'

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
  size?: FormFieldSize
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

function getSize(size: string | undefined, text?: string): ButtonProps['size'] {
  return (text ? size : `icon-${size}`) as ButtonProps['size']
}

export function Pagination(props: PaginationProps): JSX.Element {
  const merged = mergeProps(
    {
      'aria-label': 'Pagination',
      role: 'navigation',
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

  const [styleProps, uiProps, pagingProps, restProps] = splitProps(
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
    <nav data-slot="root" class={cn('w-full', uiProps.classes?.root)} {...restProps}>
      <ul
        data-slot="list"
        class={cn('flex items-center justify-center gap-1', uiProps.classes?.list)}
      >
        <Show when={pagingProps.showControls}>
          <li data-slot="item" class={cn(uiProps.classes?.item)}>
            <Button
              data-slot="prev"
              variant={styleProps.controlVariant}
              size={getSize(styleProps.size, uiProps.prevText)}
              aria-label="Go to previous page"
              classes={{ base: uiProps.classes?.prev }}
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
                aria-hidden={item < 0 ? true : undefined}
                class={cn(item < 0 && 'flex items-center size-6', uiProps.classes?.item)}
              >
                <Show
                  when={item >= 0}
                  fallback={
                    <Icon
                      data-slot="ellipsis"
                      name={uiProps.ellipsisIcon}
                      class={cn(uiProps.classes?.ellipsis)}
                    />
                  }
                >
                  <Button
                    data-slot="link"
                    variant={isActive() ? styleProps.activeVariant : styleProps.variant}
                    size={getSize(styleProps.size)}
                    aria-current={isActive() ? 'page' : undefined}
                    aria-label={isActive() ? `Page ${item}, current page` : `Go to page ${item}`}
                    data-current={isActive() ? '' : undefined}
                    classes={{ base: ['outline-none', uiProps.classes?.link] }}
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
          <li data-slot="item" class={cn(uiProps.classes?.item)}>
            <Button
              data-slot="next"
              variant={styleProps.controlVariant}
              size={getSize(styleProps.size, uiProps.nextText)}
              aria-label="Go to next page"
              classes={{ base: uiProps.classes?.next }}
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
