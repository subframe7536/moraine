import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn } from '../../shared/utils.ts'

import {
  BREADCRUMB_DISABLED_CLASS,
  BREADCRUMB_ITEM_CLASS,
  BREADCRUMB_LINK_CLASS,
  BREADCRUMB_ICON_SIZES,
  BREADCRUMB_PAGE_CLASS,
  BREADCRUMB_ROOT_CLASS,
  BREADCRUMB_SEPARATOR_CLASS,
  BREADCRUMB_TRUNCATE_CLASS,
  breadcrumbSizeVariants,
  breadcrumbListVariants,
} from './breadcrumb.class.ts'
import type { BreadcrumbVariantProps } from './breadcrumb.class.ts'

export namespace BreadcrumbT {
  /**
   * Context provided to the item secondary renderer.
   */
  export interface ItemRenderProps {
    /**
     * The original item object.
     */
    item: Item

    /**
     * Index of the item in the list.
     */
    index: number

    /**
     * Whether the item is the current page.
     */
    current: boolean

    /**
     * Whether the item is disabled.
     */
    disabled: boolean
  }

  export interface Slot<T = unknown> {
    /**
     * Navigation container for the breadcrumb trail.
     */
    root?: T

    /** Ordered list that contains breadcrumb items and separators. */
    list?: T

    /** Wrapper for one breadcrumb entry. */
    item?: T

    /** Clickable breadcrumb target for navigable entries. */
    link?: T

    /** Optional icon rendered before a breadcrumb label. */
    leading?: T

    /** Breadcrumb item label text. */
    label?: T

    /** Visual divider between breadcrumb entries. */
    separator?: T
  }

  export type Variant = BreadcrumbVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * An individual item in the breadcrumb trail.
   */
  export interface Item {
    /**
     * Label to display for the breadcrumb item.
     */
    label?: JSX.Element

    /**
     * Icon to display next to the label.
     */
    icon?: IconT.Name

    /**
     * The destination URL for this item.
     */
    to?: string

    /**
     * The destination URL for this item.
     */
    href?: string

    /**
     * Where to display the linked URL.
     */
    target?: string

    /**
     * Relationship of the linked URL to the current document.
     */
    rel?: string

    /**
     * Whether the item is the current active page.
     */
    active?: boolean

    /**
     * Whether the item is disabled.
     */
    disabled?: boolean

    /**
     * Callback when the item is clicked.
     */
    onClick?: JSX.EventHandlerUnion<HTMLAnchorElement, MouseEvent>
  }

  /**
   * Base props for the Breadcrumb component.
   */
  export interface Base {
    /**
     * Array of breadcrumb items to display.
     */
    items?: Item[]

    /**
     * Icon name for the separator between items.
     * @default 'icon-chevron-right'
     */
    separator?: IconT.Name

    /**
     * Size of the breadcrumb items and icons.
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg'

    /**
     * Custom renderer for individual breadcrumb items.
     */
    itemRender?: ComponentOrElement<ItemRenderProps>
  }

  /**
   * Props for the Breadcrumb component.
   */
  export type Props = BaseProps<'nav', Base, Variant, Classes, Styles>
}

/**
 * Props for the Breadcrumb component.
 */
export interface BreadcrumbProps extends BreadcrumbT.Props {}

/** Breadcrumb navigation trail with separator icons and optional wrapping. */
export function Breadcrumb(props: BreadcrumbProps): JSX.Element {
  const [local, rest] = splitProps(props, [
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
  const merged = mergeProps(
    {
      separator: 'icon-chevron-right' as IconT.Name,
      wrap: true,
      size: 'md' as BreadcrumbT.Base['size'],
      'aria-label': 'breadcrumb',
    },
    local,
  )

  type BreadcrumbSize = NonNullable<BreadcrumbT.Base['size']>
  const size = createMemo<BreadcrumbSize>(() => merged.size ?? 'md')
  const items = createMemo(() => merged.items ?? [])
  const itemRender = createMemo(() => merged.itemRender)
  const currentIndex = createMemo(() => {
    const resolvedItems = items()
    const explicitIndex = resolvedItems.findIndex((item) => item.active)

    return explicitIndex >= 0 ? explicitIndex : resolvedItems.length - 1
  })

  return (
    <nav
      data-slot="root"
      style={{ ...merged.styles?.root, ...merged.style }}
      aria-label={merged['aria-label']}
      {...rest}
      class={cn(BREADCRUMB_ROOT_CLASS, merged.classes?.root, merged.class)}
    >
      <ol
        data-slot="list"
        style={merged.styles?.list}
        class={breadcrumbListVariants({ wrap: merged.wrap }, merged.classes?.list)}
      >
        <For each={items()}>
          {(item, index) => {
            const isCurrent = createMemo(() => index() === currentIndex())
            const isDisabled = createMemo(() => Boolean(item.disabled || isCurrent()))
            const leading = createMemo(() => item.icon)
            const label = createMemo(() => item.label)
            const hasLabel = createMemo(() => {
              const value = label()
              return value === 0 || Boolean(value)
            })

            const itemClass = createMemo(() =>
              breadcrumbSizeVariants(
                { size: size() },
                isCurrent() ? BREADCRUMB_PAGE_CLASS : BREADCRUMB_LINK_CLASS,
                !merged.wrap && BREADCRUMB_TRUNCATE_CLASS,
                !isCurrent() && isDisabled() && BREADCRUMB_DISABLED_CLASS,
                merged.classes?.link,
              ),
            )

            return (
              <>
                <li
                  data-slot="item"
                  style={merged.styles?.item}
                  class={cn(BREADCRUMB_ITEM_CLASS, merged.classes?.item)}
                >
                  <Show
                    when={itemRender()}
                    fallback={
                      <Dynamic
                        component={isDisabled() ? 'span' : 'a'}
                        data-slot={isCurrent() ? 'page' : 'link'}
                        style={merged.styles?.link}
                        role={isDisabled() ? 'link' : undefined}
                        aria-disabled={isDisabled() ? 'true' : undefined}
                        aria-current={isCurrent() ? 'page' : undefined}
                        data-current={isCurrent() ? '' : undefined}
                        data-disabled={isDisabled() ? '' : undefined}
                        href={isDisabled() ? undefined : (item.to ?? item.href)}
                        target={isDisabled() ? undefined : item.target}
                        rel={isDisabled() ? undefined : item.rel}
                        onClick={isDisabled() ? undefined : item.onClick}
                        class={itemClass()}
                      >
                        <Show when={leading()}>
                          {(icon) => (
                            <Icon
                              name={icon()}
                              size={BREADCRUMB_ICON_SIZES[size()]}
                              slotName="leading"
                              style={merged.styles?.leading}
                              class={merged.classes?.leading}
                            />
                          )}
                        </Show>
                        <Show when={hasLabel()}>
                          <span
                            data-slot="label"
                            style={merged.styles?.label}
                            class={cn(
                              !merged.wrap && BREADCRUMB_TRUNCATE_CLASS,
                              merged.classes?.label,
                            )}
                          >
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
                    style={merged.styles?.separator}
                    role="presentation"
                    aria-hidden="true"
                    class={cn(BREADCRUMB_SEPARATOR_CLASS, merged.classes?.separator)}
                  >
                    <Icon name={merged.separator} size={BREADCRUMB_ICON_SIZES[size()]} />
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
