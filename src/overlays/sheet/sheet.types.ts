import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue, ValidComponent } from '../../shared/types'
import type { ModalT } from '../modal/modal.types'

import type { SheetStyleSlot, SheetStyleVariant } from './sheet.style-types'

export namespace SheetT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = SheetStyleSlot<T>

  export type Variant = SheetStyleVariant

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
   * Base props for the Sheet component.
   */
  export interface Base extends Omit<ModalT.Base, 'classes' | 'styles'> {
    /** Family slot class defaults for this Sheet instance. */
    classes?: Classes
    /** Family slot style defaults for this Sheet instance. */
    styles?: Styles
  }
  export interface ContentBase {
    /**
     * Edge from which the sheet opens.
     * @default 'right'
     */
    side?: 'top' | 'right' | 'bottom' | 'left'

    /** Whether to render the overlay element. */
    overlay?: boolean

    /** Accessible name used when the sheet has no rendered title. */
    ariaLabel?: string

    /**
     * Whether the sheet behaves as a modal surface, including focus containment,
     * outside-content isolation, and body scroll locking.
     * @default true
     */
    trapFocus?: boolean

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

    /** Main content when body is undefined. */
    children?: JSX.Element
  }

  /**
   * Props for the Sheet component.
   */
  export type TriggerProps<T extends ValidComponent = 'button'> = ModalT.TriggerProps<T>
  export type CloseProps<T extends ValidComponent = 'button'> = ModalT.CloseProps<T>
  export type ContentProps = BaseProps<'div', ContentBase, Variant, ContentClasses, ContentStyles>
  export type Props = Base
}

/**
 * Props for the Sheet component.
 */
export interface SheetProps extends SheetT.Props {}
