import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { IconT } from '../icon/index.ts'

export namespace AccordionT {
  export interface Slot<T = unknown> {
    /**
     * Container that owns the accordion item collection and shared state attributes.
     */
    root?: T

    /** Wrapper for one accordion entry, including its header trigger and collapsible panel. */
    item?: T

    /** Heading row that contains the interactive trigger for an item. */
    header?: T

    /** Button users activate to expand or collapse an item. */
    trigger?: T

    /** Optional icon or visual placed before the item label. */
    leading?: T

    /** Text label displayed inside the item trigger. */
    label?: T

    /** Optional icon placed after the label, commonly used for the disclosure indicator. */
    trailing?: T

    /** Panel that contains the item content when expanded. */
    content?: T

    /** Inner container inside the collapsible panel for padding. */
    contentInner?: T
  }
  export type Variant = never
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {
    /**
     * Header label for the accordion item.
     */
    label?: JSX.Element

    /**
     * Unique value for the accordion item.
     */
    value?: string

    /**
     * Whether the accordion item is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Leading icon name for the accordion item.
     */
    leading?: IconT.Name

    /**
     * Content to display when the accordion item is expanded.
     */
    content?: JSX.Element

    /**
     * Optional class applied to the item element.
     */
    class?: SlotClassValue
  }
  /**
   * Base props for the Accordion component.
   */
  export interface Base {
    /**
     * Unique identifier for the accordion root element.
     */
    id?: string

    /**
     * Controlled list of expanded item values.
     */
    value?: string[]

    /**
     * Default list of expanded item values for uncontrolled usage.
     * @default []
     */
    defaultValue?: string[]

    /**
     * Whether multiple accordion items can be expanded at the same time.
     * @default false
     */
    multiple?: boolean

    /**
     * Whether the last expanded item can be collapsed.
     * @default true
     */
    collapsible?: boolean

    /**
     * Whether arrow-key focus wraps from the last trigger to the first and vice versa.
     * @default true
     */
    loopFocus?: boolean

    /**
     * Callback when the expanded item values change.
     */
    onChange?: (value: string[]) => void

    /**
     * Array of accordion items to render.
     */
    items?: Item[]

    /**
     * Whether the entire accordion is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Whether to unmount accordion content when hidden.
     * @default true
     */
    unmountOnHide?: boolean

    /**
     * Trailing icon name for all accordion items.
     * @default 'icon-chevron-down'
     */
    trailing?: IconT.Name
  }

  /**
   * Props for the Accordion component.
   */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the Accordion component.
 */
export interface AccordionProps extends AccordionT.Props {}
