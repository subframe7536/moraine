import type { Component, JSX } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon/icon.types'
import type { ModalT } from '../modal/modal.types'
import type { OverlayTriggerBase, OverlayTriggerComponentProps } from '../shared/overlay/trigger'

import type { defaultDrawerMessages } from './drawer.messages'
import type { DrawerStyleSlot, DrawerStyleVariants } from './drawer.style-types'

export namespace DrawerT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = DrawerStyleSlot<T>

  export type Variants = DrawerStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultDrawerMessages>
  export type Translations = Partial<Messages>

  /**
   * A snap point: a fraction of the viewport height (`<= 1`), a pixel count
   * (`> 1`), or a `px`/`rem` string.
   */
  export type SnapPoint = number | `${number}px` | `${number}rem`

  /**
   * Base props for the Drawer component.
   */
  export interface Base extends ModalT.Base {
    /** Localized message overrides for this drawer instance. */
    translations?: Translations
    /** Whether to render the overlay element.
     * @default true
     */
    overlay?: boolean

    /** Whether to show a close button.
     * @default false
     */
    closable?: boolean

    /** Icon name or custom content for the close button.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name | JSX.Element

    /** Whether to render the decorative grab handle. Only rendered for `top` and `bottom` sides.
     * @default true
     */
    handle?: boolean

    /** Snap points the drawer can rest at. Only honored for `top` and `bottom` sides. */
    snapPoints?: SnapPoint[]

    /** Controlled active snap point. `null` selects the fully open position. */
    snapPoint?: SnapPoint | null

    /** Active snap point on mount.
     * @default snapPoints[0] ?? null
     */
    defaultSnapPoint?: SnapPoint | null

    /** Called when the active snap point changes. */
    onSnapPointChange?: (snapPoint: SnapPoint | null) => void

    /** Whether a flick settles on the next adjacent snap point instead of the closest one.
     * @default false
     */
    snapToSequentialPoints?: boolean
  }
  export type Props = BaseProps<never, Base, Variants, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>

  export type ContentRenderProps = ModalT.ContentRenderProps

  export interface ContentBase<T extends ValidComponent = 'div'> {
    as?: T
    /** Primary title displayed in the drawer header. */
    title?: JSX.Element

    /** Secondary description displayed below the title. */
    description?: JSX.Element

    /**
     * Composable drawer parts or render function receiving close action.
     * A render function must declare its parameter, even when unused. A zero-argument
     * function is called as an accessor and is not mounted as a component.
     */
    children?: JSX.Element | Component<ContentRenderProps>
  }

  /**
   * Props for Drawer.Content.
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
 * Props for the Drawer component.
 */
export type DrawerProps = DrawerT.Props
