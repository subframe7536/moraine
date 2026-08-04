import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { Button } from '../../elements/button/index.ts'
import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn } from '../../shared/utils.ts'

import { breadcrumbListVariants } from './breadcrumb.class.ts'
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
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'

    /**
     * Custom renderer for individual breadcrumb items.
     */
    itemRender?: ComponentOrElement<ItemRenderProps>
  }

  /**
   * Props for the Breadcrumb component.
   */
  export type Props = BaseProps<'nav', Base, Variant, Slot>
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
      'aria-label': 'Breadcrumbs',
    },
    local,
  )

  const items = createMemo(() => merged.items ?? [])

  return (
    <nav
      data-slot="root"
      style={{ ...merged.styles?.root, ...merged.style }}
      aria-label={merged['aria-label']}
      {...rest}
      class={cn('min-w-0 relative', merged.classes?.root, merged.class)}
    >
      <ol
        data-slot="list"
        style={merged.styles?.list}
        class={breadcrumbListVariants({ wrap: merged.wrap }, merged.classes?.list)}
      >
        <For each={items()}>
          {(item, index) => {
            const isLast = createMemo(() => index() === items().length - 1)
            const isCurrent = createMemo(() => item.active ?? isLast())
            const isDisabled = createMemo(() => Boolean(item.disabled || isCurrent()))
            const href = createMemo(() => {
              const defaultHref = item.to ?? item.href
              return isDisabled() ? undefined : defaultHref
            })

            return (
              <>
                <li
                  data-slot="item"
                  style={merged.styles?.item}
                  class={cn('flex min-w-0 items-center', merged.classes?.item)}
                >
                  <Show
                    when={merged.itemRender !== undefined}
                    fallback={
                      <Button
                        as="a"
                        data-slot="link"
                        style={merged.styles?.link}
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
                        class={cn(!merged.wrap && 'truncate', merged.classes?.link)}
                        classes={{
                          leading: merged.classes?.leading,
                          label: merged.classes?.label,
                        }}
                      >
                        {item.label}
                      </Button>
                    }
                  >
                    {renderComponentOrElement(merged.itemRender, {
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
                    })}
                  </Show>
                </li>

                <Show when={!isLast()}>
                  <li
                    data-slot="separator"
                    style={merged.styles?.separator}
                    aria-hidden="true"
                    class={cn(
                      'text-muted-foreground inline-flex shrink-0 items-center justify-center',
                      merged.classes?.separator,
                    )}
                  >
                    <Icon name={merged.separator} size={merged.size} />
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
