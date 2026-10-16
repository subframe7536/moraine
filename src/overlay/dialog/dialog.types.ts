import type { Component, JSX } from 'solid-js'

import type { IconT } from '../../element/icon/icon.types'
import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { OverlayTriggerBase, OverlayTriggerComponentProps } from '../base/trigger'
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
  export interface Base extends ModalT.Base {
    /** Whether to render the overlay element.
     * @default true
     */
    overlay?: boolean

    /**
     * Whether the dialog should take up the full viewport.
     * @default false
     */
    fullscreen?: boolean | null

    /** Whether the overlay should scroll the complete dialog panel.
     * @default false
     */
    scrollable?: boolean | null

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
  }
  export type Props = BaseProps<never, Base, Variant, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>

  export type ContentRenderProps = ModalT.ContentRenderProps

  export interface ContentBase {
    /** Primary title displayed in the dialog header. */
    title?: JSX.Element

    /** Secondary description displayed below the title. */
    description?: JSX.Element

    /** Composable dialog parts or render function receiving close action. */
    children?: JSX.Element | Component<ContentRenderProps>
  }

  /**
   * Props for Dialog.Content.
   */
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never>

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
 * Props for the Dialog component.
 */
export type DialogProps = DialogT.Props
