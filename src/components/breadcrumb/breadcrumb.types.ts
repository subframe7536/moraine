import type { Component, JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'

import type { defaultBreadcrumbMessages } from './breadcrumb.messages'
import type { BreadcrumbStyleSlot, BreadcrumbStyleVariants } from './breadcrumb.style-types'

export namespace BreadcrumbT {
  export type Kind = 'single'
  export type Slot<T = unknown> = BreadcrumbStyleSlot<T>

  export type Variants = BreadcrumbStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultBreadcrumbMessages>
  export type Translations = Partial<Messages>

  /**
   * An individual item in the breadcrumb trail.
   */
  export interface Item {
    /**
     * Text or content of the item. Nothing is rendered for an empty label.
     */
    label?: JSX.Element

    /**
     * Name of an icon rendered before the label.
     */
    icon?: IconT.Name

    /**
     * Link destination. Applied only to an interactive item: the current page and disabled items
     * render without `href`, `target`, `rel` and `onClick`.
     */
    href?: string

    /**
     * Browsing context for the link, such as `'_blank'`. Ignored for the current page and disabled items.
     */
    target?: string

    /**
     * Link relationship, such as `'noopener'`. Ignored for the current page and disabled items.
     */
    rel?: string

    /**
     * Marks this item as the current page, rendered as a non-link with `aria-current="page"`. When
     * no item sets it, the last item is the current page. The first item with `active` wins.
     */
    active?: boolean

    /**
     * Whether the item is disabled: it renders as a non-interactive element with
     * `aria-disabled="true"` and without `href` or `onClick`. Has no effect on the current page.
     */
    disabled?: boolean

    /**
     * Click handler for the item's link. Not attached to the current page or disabled items.
     */
    onClick?: JSX.EventHandlerUnion<HTMLAnchorElement, MouseEvent>
  }

  /** Context provided to the item secondary renderer. */
  export interface ItemRenderProps {
    /** The original item object. */
    item: Item
    /** Index of the item in the list. */
    index: number
    /** Whether the item is the current page. */
    current: boolean
    /** Whether the item is disabled. */
    disabled: boolean
  }

  /**
   * Base props for the Breadcrumb component.
   */
  export interface Base {
    /**
     * Overrides the built-in strings for this instance. The only key is `label`, the default
     * `aria-label` of the `<nav>` (default `'breadcrumb'`). An explicit `aria-label` prop wins.
     */
    translations?: Translations
    /**
     * Ref forwarded to the root `<nav>` element.
     */
    ref?: Ref<HTMLElement>

    /**
     * Items of the trail, from the root to the current page. Separators are rendered between
     * consecutive items automatically.
     * @example
     * ```tsx
     * import { Breadcrumb } from 'moraine'
     *
     * <Breadcrumb
     *   items={[
     *     { label: 'Home', href: '/' },
     *     { label: 'Docs', href: '/docs', target: '_blank', rel: 'noopener' },
     *     { label: 'Archive', disabled: true },
     *     { label: 'Current page' },
     *   ]}
     * />
     * ```
     */
    items?: Item[]

    /**
     * Name of the icon rendered between consecutive items. The separator is hidden from assistive
     * technology.
     * @default 'icon-chevron-right'
     */
    separator?: IconT.Name

    /**
     * Component rendered for every item, replacing its default link or page element (the `<li>` and
     * separator are kept). Use it to integrate a router link. Receives `{ item, index, current,
     * disabled }`; you are responsible for `aria-current` and disabled handling.
     * @example
     * ```tsx
     * import { Breadcrumb } from 'moraine'
     *
     * <Breadcrumb
     *   items={[{ label: 'Home', href: '/' }, { label: 'Settings' }]}
     *   itemRender={(ctx) => (
     *     <a href={ctx.item.href} aria-current={ctx.current ? 'page' : undefined}>
     *       {ctx.item.label}
     *     </a>
     *   )}
     * />
     * ```
     */
    itemRender?: Component<ItemRenderProps>
  }

  /**
   * Props for the Breadcrumb component.
   */
  export type Props = BaseProps<'nav', Base, Variants, Classes, Styles>
}

/**
 * Props for the Breadcrumb component.
 */
export type BreadcrumbProps = BreadcrumbT.Props
