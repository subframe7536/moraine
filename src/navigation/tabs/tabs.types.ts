import type { JSX } from 'solid-js'

import type { IconT } from '../../elements/icon/icon.types.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

export namespace TabsT {
  export interface Slot<T = unknown> {
    /**
     * Tabs container that owns tab selection and panel rendering.
     */
    root?: T

    /** Tablist that contains all tab triggers and the selection indicator. */
    list?: T

    /** Moving indicator aligned with the active tab trigger. */
    indicator?: T

    /** Tab button users activate to select a panel. */
    trigger?: T

    /** Optional icon rendered before a tab label. */
    leading?: T

    /** Text or custom label rendered inside a tab trigger. */
    label?: T

    /** Optional trailing content rendered after a tab label. */
    trailing?: T

    /** Tab panel rendered for the selected item. */
    content?: T
  }

  export interface Variant {
    orientation?: 'horizontal' | 'vertical' | null
    variant?: 'pill' | 'link' | null
    size?: 'sm' | 'md' | 'lg' | null
  }
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
    keyboardLoop?: boolean

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
