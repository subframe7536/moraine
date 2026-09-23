import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import { createStyles } from '../../provider'
import { renderComponentOrElement } from '../../shared/render-prop'
import { callRef } from '../../shared/utils'

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

  const separator = createMemo<IconT.Name>(() => local.separator ?? 'icon-chevron-right')

  const items = createMemo(() => local.items ?? [])
  const itemRender = createMemo(() => local.itemRender)
  const currentIndex = createMemo(() => {
    const resolvedItems = items()
    const explicitIndex = resolvedItems.findIndex((item) => item.active)

    return explicitIndex >= 0 ? explicitIndex : resolvedItems.length - 1
  })

  return (
    <nav
      ref={(el) => callRef(local.ref, el)}
      data-slot="breadcrumb"
      aria-label={rest['aria-label'] ?? 'breadcrumb'}
      {...resolved.styles.root}
      {...rest}
    >
      <ol data-slot="breadcrumb-list" {...resolved.styles.list}>
        <For each={items()}>
          {(item, index) => {
            const isCurrent = createMemo(() => index() === currentIndex())
            const isDisabled = createMemo(() => Boolean(item.disabled) || isCurrent())
            const leading = createMemo(() => item.icon)
            const label = createMemo(() => item.label)
            const hasLabel = createMemo(() => {
              const value = label()
              return value === 0 || Boolean(value)
            })

            return (
              <>
                <li data-slot="breadcrumb-item" {...resolved.styles.item}>
                  <Show
                    when={itemRender()}
                    fallback={
                      <Dynamic
                        component={isDisabled() ? 'span' : 'a'}
                        data-slot={isCurrent() ? 'breadcrumb-page' : 'breadcrumb-link'}
                        {...resolved.styles[isCurrent() ? 'page' : 'link']}
                        role={isDisabled() ? 'link' : undefined}
                        aria-disabled={isDisabled() ? 'true' : undefined}
                        aria-current={isCurrent() ? 'page' : undefined}
                        {...breadcrumbDataAttributes.page({
                          current: isCurrent,
                          disabled: isDisabled,
                        })}
                        href={isDisabled() ? undefined : (item.to ?? item.href)}
                        target={isDisabled() ? undefined : item.target}
                        rel={isDisabled() ? undefined : item.rel}
                        onClick={isDisabled() ? undefined : item.onClick}
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
                    {(renderer) =>
                      renderComponentOrElement(renderer(), {
                        item,
                        get index() {
                          return index()
                        },
                        get current() {
                          return isCurrent()
                        },
                        get disabled() {
                          return isDisabled()
                        },
                      })
                    }
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
