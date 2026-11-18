import type { Component, JSX } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { BaseDialogT } from '../base-dialog/base-dialog.types'
import type { IconT } from '../icon/icon.types'
import type { OverlayTriggerBase, OverlayTriggerComponentProps } from '../shared/overlay/trigger'

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
  export interface Base extends BaseDialogT.Base {
    /**
     * Overrides for the built-in strings of this sheet, merged over the `MoraineProvider` locale.
     * Only `close` is used here: the accessible label of the corner close button.
     * @example
     * ```tsx
     * import { Button, Sheet } from 'moraine'
     *
     * <Sheet translations={{ close: 'Fermer' }}>
     *   <Sheet.Trigger as={Button}>Open</Sheet.Trigger>
     *   <Sheet.Content title="Réglages">Préférences</Sheet.Content>
     * </Sheet>
     * ```
     */
    translations?: Translations

    /**
     * Whether to render the styled backdrop behind the content. When `false` the content is shown
     * without a backdrop; outside presses still follow `closeOnOverlayClick`.
     * @default true
     */
    overlay?: boolean

    /**
     * Whether to show the corner close button inside the content. Its accessible label comes from
     * the `close` translation.
     * @default true
     */
    closable?: boolean

    /**
     * Name of the icon shown in the corner close button.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name
  }
  export type Props = BaseProps<never, Base, Variants, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>

  export type ContentRenderProps = BaseDialogT.ContentRenderProps

  export interface ContentBase<T extends ValidComponent = 'div'> {
    as?: T
    /**
     * Title rendered in a generated header, and used as the accessible name of the sheet
     * (`aria-labelledby`, unless `aria-label` is set). Ignored when the children include an
     * explicit `Sheet.Header`.
     */
    title?: JSX.Element

    /**
     * Description rendered below the title in the generated header, and referenced by
     * `aria-describedby`. Ignored when the children include an explicit `Sheet.Header`.
     */
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

  export type CloseBase<T extends ValidComponent = 'button'> = BaseDialogT.CloseBase<T>
  export type CloseProps<T extends ValidComponent = 'button'> = BaseDialogT.CloseProps<T>
}

/**
 * Props for the Sheet component.
 */
export type SheetProps = SheetT.Props
