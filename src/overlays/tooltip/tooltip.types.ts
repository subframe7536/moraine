import type { JSX, ValidComponent } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { PopperProps } from '../base/popper.tsx'
import type { ModalT } from '../modal/modal.types.ts'

export namespace TooltipT {
  export interface Slot<T = unknown> {
    /** Positioning wrapper around the tooltip surface. */
    positioner?: T
    /** Element that opens the tooltip. */
    trigger?: T

    /** Tooltip bubble positioned next to its trigger. */
    content?: T

    /** Primary text region inside the tooltip bubble. */
    text?: T

    /** Container for shortcut hints displayed beside tooltip text. */
    kbds?: T

    /** Individual keyboard key hint inside the tooltip. */
    kbd?: T
  }

  export interface Variant {
    side?: 'top' | 'right' | 'bottom' | 'left' | null
    invert?: boolean | 'true' | 'false' | null
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Tooltip component.
   */
  export interface Base extends Pick<
    PopperProps,
    'id' | 'open' | 'defaultOpen' | 'onOpenChange' | 'disabled' | 'placement' | 'forceMount'
  > {
    /**
     * Preferred content placement relative to the trigger.
     * @default 'top'
     */
    placement?: PopperProps['placement']

    /**
     * Delay in milliseconds before opening on hover or focus.
     * @default 600
     */
    openDelay?: number

    /**
     * Delay in milliseconds before closing after leaving trigger or content.
     * @default 200
     */
    closeDelay?: number

    /**
     * Delay in milliseconds to skip the open delay for the next trigger after closing.
     * @default 300
     */
    instantOpenDelay?: number

    /** Composed trigger and content primitives. */
    children?: JSX.Element
  }
  export interface ContentBase {
    /**
     * Primary text content or element to display.
     */
    text?: JSX.Element

    /**
     * Keyboard shortcuts to display next to the text.
     */
    kbds?: string[]

    /** Text content when text is undefined. */
    children?: JSX.Element
  }

  /**
   * Props for the Tooltip component.
   */
  export type TriggerProps<T extends ValidComponent = 'button'> = ModalT.TriggerProps<T>
  export type ContentProps = BaseProps<'div', ContentBase, Variant, Classes, Styles>
  export type Props = Base
}

/**
 * Props for the Tooltip component.
 */
export interface TooltipProps extends TooltipT.Props {}
