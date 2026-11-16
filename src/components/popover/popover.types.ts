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
    | 'forceMount'
    | 'preventScroll'
    | 'closeOnEscape'
    | 'closeOnOutsideClick'
    | 'onClosePrevented'
    | 'restoreFocusOnClose'
  > {
    /**
     * Whether the content traps focus, hides outside content from assistive technology, prevents
     * the native default action of outside pointer events, and locks body scroll.
     * This is enabled only when Popover.Content composes Popover.Close; otherwise the Popover
     * remains non-modal so assistive-technology users retain a dismissal route, and a DEV
     * warning is logged. Outside and Escape dismissal remain controlled by `closeOnOutsideClick`
     * and `closeOnEscape`.
     * @default false
     */
    modal?: boolean

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
     * Opens on hover and focus instead of click.
     * @default false
     */
    openOnHover?: boolean

    /**
     * Delay in milliseconds before opening on hover.
     * @default 100
     */
    openDelay?: number

    /**
     * Delay in milliseconds before closing on hover.
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
