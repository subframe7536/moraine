import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue, ValidComponent } from '../../shared/types'
import type { PopperContentOptions, PopperProps } from '../base/popper.types'
import type { ModalT } from '../modal/modal.types'

import type { PopoverStyleSlot, PopoverStyleVariant } from './popover.style-types'

export namespace PopoverT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = PopoverStyleSlot<T>

  export type Variant = PopoverStyleVariant
  export type Mode = 'click' | 'hover'

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type ContentClasses = Pick<Classes, 'content' | 'body'>
  export type ContentStyles = Pick<Styles, 'content' | 'body'>
  export interface Item {}

  /**
   * Base props for the Popover component.
   */
  export interface Base extends Pick<
    PopperProps & PopperContentOptions,
    | 'id'
    | 'open'
    | 'defaultOpen'
    | 'onOpenChange'
    | 'disabled'
    | 'placement'
    | 'forceMount'
    | 'preventScroll'
    | 'dismissible'
    | 'onClosePrevent'
  > {
    /**
     * Whether the content traps focus and hides outside content from assistive technology.
     * This is enabled only when Popover.Content composes Popover.Close; otherwise the Popover
     * remains non-modal so assistive-technology users retain a dismissal route.
     * @default false
     */
    modal?: boolean

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

    /** Family slot class defaults for this Popover instance. */
    classes?: Classes

    /** Family slot style defaults for this Popover instance. */
    styles?: Styles
  }
  export interface ContentBase {
    /**
     * Preferred placement relative to the trigger.
     * @default 'bottom'
     */
    side?: 'top' | 'right' | 'bottom' | 'left'

    ariaLabel?: string
    /** Body content. */
    children?: JSX.Element
  }

  /**
   * Props for the Popover component.
   */
  export type TriggerProps<T extends ValidComponent = 'button'> = ModalT.TriggerProps<T>
  export type CloseProps<T extends ValidComponent = 'button'> = ModalT.CloseProps<T>
  export type ContentProps = BaseProps<'div', ContentBase, Variant, ContentClasses, ContentStyles>
  export type Props = Base
}

/**
 * Props for the Popover component.
 */
export interface PopoverProps extends PopoverT.Props {}
