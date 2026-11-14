import type { Component, JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'

import type { AccordionStyleSlot, AccordionStyleVariants } from './accordion.style-types'

export namespace AccordionT {
  export type Kind = 'single'

  export type Slot<T = unknown> = AccordionStyleSlot<T>
  export type Variants = AccordionStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface ContentRenderProps {
    expanded: boolean
    closed: boolean
    disabled: boolean
    value: string
  }

  export interface Item {
    /**
     * Header label for the accordion item.
     */
    label?: JSX.Element

    /**
     * Accessible label for the accordion trigger button.
     * Useful when `label` is omitted, icon-only, or contains non-text content.
     */
    ariaLabel?: string

    /**
     * Unique value for the accordion item, used in `value` and `onValueChange`.
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
     * Content to display when the accordion item is expanded. Accepts static JSX or a component receiving { expanded, closed, disabled, value }.
     */
    contentRender?: JSX.Element | Component<ContentRenderProps>

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

    /** Controlled list of expanded item values. */
    value?: string[]

    /** Default list of expanded item values for uncontrolled usage. @default [] */
    defaultValue?: string[]

    /** Whether multiple accordion items can be expanded at the same time. @default false */
    multiple?: boolean

    /** Whether the last expanded item can be collapsed. @default true */
    collapsible?: boolean

    /** Callback when the expanded item values change. */
    onValueChange?: (value: string[]) => void

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
     * Whether closed content stays mounted. `unmount-on-hide` mounts content on first open and
     * unmounts it once it closes; `keep-mounted` mounts it even before the first open.
     * @default 'unmount-on-hide'
     */
    mountMode?: 'unmount-on-hide' | 'keep-mounted'

    /**
     * Trailing icon name for all accordion items.
     * @default 'icon-chevron-down'
     */
    trailing?: IconT.Name

    /**
     * Heading level for the accordion item header element.
     * @default 3
     */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  }

  /**
   * Props for the Accordion component.
   */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/**
 * Props for the Accordion component.
 */
export type AccordionProps = AccordionT.Props
