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

  /**
   * Base props for the Sheet component.
   */
  export interface Base extends Omit<ModalT.Base, 'classes' | 'styles'> {
    /** Family slot class defaults for this Sheet instance. */
    classes?: Classes
    /** Family slot style defaults for this Sheet instance. */
    styles?: Styles
  }
  export type Props = Base

  export type TriggerBase<T extends ValidComponent = 'button'> = ModalT.TriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = ModalT.TriggerProps<T>

  export type ContentClasses = Pick<Classes, 'overlay' | 'content' | 'contentClose'>
  export type ContentStyles = Pick<Styles, 'overlay' | 'content' | 'contentClose'>
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

    /** Composable sheet parts. */
    children?: JSX.Element
  }

  /**
   * Props for the Sheet component.
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
 * Props for the Sheet component.
 */
export type SheetProps = SheetT.Props
