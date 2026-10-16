import type { Component, JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { OverlayTriggerBase, OverlayTriggerComponentProps } from '../base/trigger'

import type { ModalStyleSlot, ModalStyleVariant } from './modal.style-types'

export namespace ModalT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = ModalStyleSlot<T>
  export type Variant = ModalStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface ContentRenderProps {
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
     * Whether an outside pointer press on the overlay dismisses the shell.
     * `false` blocks the press and reports it through `onClosePrevent`.
     * @default true
     */
    closeOnOverlayClick?: boolean

    /**
     * Whether Escape dismisses the shell.
     * `false` blocks Escape and reports it through `onClosePrevent`.
     * @default true
     */
    closeOnEscape?: boolean

    /** Called when a dismissal attempt is blocked. */
    onClosePrevent?: () => void

    /**
     * Whether body scroll should be locked while the shell is present.
     * @default true
     */
    preventScroll?: boolean

    /**
     * Whether the surface contains focus, restores focus on close, hides outside content from
     * assistive technology, and prevents the native default action of outside pointer events.
     * Outside pointer dismissal is controlled by `closeOnOverlayClick`.
     * Escape dismissal is controlled by `closeOnEscape`.
     * @default true
     */
    modal?: boolean

    /** Default destination for Modal.Portal; defaults to the trigger document body. */
    portalMount?: Node

    /** Composed trigger and content primitives. */
    children?: JSX.Element
  }

  export type Props = BaseProps<never, Base, Variant, Classes, Styles, never>

  export interface PortalBase {
    /** Destination for the modal parts; defaults to the trigger document body. */
    mount?: Node
    /** Overlay and content parts rendered in the same portal. */
    children?: JSX.Element
  }

  export type PortalProps = PortalBase

  export type TriggerBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>

  export interface OverlayBase {
    /** Receives the mounted overlay element. */
    ref?: (element: HTMLDivElement) => void

    /**
     * Whether to render the visual backdrop layer. When false, acts as an unstyled container for nested content.
     * @default true
     */
    overlay?: boolean

    /** Whether the overlay should scroll its content. */
    scrollable?: boolean

    /** Optional elements rendered inside the overlay. */
    children?: JSX.Element
  }

  export type OverlayProps = BaseProps<'div', OverlayBase, never, never, never>

  export interface ContentBase {
    /**
     * Content or render function inside the modal content surface.
     */
    children: JSX.Element | Component<ContentRenderProps>
  }

  export type ContentProps = BaseProps<'div', ContentBase, never, never, never>

  export type CloseBase<T extends ValidComponent = 'button'> = TriggerBase<T>
  export type CloseProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    CloseBase<T>,
    never,
    never,
    never,
    'button'
  >
}

/** Props for the Modal component. */
export type ModalProps = ModalT.Props
