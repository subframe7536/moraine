import type { JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { PopperContentOptions, PopperProps } from '../shared/overlay/popper.types'
import type { OverlayTriggerBase, OverlayTriggerComponentProps } from '../shared/overlay/trigger'

import type { PopoverStyleSlot, PopoverStyleVariants } from './popover.style-types'

export namespace PopoverT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = PopoverStyleSlot<T>

  export type Variants = PopoverStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

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
    | 'align'
    | 'shift'
    | 'flip'
    | 'slide'
    | 'forceMount'
    | 'preventScroll'
    | 'closeOnEscape'
    | 'closeOnOutsideClick'
    | 'onClosePrevented'
    | 'finalFocus'
  > {
    /**
     * Gap in pixels between the trigger and the content.
     * @default 4
     */
    gutter?: number

    /**
     * Minimum padding in pixels between the content and the viewport edge.
     * @default 4
     */
    overflowPadding?: number

    /**
     * Opens the popover when a mouse pointer enters the trigger or the trigger receives keyboard
     * focus, and closes it `closeDelay` ms after the pointer or focus leaves the trigger and content.
     * Clicking the trigger then only opens it instead of toggling. Touch hover is ignored. Outside
     * focus no longer dismisses the content, and focus is not restored to the trigger on close
     * unless `finalFocus` is set.
     * @default false
     */
    openOnHover?: boolean

    /**
     * Delay in milliseconds between pointer enter or trigger focus and opening. Only used with
     * `openOnHover`.
     * @default 100
     */
    openDelay?: number

    /**
     * Delay in milliseconds between the pointer or focus leaving the trigger and content and
     * closing; re-entering within the delay keeps it open. Only used with `openOnHover`.
     * @default 100
     */
    closeDelay?: number

    /** Composed trigger and content primitives. */
    children?: JSX.Element
  }
  export type Props = BaseProps<never, Base, Variants, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>

  export interface ContentBase {
    /** Body content. */
    children?: JSX.Element
  }

  /**
   * Props for the Popover component.
   */
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never>

  export type CloseBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type CloseProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>
}

/**
 * Props for the Popover component.
 */
export type PopoverProps = PopoverT.Props
