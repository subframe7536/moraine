import type { Component, JSX, Ref } from 'solid-js'

import type { IconT } from '../../element/icon'
import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

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
    /** Localized message overrides for this breadcrumb instance. */
    translations?: Translations
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
     * Renderer for each breadcrumb item.
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
