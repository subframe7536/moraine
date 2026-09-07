import type { JSX, ValidComponent } from 'solid-js'

import type { IconT } from '../../elements/icon/icon.types.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { ModalT } from '../modal/modal.types.ts'

export namespace DialogT {
  export interface Slot<T = unknown> {
    /** Element that opens the dialog. */
    trigger?: T

    /** Backdrop layer rendered behind the dialog panel. */
    overlay?: T

    /** Dialog panel containing header, body, footer, and close control. */
    content?: T

    /** Top region for dialog title and description. */
    header?: T

    /** Inner card wrapper that arranges dialog header, body, and footer. */
    wrapper?: T

    /** Accessible title for the dialog. */
    title?: T

    /** Supporting text associated with the dialog title. */
    description?: T

    /** Button that dismisses the dialog. */
    close?: T

    /** Main dialog content region. */
    body?: T

    /** Bottom region for dialog actions. */
    footer?: T
  }

  export interface Variant {
    fullscreen?: boolean | null
    scrollable?: boolean | null
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Dialog component.
   */
  export interface Base extends ModalT.Base {}
  export interface ContentBase {
    /** Whether to render the overlay element. */
    overlay?: boolean

    /** Accessible name used when the dialog has no rendered title. */
    ariaLabel?: string

    /**
     * Primary title displayed in the dialog header.
     */
    title?: JSX.Element

    /**
     * Secondary description displayed below the title.
     */
    description?: JSX.Element

    /**
     * Whether the dialog should take up the full viewport.
     * @default false
     */
    fullscreen?: boolean

    /** Whether the overlay should scroll the complete dialog panel. */
    scrollable?: boolean

    /**
     * Whether to show a close button.
     * @default true
     */
    close?: boolean

    /**
     * Icon name or custom content for the close button.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name | JSX.Element

    /**
     * Custom element to render in the header slot.
     */
    header?: JSX.Element

    /**
     * Custom element to render in the body slot.
     */
    body?: JSX.Element

    /**
     * Custom element to render in the footer slot.
     */
    footer?: JSX.Element

    /** Main content when body is undefined. */
    children?: JSX.Element
  }

  /**
   * Props for the Dialog component.
   */
  export type TriggerProps<T extends ValidComponent = 'button'> = ModalT.TriggerProps<T>
  export type CloseProps<T extends ValidComponent = 'button'> = ModalT.CloseProps<T>
  export type ContentProps = BaseProps<'div', ContentBase, Variant, Classes, Styles>
  export type Props = Base
}

/**
 * Props for the Dialog component.
 */
export interface DialogProps extends DialogT.Props {}
