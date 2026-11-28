import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { For, Show, createMemo, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler } from '../../shared/utils'
import { Icon } from '../icon'

import { defaultBreadcrumbMessages } from './breadcrumb.messages'
import { breadcrumbDataAttributes, breadcrumbRecipe } from './breadcrumb.recipe'
import type { BreadcrumbProps } from './breadcrumb.types'
/**
 * Breadcrumb navigation trail with separator icons and optional wrapping, showing where a
 * resource sits in a navigation hierarchy. Keep ancestors as links with `href`; the last item is
 * the current page by default (or mark another with `active`) and renders as a non-link `span`
 * with `aria-current="page"`. Use `Tabs` for in-page section switching. It renders a `nav`.
 *
 * @example
 * ```tsx
 * import { Breadcrumb } from 'moraine'
 *
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', href: '/', icon: 'i-lucide:home' },
 *     { label: 'Components', href: '/button' },
 *     { label: 'Breadcrumb' },
 *   ]}
 * />
 * ```
 */
export function Breadcrumb(props: BreadcrumbProps): JSX.Element {
  const rest = omit(
    props,
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
    'aria-label',
    'translations',
  )
  const {
    slots: {
      root: rootSlot,
      list: listSlot,
      item: itemSlot,
      page: pageSlot,
      leading: leadingSlot,
      label: labelSlot,
      separator: separatorSlot,
    },
    slotWith,
  } = useRecipe(breadcrumbRecipe, props, {
    data: { page: breadcrumbDataAttributes.page({ current: true }) },
  })
  const messages = useMessages('breadcrumb', defaultBreadcrumbMessages, () => props.translations)

  const separator = () => props.separator ?? 'icon-chevron-right'

  const items = createMemo(() => props.items ?? [])
  const currentIndex = createMemo(() => {
    const resolvedItems = items()
    const explicitIndex = resolvedItems.findIndex((item) => item.active)

    return explicitIndex >= 0 ? explicitIndex : resolvedItems.length - 1
  })

  return (
    <nav
      data-slot="breadcrumb"
      {...rootSlot}
      {...rest}
      ref={props.ref}
      aria-label={props['aria-label'] ?? messages().label}
    >
      <ol data-slot="breadcrumb-list" {...listSlot}>
        <For each={items()}>
          {(item, index) => {
            const isCurrent = createMemo(() => index() === currentIndex())
            const isDisabled = () => Boolean(item.disabled)
            const isDisabledLink = () => !isCurrent() && isDisabled()
            const isInteractive = () => !isCurrent() && !isDisabled()

            const leading = createMemo(() => item.icon)
            const label = createMemo(() => item.label)
            const hasLabel = () => hasContent(label())
            const linkSlot = slotWith('link', {
              data: breadcrumbDataAttributes.link({ disabled: isDisabledLink }),
            })
            const ItemTag = dynamic(() => (isInteractive() ? 'a' : 'span'))

            return (
              <>
                <li data-slot="breadcrumb-item" {...itemSlot}>
                  <Show
                    when={props.itemRender}
                    keyed
                    fallback={
                      <ItemTag
                        data-slot={isCurrent() ? 'breadcrumb-page' : 'breadcrumb-link'}
                        {...(isCurrent() ? pageSlot : linkSlot)}
                        role={isDisabledLink() ? 'link' : undefined}
                        aria-disabled={isDisabledLink() ? 'true' : undefined}
                        aria-current={isCurrent() ? 'page' : undefined}
                        href={isInteractive() ? item.href : undefined}
                        target={isInteractive() ? item.target : undefined}
                        rel={isInteractive() ? item.rel : undefined}
                        onClick={(event: MouseEvent) => {
                          if (isInteractive()) {
                            callHandler(event, item.onClick)
                          }
                        }}
                      >
                        <Show when={leading()}>
                          {(icon) => (
                            <Icon name={icon()} data-slot="breadcrumb-leading" {...leadingSlot} />
                          )}
                        </Show>
                        <Show when={hasLabel()}>
                          <span data-slot="breadcrumb-label" {...labelSlot}>
                            {label()}
                          </span>
                        </Show>
                      </ItemTag>
                    }
                  >
                    {(render) =>
                      renderWithProps(render, {
                        item,
                        get index() {
                          return index()
                        },
                        get active() {
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
                    {...separatorSlot}
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
