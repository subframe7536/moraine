import type { JSX, ValidComponent } from 'solid-js'
import { For, Show, createMemo, mergeProps } from 'solid-js'

import { Button } from '../../elements/button'
import { Icon } from '../../elements/icon'
import type { IconName } from '../../elements/icon'
import type { SlotClasses } from '../../shared/slot-class'
import { cn } from '../../shared/utils'

import { breadcrumbListVariants } from './breadcrumb.class'
import type { BreadcrumbVariantProps } from './breadcrumb.class'

export interface BreadcrumbItem {
  label?: JSX.Element
  icon?: IconName
  to?: string
  href?: string
  target?: string
  rel?: string
  active?: boolean
  disabled?: boolean
  onClick?: JSX.EventHandler<HTMLAnchorElement, MouseEvent>
}

type BreadcrumbSlots = 'root' | 'list' | 'item' | 'link' | 'leading' | 'label' | 'separator'

export type BreadcrumbClasses = SlotClasses<BreadcrumbSlots>

export interface BreadcrumbItemRenderContext {
  item: BreadcrumbItem
  index: number
  current: boolean
  disabled: boolean
}

export interface BreadcrumbBaseProps extends BreadcrumbVariantProps {
  items?: BreadcrumbItem[]
  classes?: BreadcrumbClasses
  separator?: IconName
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  'aria-label'?: string
  itemRender?: (context: BreadcrumbItemRenderContext) => ValidComponent
}

export type BreadcrumbProps = BreadcrumbBaseProps

export function getIconSize(size: string | undefined) {
  switch (size) {
    case 'xs':
      return 12
    case 'sm':
      return 13
    case 'md':
      return 14
    case 'lg':
      return 15
    case 'xl':
      return 16
  }
  return undefined
}

export function Breadcrumb(props: BreadcrumbProps): JSX.Element {
  const merged = mergeProps(
    {
      separator: 'icon-chevron-right' as IconName,
      wrap: true,
      size: 'md',
      'aria-label': 'Breadcrumbs',
    },
    props,
  ) as BreadcrumbProps

  const items = createMemo(() => merged.items ?? [])

  return (
    <nav
      data-slot="root"
      aria-label={merged['aria-label']}
      class={cn('relative min-w-0', merged.classes?.root)}
    >
      <ol
        data-slot="list"
        class={breadcrumbListVariants({ wrap: merged.wrap }, merged.classes?.list)}
      >
        <For each={items()}>
          {(item, index) => {
            const isLast = createMemo(() => index() === items().length - 1)
            const isCurrent = createMemo(() => item.active ?? isLast())
            const isDisabled = createMemo(() => Boolean(item.disabled || isCurrent()))
            const href = createMemo(() => {
              const defaultHref = item.to ?? item.href
              if (merged.itemRender) {
                return defaultHref
              }
              return isDisabled() ? undefined : defaultHref
            })

            return (
              <>
                <li data-slot="item" class={cn('flex min-w-0 items-center', merged.classes?.item)}>
                  <Button
                    as={
                      merged.itemRender
                        ? merged.itemRender({
                            item,
                            index: index(),
                            current: isCurrent(),
                            disabled: isDisabled(),
                          })
                        : 'a'
                    }
                    data-slot="link"
                    variant="ghost"
                    size={merged.size}
                    role="link"
                    href={href()}
                    target={item.target}
                    rel={item.rel}
                    aria-current={isCurrent() ? 'page' : undefined}
                    data-current={isCurrent() ? '' : undefined}
                    disabled={isDisabled()}
                    onClick={item.onClick}
                    leading={item.icon}
                    classes={{
                      base: merged.classes?.link,
                      leading: merged.classes?.leading,
                      label: merged.classes?.label,
                    }}
                  >
                    {item.label}
                  </Button>
                </li>

                <Show when={!isLast()}>
                  <li
                    data-slot="separator"
                    aria-hidden="true"
                    class={cn(
                      'inline-flex shrink-0 items-center justify-center',
                      merged.classes?.separator,
                    )}
                  >
                    <Icon name={merged.separator} size={getIconSize(merged.size)} />
                  </li>
                </Show>
              </>
            )
          }}
        </For>
      </ol>
    </nav>
  )
}
