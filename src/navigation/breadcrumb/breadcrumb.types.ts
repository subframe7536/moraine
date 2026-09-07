import type { JSX, Ref } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

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

    /** Current page entry. */
    page?: T

    /** Optional icon rendered before a breadcrumb label. */
    leading?: T

    /** Breadcrumb item label text. */
    label?: T

    /** Visual divider between breadcrumb entries. */
    separator?: T
  }

  export interface Variant {
    size?: 'sm' | 'md' | 'lg' | null
    wrap?: boolean | 'true' | 'false' | null
  }
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
     * Ref forwarded to the root `<nav>` element.
     */
    ref?: Ref<HTMLElement>

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
