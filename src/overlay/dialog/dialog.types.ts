import type { JSX } from 'solid-js'

import type { IconT } from '../../element/icon/icon.types'
import type { BaseProps, SlotClassValue, SlotStyleValue, ValidComponent } from '../../shared/types'
import type { ModalT } from '../modal/modal.types'

import type { DialogStyleSlot, DialogStyleVariant } from './dialog.style-types'

export namespace DialogT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = DialogStyleSlot<T>

  export type Variant = DialogStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * Base props for the Dialog component.
   */
  export interface Base extends Omit<ModalT.Base, 'classes' | 'styles'> {
    /** Family slot class defaults for this Dialog instance. */
    classes?: Classes
    /** Family slot style defaults for this Dialog instance. */
    styles?: Styles
  }
  export type Props = Base

  export type TriggerBase<T extends ValidComponent = 'button'> = ModalT.TriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = ModalT.TriggerProps<T>

  export type ContentClasses = Pick<Classes, 'overlay' | 'content' | 'contentClose'>
  export type ContentStyles = Pick<Styles, 'overlay' | 'content' | 'contentClose'>
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

    /** Composable dialog parts. */
    children?: JSX.Element
  }

  /**
   * Props for the Dialog component.
   */
  export type ContentProps = BaseProps<'div', ContentBase, Variant, ContentClasses, ContentStyles>

  export interface HeaderBase<T extends ValidComponent = 'div'> {
    as?: T
    children?: JSX.Element
  }
  export type HeaderProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    HeaderBase<T>,
    never,
    never,
    never,
    'div'
  >
  export interface TitleBase<T extends ValidComponent = 'h2'> {
    as?: T
    id?: string
    children?: JSX.Element
  }
  export type TitleProps<T extends ValidComponent = 'h2'> = BaseProps<
    T,
    TitleBase<T>,
    never,
    never,
    never,
    'h2'
  >
  export interface DescriptionBase<T extends ValidComponent = 'p'> {
    as?: T
    id?: string
    children?: JSX.Element
  }
  export type DescriptionProps<T extends ValidComponent = 'p'> = BaseProps<
    T,
    DescriptionBase<T>,
    never,
    never,
    never,
    'p'
  >
  export interface ActionBase<T extends ValidComponent = 'div'> {
    as?: T
    children?: JSX.Element
  }
  export type ActionProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    ActionBase<T>,
    never,
    never,
    never,
    'div'
  >
  export interface BodyBase<T extends ValidComponent = 'div'> {
    as?: T
    children?: JSX.Element
  }
  export type BodyProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    BodyBase<T>,
    never,
    never,
    never,
    'div'
  >
  export interface FooterBase<T extends ValidComponent = 'div'> {
    as?: T
    children?: JSX.Element
  }
  export type FooterProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    FooterBase<T>,
    never,
    never,
    never,
    'div'
  >

  export type CloseBase<T extends ValidComponent = 'button'> = ModalT.CloseBase<T>
  export type CloseProps<T extends ValidComponent = 'button'> = ModalT.CloseProps<T>
}

/**
 * Props for the Dialog component.
 */
export type DialogProps = DialogT.Props
