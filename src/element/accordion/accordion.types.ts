import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type { IconT } from '../icon'

import type { AccordionStyleSlot, AccordionStyleVariant } from './accordion.style-types'

export namespace AccordionT {
  export type Kind = 'single'

  export type Slot<T = unknown> = AccordionStyleSlot<T>
  export type Variant = AccordionStyleVariant

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
    value: string

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

    /** Controlled expanded value: a string or null in single mode, an array in multiple mode. */
    value?: string | null | string[]

    /** Initial expanded value for uncontrolled usage. */
    defaultValue?: string | null | string[]

    /** Allow several items to be expanded. @default false */
    multiple?: boolean

    /** Allow closing the last expanded item in single mode. @default true */
    collapsible?: boolean

    /** Called when the expanded value changes, using the selected mode's value shape. */
    onChange?: ((value: string | null) => void) | ((value: string[]) => void)

    /**
     * Whether arrow-key focus wraps from the last trigger to the first and vice versa.
     * @default true
     */
    loop?: boolean

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
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles> &
    (
      | {
          multiple?: false
          value?: string | null
          defaultValue?: string | null
          onChange?: (value: string | null) => void
          /** Whether the last expanded item can be collapsed. @default true */
          collapsible?: boolean
        }
      | {
          multiple: true
          value?: string[]
          defaultValue?: string[]
          onChange?: (value: string[]) => void
          collapsible?: never
        }
    )
}

/**
 * Props for the Accordion component.
 */
export type AccordionProps = AccordionT.Props
