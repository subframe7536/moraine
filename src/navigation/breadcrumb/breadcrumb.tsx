import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callRef } from '../../shared/utils.ts'

import type { BreadcrumbProps, BreadcrumbT } from './breadcrumb.types.ts'

export * from './breadcrumb.types.ts'

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
  const resolved = createComponentStyles('breadcrumb', local)

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
      data-slot="root"
      aria-label={rest['aria-label'] ?? 'breadcrumb'}
      {...resolved.root}
      {...rest}
    >
      <ol data-slot="list" {...resolved.slot('list')}>
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
                <li data-slot="item" {...resolved.slot('item')}>
                  <Show
                    when={itemRender()}
                    fallback={
                      <Dynamic
                        component={isDisabled() ? 'span' : 'a'}
                        data-slot={isCurrent() ? 'page' : 'link'}
                        {...resolved.slot(isCurrent() ? 'page' : 'link')}
                        role={isDisabled() ? 'link' : undefined}
                        aria-disabled={isDisabled() ? 'true' : undefined}
                        aria-current={isCurrent() ? 'page' : undefined}
                        data-current={isCurrent() ? '' : undefined}
                        data-disabled={isDisabled() ? '' : undefined}
                        href={isDisabled() ? undefined : (item.to ?? item.href)}
                        target={isDisabled() ? undefined : item.target}
                        rel={isDisabled() ? undefined : item.rel}
                        onClick={isDisabled() ? undefined : item.onClick}
                      >
                        <Show when={leading()}>
                          {(icon) => (
                            <Icon name={icon()} slotName="leading" {...resolved.slot('leading')} />
                          )}
                        </Show>
                        <Show when={hasLabel()}>
                          <span data-slot="label" {...resolved.slot('label')}>
                            {label()}
                          </span>
                        </Show>
                      </Dynamic>
                    }
                  >
                    {(renderer) =>
                      renderComponentOrElement(
                        renderer() as ComponentOrElement<BreadcrumbT.ItemRenderProps>,
                        {
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
                        },
                      )
                    }
                  </Show>
                </li>

                <Show when={index() < items().length - 1}>
                  <li
                    data-slot="separator"
                    role="presentation"
                    aria-hidden="true"
                    {...resolved.slot('separator')}
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
