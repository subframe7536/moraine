import type { JSX } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop'
import type {
  BaseProps,
  SlotClassValue,
  SlotStyleValue,
  ValidComponent,
} from '../../shared/types.ts'

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

    /** Composed trigger and content primitives. */
    children?: JSX.Element

    /** Family slot class defaults for this Modal instance. */
    classes?: Classes

    /** Family slot style defaults for this Modal instance. */
    styles?: Styles
  }

  export type Props = Base

  export interface TriggerBase<T extends ValidComponent = 'button'> {
    /** Element or component to render as. */
    as?: T
    /** Whether this trigger is disabled. */
    disabled?: boolean
    /** Trigger label and visual content. */
    children?: JSX.Element
  }

  export type TriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never,
    'button'
  >

  export interface OverlayBase {
    /** Receives the mounted overlay element and `undefined` when it unmounts. */
    ref?: (element: HTMLDivElement | undefined) => void

    /** Whether the overlay should scroll its content. */
    scrollable?: boolean

    /** Optional elements rendered inside the overlay. */
    children?: JSX.Element
  }

  export type OverlayProps = BaseProps<'div', OverlayBase, Variant, never, never>

  export interface ContentBase {
    /** Component or element rendered inside the modal content surface. */
    children: ComponentOrElement<ContentRenderProps>

    /** Accessible name used when no visible label is available. */
    ariaLabel?: string

    /** Id of the element that labels the modal content. */
    ariaLabelledBy?: string

    /** Id of the element that describes the modal content. */
    ariaDescribedBy?: string

    /**
     * Whether this surface behaves as a modal dialog: it traps and receives focus,
     * hides outside content from assistive technology, and locks body scroll.
     * @default true
     */
    trapFocus?: boolean
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
