import type { Component, JSX } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { BaseDialogT } from '../base-dialog/base-dialog.types'
import type { IconT } from '../icon/icon.types'
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
  export interface Base extends BaseDialogT.Base {
    /**
     * Overrides for the built-in strings of this drawer, merged over the `MoraineProvider` locale.
     * Only `close` is used here: the accessible label of the corner close button.
     * @example
     * ```tsx
     * import { Button, Drawer } from 'moraine'
     *
     * <Drawer translations={{ close: 'Fermer' }}>
     *   <Drawer.Trigger as={Button}>Open</Drawer.Trigger>
     *   <Drawer.Content title="Réglages">Préférences</Drawer.Content>
     * </Drawer>
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

    /**
     * Whether to render the decorative grab handle. It is only rendered when `side` is `top` or
     * `bottom`.
     * @default true
     */
    handle?: boolean

    /**
     * Visible heights the drawer can rest at, measured from the edge it opens from, in any order.
     * Each is a number (`<= 1` is a fraction of the viewport height, `> 1` is pixels) or a `px` or
     * `rem` string; heights are clamped to the drawer and the viewport. Releasing a swipe settles
     * on the closest point (projected by the swipe velocity), and dragging past the lowest point
     * dismisses the drawer. Only honored when `side` is `top` or `bottom`.
     * @example
     * ```tsx
     * import { Button, Drawer } from 'moraine'
     *
     * <Drawer snapPoints={[0.4, '24rem', 1]}>
     *   <Drawer.Trigger as={Button}>Open</Drawer.Trigger>
     *   <Drawer.Content title="Details">Drawer content</Drawer.Content>
     * </Drawer>
     * ```
     */
    snapPoints?: SnapPoint[]

    /**
     * Controlled active snap point, normally one of the `snapPoints` entries. `null` selects the
     * fully open position and `undefined` leaves the state uncontrolled (see `defaultSnapPoint`). Update it
     * from `onSnapPointChange`.
     */
    snapPoint?: SnapPoint | null

    /**
     * Snap point the drawer opens at when `snapPoint` is not set. The drawer returns to it after
     * each close.
     * @default snapPoints[0] ?? null
     */
    defaultSnapPoint?: SnapPoint | null

    /**
     * Called with the new active snap point when a swipe settles on a different one, and with the
     * default point after the drawer has finished closing, if the active point differed. `null`
     * means fully open.
     * @example
     * ```tsx
     * import { Button, Drawer } from 'moraine'
     * import type { DrawerT } from 'moraine'
     * import { createSignal } from 'solid-js'
     *
     * const [snapPoint, setSnapPoint] = createSignal<DrawerT.SnapPoint | null>(0.4)
     *
     * <Drawer snapPoints={[0.4, 1]} snapPoint={snapPoint()} onSnapPointChange={setSnapPoint}>
     *   <Drawer.Trigger as={Button}>Open</Drawer.Trigger>
     *   <Drawer.Content title="Details">Drawer content</Drawer.Content>
     * </Drawer>
     * ```
     */
    onSnapPointChange?: (snapPoint: SnapPoint | null) => void

    /**
     * Whether a fast flick settles on the next adjacent snap point (or dismisses past the lowest
     * one) instead of projecting the swipe velocity onto the closest point.
     * @default false
     */
    snapToSequentialPoints?: boolean
  }
  export type Props = BaseProps<never, Base, Variants, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>

  export type ContentRenderProps = BaseDialogT.ContentRenderProps

  export interface ContentBase<T extends ValidComponent = 'div'> {
    as?: T
    /**
     * Title rendered in a generated header, and used as the accessible name of the drawer
     * (`aria-labelledby`, unless `aria-label` is set). Ignored when the children include an
     * explicit `Drawer.Header`.
     */
    title?: JSX.Element

    /**
     * Description rendered below the title in the generated header, and referenced by
     * `aria-describedby`. Ignored when the children include an explicit `Drawer.Header`.
     */
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

  export type CloseBase<T extends ValidComponent = 'button'> = BaseDialogT.CloseBase<T>
  export type CloseProps<T extends ValidComponent = 'button'> = BaseDialogT.CloseProps<T>
}

/**
 * Props for the Drawer component.
 */
export type DrawerProps = DrawerT.Props
