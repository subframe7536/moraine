import type { JSX, ValidComponent } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { PopperProps } from '../base/popper.tsx'
import type { ModalT } from '../modal/modal.types.ts'

export namespace PopoverT {
  export interface Slot<T = unknown> {
    /** Element that opens the popover. */
    trigger?: T

    /** Positioned popover panel anchored to the trigger. */
    content?: T

    /** Content body rendered inside the popover panel. */
    body?: T
  }

  export interface Variant {
    side?: 'top' | 'right' | 'bottom' | 'left' | null
  }
  export type Mode = 'click' | 'hover'
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Popover component.
   */
  export interface Base extends Pick<
    PopperProps,
    | 'id'
    | 'open'
    | 'defaultOpen'
    | 'onOpenChange'
    | 'disabled'
    | 'placement'
    | 'forceMount'
    | 'modal'
    | 'preventScroll'
    | 'dismissible'
    | 'onClosePrevent'
  > {
    /**
     * Interaction mode for triggering the popover.
     * @default 'click'
     */
    mode?: Mode

    /**
     * Delay in milliseconds before opening in hover mode.
     * @default 100
     */
    openDelay?: number

    /**
     * Delay in milliseconds before closing in hover mode.
     * @default 100
     */
    closeDelay?: number

    /** Composed trigger and content primitives. */
    children?: JSX.Element
  }
  export interface ContentBase {
    ariaLabel?: string
    /** Body content; an explicit null or false value suppresses children. */
    content?: JSX.Element
    children?: JSX.Element
  }

  /**
   * Props for the Popover component.
   */
  export type TriggerProps<T extends ValidComponent = 'button'> = ModalT.TriggerProps<T>
  export type ContentProps = BaseProps<'div', ContentBase, Variant, Classes, Styles>
  export type Props = Base
}

/**
 * Props for the Popover component.
 */
export interface PopoverProps extends PopoverT.Props {}
