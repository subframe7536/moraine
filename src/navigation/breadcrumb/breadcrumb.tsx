import type { JSX, ValidComponent } from 'solid-js'
import { For, Show, createMemo, mergeProps } from 'solid-js'

import { Button } from '../../elements/button'
import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'

import { breadcrumbListVariants } from './breadcrumb.class'
import type { BreadcrumbVariantProps } from './breadcrumb.class'

export namespace BreadcrumbT {
  export type Slot = 'root' | 'list' | 'item' | 'link' | 'leading' | 'label' | 'separator'
  export type Variant = BreadcrumbVariantProps

  /**
   * An individual item in the breadcrumb trail.
   */
  export interface Items {
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
    onClick?: JSX.EventHandler<HTMLAnchorElement, MouseEvent>
  }

  /**
   * Context provided to the item secondary renderer.
   */
  export interface ItemRenderContext {
    /**
     * The original item object.
     */
    item: Items

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

  export interface Extend {}
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

  /**
   * Base props for the Breadcrumb component.
   */
  export interface Base {
    /**
     * Array of breadcrumb items to display.
     */
    items?: Items[]

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
     * Accessibility label for the navigation element.
     * @default 'Breadcrumbs'
     */
    'aria-label'?: string

    /**
     * Custom renderer for individual breadcrumb items.
     */
    itemRender?: (context: ItemRenderContext) => ValidComponent
  }

  /**
   * Props for the Breadcrumb component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Breadcrumb component.
 */
export interface BreadcrumbProps extends BreadcrumbT.Props {}

/** Breadcrumb navigation trail with separator icons and collapsible overflow. */
export function Breadcrumb(props: BreadcrumbProps): JSX.Element {
  const merged = mergeProps(
    {
      separator: 'icon-chevron-right' as IconT.Name,
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
      style={merged.styles?.root}
      aria-label={merged['aria-label']}
      class={cn('min-w-0 relative', merged.classes?.root)}
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
              if (merged.itemRender) {
                return defaultHref
              }
              return isDisabled() ? undefined : defaultHref
            })

            return (
              <>
                <li
                  data-slot="item"
                  style={merged.styles?.item}
                  class={cn('flex min-w-0 items-center', merged.classes?.item)}
                >
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
                    classes={{
                      root: [!merged.wrap && 'truncate', merged.classes?.link],
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
