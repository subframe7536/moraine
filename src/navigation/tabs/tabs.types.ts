import type { JSX } from 'solid-js'

import type { IconT } from '../../elements/icon/icon.types'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

import type { TabsStyleSlot, TabsStyleVariant } from './tabs.style-types'

export namespace TabsT {
  export type Kind = 'single'

  export type Slot<T = unknown> = TabsStyleSlot<T>

  export type Variant = TabsStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * An individual tab in the tabs component.
   */
  export interface Item {
    /**
     * Label to display on the tab trigger.
     */
    label?: JSX.Element

    /**
     * Icon to display next to the label.
     */
    icon?: IconT.Name

    /**
     * Unique value for the tab.
     * @default index of the item
     */
    value?: string

    /**
     * Content to display when the tab is active.
     */
    content?: JSX.Element

    /**
     * Whether the tab is disabled.
     * @default false
     */
    disabled?: boolean
  }

  /**
   * Base props for the Tabs component.
   */
  export interface Base {
    /**
     * Unique identifier for the tabs root element.
     */
    id?: string

    /**
     * Controlled active tab value.
     */
    value?: string

    /**
     * Default active tab value for uncontrolled usage.
     */
    defaultValue?: string

    /**
     * The orientation of the tab list.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical'

    /**
     * Whether keyboard navigation activates the tab immediately or waits for confirmation.
     * @default 'automatic'
     */
    activationMode?: 'automatic' | 'manual'

    /**
     * Whether the tab list is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Whether arrow-key navigation wraps from the ends.
     * @default true
     */
    loop?: boolean

    /**
     * Callback when the active tab changes.
     */
    onChange?: (value: string) => void

    /**
     * Array of tabs to display.
     */
    items?: Item[]
  }

  /**
   * Props for the Tabs component.
   */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the Tabs component.
 */
export interface TabsProps extends TabsT.Props {}
