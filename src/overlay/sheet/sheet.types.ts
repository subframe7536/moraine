import type { Component, JSX } from 'solid-js'

import type { IconT } from '../../element/icon/icon.types'
import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { OverlayTriggerBase, OverlayTriggerComponentProps } from '../base/trigger'
import type { ModalT } from '../modal/modal.types'

import type { defaultSheetMessages } from './sheet.messages'
import type { SheetStyleSlot, SheetStyleVariants } from './sheet.style-types'

export namespace SheetT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = SheetStyleSlot<T>

  export type Variants = SheetStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultSheetMessages>
  export type Translations = Partial<Messages>

  /**
   * Base props for the Sheet component.
   */
  export interface Base extends Omit<ModalT.Base, 'classes' | 'styles'> {
    /** Localized message overrides for this sheet instance. */
    translations?: Translations
    /** Whether to render the overlay element.
     * @default true
     */
    overlay?: boolean

    /**
     * Whether to enable transition animations.
     * @default true
     */
    transition?: boolean

    /** Whether to show a close button.
     * @default true
     */
    closable?: boolean

    /** Icon name or custom content for the close button.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name | JSX.Element
  }
  export type Props = BaseProps<never, Base, Variants, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>

  export type ContentRenderProps = ModalT.ContentRenderProps

  export interface ContentBase<T extends ValidComponent = 'div'> {
    as?: T
    /** Primary title displayed in the sheet header. */
    title?: JSX.Element

    /** Secondary description displayed below the title. */
    description?: JSX.Element

    /**
     * Composable sheet parts or render function receiving close action.
     * A render function must declare its parameter, even when unused. A zero-argument
     * function is called as an accessor and is not mounted as a component.
     */
    children?: JSX.Element | Component<ContentRenderProps>
  }

  /**
   * Props for Sheet.Content.
   */
  export type ContentProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    ContentBase<T>,
    never,
    never,
    never,
    'div'
  >

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
