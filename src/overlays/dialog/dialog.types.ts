import type { JSX } from 'solid-js'

import type { IconT } from '../../elements/icon/icon.types'
import type { BaseProps, SlotClassValue, SlotStyleValue, ValidComponent } from '../../shared/types'
import type { ModalT } from '../modal/modal.types'

import type { DialogStyleSlot, DialogStyleVariant } from './dialog.style-types'

export namespace DialogT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = DialogStyleSlot<T>

  export type Variant = DialogStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type ContentClasses = Pick<
    Classes,
    'overlay' | 'content' | 'header' | 'title' | 'description' | 'contentClose' | 'body' | 'footer'
  >
  export type ContentStyles = Pick<
    Styles,
    'overlay' | 'content' | 'header' | 'title' | 'description' | 'contentClose' | 'body' | 'footer'
  >
  export interface Item {}

  /**
   * Base props for the Dialog component.
   */
  export interface Base extends Omit<ModalT.Base, 'classes' | 'styles'> {
    /** Family slot class defaults for this Dialog instance. */
    classes?: Classes
    /** Family slot style defaults for this Dialog instance. */
    styles?: Styles
  }
  export interface ContentBase {
    /** Whether to render the overlay element. */
    overlay?: boolean

    /** Accessible name used when the dialog has no rendered title. */
    ariaLabel?: string

    /**
     * Whether the dialog behaves as a modal surface, including focus containment,
     * outside-content isolation, and body scroll locking.
     * @default true
     */
    trapFocus?: boolean

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
  export type ContentProps = BaseProps<'div', ContentBase, Variant, ContentClasses, ContentStyles>
  export type Props = Base
}

/**
 * Props for the Dialog component.
 */
export interface DialogProps extends DialogT.Props {}
