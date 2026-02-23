import * as KobalteBreadcrumbs from '@kobalte/core/breadcrumbs'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../icon'
import type { IconName } from '../icon'
import { cn } from '../shared/utils'

import { breadcrumbLinkVariants, breadcrumbListVariants } from './breadcrumb.class'
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
  class?: string
  onClick?: JSX.EventHandlerUnion<HTMLAnchorElement, MouseEvent>
}

export interface BreadcrumbClasses {
  root?: string
  list?: string
  item?: string
  link?: string
  leading?: string
  label?: string
  separator?: string
  separatorIcon?: string
}

export interface BreadcrumbBaseProps extends Pick<BreadcrumbVariantProps, 'wrap'> {
  items?: BreadcrumbItem[]
  separatorIcon?: IconName
  classes?: BreadcrumbClasses
}

export type BreadcrumbProps = BreadcrumbBaseProps &
  Omit<KobalteBreadcrumbs.BreadcrumbsRootProps, keyof BreadcrumbBaseProps | 'children' | 'class'>

export function Breadcrumb(props: BreadcrumbProps): JSX.Element {
  const merged = mergeProps(
    {
      separatorIcon: 'icon-chevron-right' as IconName,
      wrap: true,
    },
    props,
  ) as BreadcrumbProps

  const [contentProps, rootProps] = splitProps(merged, [
    'items',
    'separatorIcon',
    'wrap',
    'classes',
  ])

  const items = createMemo(() => contentProps.items ?? [])

  return (
    <KobalteBreadcrumbs.Root
      data-slot="root"
      class={cn('relative min-w-0', contentProps.classes?.root)}
      {...rootProps}
    >
      <ol
        data-slot="list"
        class={breadcrumbListVariants({ wrap: contentProps.wrap }, contentProps.classes?.list)}
      >
        <For each={items()}>
          {(item, index) => {
            const isLast = () => index() === items().length - 1
            const isActive = () => item.active ?? isLast()
            const href = () => item.to ?? item.href
            const isClickable = () => Boolean(href() || item.onClick)

            return (
              <>
                <li
                  data-slot="item"
                  class={cn('flex min-w-0 items-center', contentProps.classes?.item)}
                >
                  <KobalteBreadcrumbs.Link
                    data-slot="link"
                    href={href()}
                    target={item.target}
                    rel={item.rel}
                    current={isActive()}
                    disabled={Boolean(item.disabled)}
                    onClick={item.onClick}
                    class={breadcrumbLinkVariants(
                      {
                        active: isActive(),
                        disabled: Boolean(item.disabled),
                        clickable: isClickable(),
                      },
                      contentProps.classes?.link,
                      item.class,
                    )}
                  >
                    <Show when={item.icon}>
                      <span
                        data-slot="leading"
                        class={cn(
                          'inline-flex shrink-0 items-center justify-center',
                          contentProps.classes?.leading,
                        )}
                      >
                        <Icon name={item.icon} />
                      </span>
                    </Show>

                    <Show when={item.label}>
                      <span data-slot="label" class={cn('truncate', contentProps.classes?.label)}>
                        {item.label}
                      </span>
                    </Show>
                  </KobalteBreadcrumbs.Link>
                </li>

                <Show when={!isLast()}>
                  <li
                    data-slot="separator"
                    class={cn(
                      'inline-flex shrink-0 items-center justify-center',
                      contentProps.classes?.separator,
                    )}
                  >
                    <KobalteBreadcrumbs.Separator>
                      <Icon
                        data-slot="separator-icon"
                        name={contentProps.separatorIcon as IconName}
                        classes={{
                          root: cn(
                            'size-4 text-muted-foreground',
                            contentProps.classes?.separatorIcon,
                          ),
                        }}
                      />
                    </KobalteBreadcrumbs.Separator>
                  </li>
                </Show>
              </>
            )
          }}
        </For>
      </ol>
    </KobalteBreadcrumbs.Root>
  )
}
