import type { JSX, ValidComponent } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue } from '../../shared/types'

import type { ModalStyleSlot, ModalStyleVariant } from './modal.style-types'

export namespace ModalT {
  export type Kind = 'composite'

  export type TriggerElementFor<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[T]
    : HTMLElement

  export interface ContentContext {
    /** Closes the modal. */
    close: () => void
  }

  export interface Base {
    /** Unique identifier used to derive the content id. */
    id?: string

    /** Controlled open state. */
    open?: boolean

    /**
     * Initial open state when uncontrolled.
     * @default false
     */
    defaultOpen?: boolean

    /** Called whenever the open state changes. */
    onOpenChange?: (open: boolean) => void

    /** Called after the modal has fully finished its exit motion. */
    onExitComplete?: () => void

    /**
     * Whether outside interaction and Escape should dismiss the shell.
     * @default true
     */
    dismissible?: boolean

    /** Called when a dismissal attempt is blocked. */
    onClosePrevent?: () => void

    /**
     * Whether body scroll should be locked while the shell is present.
     * @default true
     */
    preventScroll?: boolean

    /** Composed trigger and content primitives. */
    children?: JSX.Element
  }

  export type Slot<T = unknown> = ModalStyleSlot<T>
  export type Variant = ModalStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<JSX.CSSProperties>
  export interface Item {}

  export type Props = Base

  export type TriggerBase<T extends ValidComponent = 'button'> = {
    /** Element or component to render as. @default 'button' */
    as?: T
    type?: T extends 'a'
      ? JSX.AnchorHTMLAttributes<HTMLAnchorElement>['type']
      : T extends 'button'
        ? JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
        : T extends 'input'
          ? JSX.InputHTMLAttributes<HTMLInputElement>['type']
          : JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
    /** Whether this trigger is disabled. */
    disabled?: boolean
    onClick?: JSX.EventHandlerUnion<TriggerElementFor<T>, MouseEvent>
    onKeyDown?: JSX.EventHandlerUnion<TriggerElementFor<T>, KeyboardEvent>
    onKeyUp?: JSX.EventHandlerUnion<TriggerElementFor<T>, KeyboardEvent>
    onBlur?: JSX.EventHandlerUnion<TriggerElementFor<T>, FocusEvent>
    onPointerDown?: JSX.EventHandlerUnion<TriggerElementFor<T>, PointerEvent>
    onPointerUp?: JSX.EventHandlerUnion<TriggerElementFor<T>, PointerEvent>
    onPointerMove?: JSX.EventHandlerUnion<TriggerElementFor<T>, PointerEvent>
    onPointerCancel?: JSX.EventHandlerUnion<TriggerElementFor<T>, PointerEvent>
    onContextMenu?: JSX.EventHandlerUnion<TriggerElementFor<T>, MouseEvent>
    /** Trigger label and visual content. */
    children?: JSX.Element
  }

  export type TriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never
  >

  export interface OverlayBase {
    /** Receives the mounted overlay element and `undefined` when it unmounts. */
    ref?: (element: HTMLDivElement | undefined) => void

    /** Whether the overlay should scroll its content. */
    scrollable?: boolean

    /** Optional elements rendered inside the overlay. */
    children?: JSX.Element
  }

  export type OverlayProps = BaseProps<'div', OverlayBase, Variant, Classes, Styles>

  export interface ContentBase {
    /** Component or element rendered inside the modal content surface. */
    children: ComponentOrElement<ContentContext>

    /** Accessible name used when no visible label is available. */
    ariaLabel?: string

    /** Id of the element that labels the modal content. */
    ariaLabelledBy?: string

    /** Id of the element that describes the modal content. */
    ariaDescribedBy?: string
  }

  export type ContentProps = BaseProps<'div', ContentBase, Variant, Classes, Styles>
  export type CloseProps<T extends ValidComponent = 'button'> = TriggerProps<T>
}

/** Props for the Modal component. */
export type ModalProps = ModalT.Props
