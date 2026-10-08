import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../element/icon'
import { createStyles } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { callRef } from '../../shared/utils'

import { defaultBreadcrumbMessages } from './breadcrumb.messages'
import { breadcrumbDataAttributes, breadcrumbRecipe } from './breadcrumb.recipe'
import type { BreadcrumbProps } from './breadcrumb.types'

/** Breadcrumb navigation trail with separator icons and optional wrapping. */
export function Breadcrumb(props: BreadcrumbProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'ref',
    'items',
    'separator',
    'size',
    'itemRender',
    'wrap',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createStyles(breadcrumbRecipe, local)
  const messages = useMessages('breadcrumb', defaultBreadcrumbMessages)

  const separator = () => local.separator ?? 'icon-chevron-right'

  const items = createMemo(() => local.items ?? [])
  const currentIndex = createMemo(() => {
    const resolvedItems = items()
    const explicitIndex = resolvedItems.findIndex((item) => item.active)

    return explicitIndex >= 0 ? explicitIndex : resolvedItems.length - 1
  })

  return (
    <nav
      ref={(el) => callRef(local.ref, el)}
      data-slot="breadcrumb"
      {...resolved.styles.root}
      {...rest}
      aria-label={rest['aria-label'] ?? messages().label}
    >
      <ol data-slot="breadcrumb-list" {...resolved.styles.list}>
        <For each={items()}>
          {(item, index) => {
            const isCurrent = createMemo(() => index() === currentIndex())
            const isDisabled = () => Boolean(item.disabled)
            const isDisabledLink = () => !isCurrent() && isDisabled()
            const isInteractive = () => !isCurrent() && !isDisabled()

            const leading = createMemo(() => item.icon)
            const label = createMemo(() => item.label)
            const hasLabel = () => {
              const value = label()
              return value === 0 || Boolean(value)
            }

            return (
              <>
                <li data-slot="breadcrumb-item" {...resolved.styles.item}>
                  <Show
                    when={local.itemRender}
                    keyed
                    fallback={
                      <Dynamic
                        component={isInteractive() ? 'a' : 'span'}
                        data-slot={isCurrent() ? 'breadcrumb-page' : 'breadcrumb-link'}
                        {...resolved.styles[isCurrent() ? 'page' : 'link']}
                        role={isDisabledLink() ? 'link' : undefined}
                        aria-disabled={isDisabledLink() ? 'true' : undefined}
                        aria-current={isCurrent() ? 'page' : undefined}
                        {...(isCurrent()
                          ? breadcrumbDataAttributes.page({ current: true })
                          : isDisabledLink()
                            ? breadcrumbDataAttributes.link({ disabled: true })
                            : undefined)}
                        href={isInteractive() ? (item.to ?? item.href) : undefined}
                        target={isInteractive() ? item.target : undefined}
                        rel={isInteractive() ? item.rel : undefined}
                        onClick={isInteractive() ? item.onClick : undefined}
                      >
                        <Show when={leading()}>
                          {(icon) => (
                            <Icon
                              name={icon()}
                              slotName="breadcrumb-leading"
                              {...resolved.styles.leading}
                            />
                          )}
                        </Show>
                        <Show when={hasLabel()}>
                          <span data-slot="breadcrumb-label" {...resolved.styles.label}>
                            {label()}
                          </span>
                        </Show>
                      </Dynamic>
                    }
                  >
                    {(ItemRender) => (
                      <ItemRender
                        item={item}
                        index={index()}
                        current={isCurrent()}
                        disabled={isDisabled()}
                      />
                    )}
                  </Show>
                </li>

                <Show when={index() < items().length - 1}>
                  <li
                    data-slot="breadcrumb-separator"
                    role="presentation"
                    aria-hidden="true"
                    {...resolved.styles.separator}
                  >
                    <Icon name={separator()} />
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
