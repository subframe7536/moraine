import type { JSX, Ref } from 'solid-js'

import type { IconT } from '../../elements/icon'
import type { ComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

import type { BreadcrumbStyleSlot, BreadcrumbStyleVariant } from './breadcrumb.style-types'

export namespace BreadcrumbT {
  export type Kind = 'single'
  export type Slot<T = unknown> = BreadcrumbStyleSlot<T>

  export type Variant = BreadcrumbStyleVariant

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
export type BreadcrumbProps = BreadcrumbT.Props
