import type { JSX } from 'solid-js'

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

    /**
     * Whether the surface contains focus, restores focus on close, hides outside content from
     * assistive technology, and prevents the native default action of outside pointer events.
     * Outside pointer and Escape dismissal remain controlled by `dismissible`.
     * @default true
     */
    modal?: boolean

    /** Default destination for Modal.Portal; defaults to the trigger document body. */
    portalMount?: Node

    /** Composed trigger and content primitives. */
    children?: JSX.Element

    /** Family slot class defaults for this Modal instance. */
    classes?: Classes

    /** Family slot style defaults for this Modal instance. */
    styles?: Styles
  }

  export type Props = Base

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
    /** Receives the mounted overlay element and `undefined` when it unmounts. */
    ref?: (element: HTMLDivElement | undefined) => void

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

  export type OverlayProps = BaseProps<'div', OverlayBase, Variant, never, never>

  export interface ContentBase {
    /**
     * Content or render function inside the modal content surface.
     * A render function must declare its parameter, even when unused. A zero-argument
     * function is called as an accessor and is not mounted as a component.
     */
    children: JSX.Element | ((props: ContentRenderProps) => JSX.Element)

    /** Accessible name used when no visible label is available. */
    ariaLabel?: string

    /** Id of the element that labels the modal content. */
    ariaLabelledBy?: string

    /** Id of the element that describes the modal content. */
    ariaDescribedBy?: string
  }

  export type ContentProps = BaseProps<'div', ContentBase, Variant, never, never>

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
