import type { JSX, ValidComponent } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { ModalT } from '../modal/modal.types.ts'

export namespace SheetT {
  export interface Slot<T = unknown> {
    /** Element that opens the sheet. */
    trigger?: T

    /** Backdrop layer rendered behind the sheet panel. */
    overlay?: T

    /** Slide-in panel containing header, body, footer, and close control. */
    content?: T

    /** Top region for sheet title and description. */
    header?: T

    /** Inner wrapper that arranges sheet header, body, footer, and actions. */
    wrapper?: T

    /** Accessible title for the sheet. */
    title?: T

    /** Supporting text associated with the sheet title. */
    description?: T

    /** Header action region, usually paired with the close control. */
    actions?: T

    /** Button that dismisses the sheet. */
    close?: T

    /** Main sheet content region. */
    body?: T

    /** Bottom region for sheet actions. */
    footer?: T
  }

  export interface Variant {
    side?: 'top' | 'right' | 'bottom' | 'left' | null
    inset?: boolean | 'true' | 'false' | null
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Sheet component.
   */
  export interface Base extends ModalT.Base {}
  export interface ContentBase {
    /** Whether to render the overlay element. */
    overlay?: boolean

    /** Accessible name used when the sheet has no rendered title. */
    ariaLabel?: string

    /**
     * Primary title displayed in the sheet header.
     */
    title?: JSX.Element

    /**
     * Secondary description displayed below the title.
     */
    description?: JSX.Element

    /**
     * Whether to enable transition animations.
     * @default true
     */
    transition?: boolean

    /**
     * Whether to show a close button, or a custom element to use as one.
     * @default true
     */
    close?: JSX.Element

    /**
     * Custom element to render in the header slot.
     */
    header?: JSX.Element

    /**
     * Custom element to render in the scrollable body slot.
     */
    body?: JSX.Element

    /**
     * Custom element to render in the footer slot.
     */
    footer?: JSX.Element

    /**
     * Additional action elements to render in the header.
     */
    action?: JSX.Element

    /** Main content when body is undefined. */
    children?: JSX.Element
  }

  /**
   * Props for the Sheet component.
   */
  export type TriggerProps<T extends ValidComponent = 'button'> = ModalT.TriggerProps<T>
  export type CloseProps<T extends ValidComponent = 'button'> = ModalT.CloseProps<T>
  export type ContentProps = BaseProps<'div', ContentBase, Variant, Classes, Styles>
  export type Props = Base
}

/**
 * Props for the Sheet component.
 */
export interface SheetProps extends SheetT.Props {}
