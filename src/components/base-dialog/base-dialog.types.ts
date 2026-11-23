import type { JSX } from '@solidjs/web'
import type { Component, Ref } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type {
  OverlayCloseBase,
  OverlayCloseComponentProps,
  OverlayTriggerBase,
  OverlayTriggerComponentProps,
} from '../shared/overlay/trigger'
import type {
  OverlayDisclosureProps,
  OverlayDismissProps,
  OverlayPortalProps,
} from '../shared/overlay/types'

import type { BaseDialogStyleSlot, BaseDialogStyleVariants } from './base-dialog.style-types'
export namespace BaseDialogT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = BaseDialogStyleSlot<T>
  export type Variants = BaseDialogStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface ContentRenderProps {
    /** Closes the modal. */
    close: () => void
  }

  export interface Base extends OverlayDisclosureProps, OverlayDismissProps, OverlayPortalProps {
    /**
     * Unique identifier used to derive the content id, which becomes `<id>-content`. Generated
     * when omitted.
     */
    id?: string

    /**
     * Called with the next open state when the trigger, a close part, Escape or an outside press
     * requests a change. It is not called when `open` is changed from outside, and it does not
     * apply the change itself when `open` is controlled: update `open` in the handler.
     * @example
     * ```tsx
     * import { Button, Dialog } from 'moraine'
     * import { createSignal } from 'solid-js'
     *
     * const [open, setOpen] = createSignal(false)
     *
     * <Dialog open={open()} onOpenChange={setOpen}>
     *   <Dialog.Trigger as={Button}>Open</Dialog.Trigger>
     *   <Dialog.Content title="Settings">Preferences</Dialog.Content>
     * </Dialog>
     * ```
     */
    onOpenChange?: (open: boolean) => void

    /**
     * Called once after a close has finished: the exit motion is over and the content is
     * unmounted. With `transition` set to `false` there is no motion to wait for. It is not called
     * when the content is removed while still open.
     */
    onExitComplete?: () => void

    /**
     * Whether enter and exit transition animations play. When `false`, the content and overlay
     * mount and unmount without waiting for an animation to end. The value is read when content
     * registers, so changes take effect the next time content mounts.
     * @default true
     */
    transition?: boolean

    /**
     * Whether body scroll should be locked while the shell is present. Defaults to the value of
     * `modal`: modal shells lock scroll, non-modal shells do not unless set.
     */
    preventScroll?: boolean

    /**
     * Whether the surface contains focus, restores focus on close, hides outside content from
     * assistive technology, and prevents the native default action of outside pointer events.
     * Outside pointer dismissal is controlled by `closeOnOutsideClick`.
     * Escape dismissal is controlled by `closeOnEscape`. When `false`, focus is neither trapped,
     * moved on open nor restored on close, so `initialFocus` and `finalFocus` have no effect.
     * @default true
     */
    modal?: boolean

    /**
     * DOM node that `BaseDialog.Portal`, and the content of `Dialog`, `Sheet` and `Drawer`, render into,
     * for example a container element or a shadow root. A `mount` on `BaseDialog.Portal` takes
     * precedence. Defaults to the `body` of the trigger's document.
     * @example
     * ```tsx
     * import { Button, Dialog } from 'moraine'
     *
     * const container = document.getElementById('overlay-root') ?? document.body
     *
     * <Dialog mount={container}>
     *   <Dialog.Trigger as={Button}>Open</Dialog.Trigger>
     *   <Dialog.Content title="Settings">Preferences</Dialog.Content>
     * </Dialog>
     * ```
     */
    mount?: Element | ShadowRoot

    /**
     * Element (or accessor resolving to one) that receives focus when the shell opens, or `false`
     * to skip the open-time focus move. Defaults to the first focusable element inside the
     * content, preferring an `[autofocus]` or `[data-autofocus]` descendant, and to the content
     * itself when opened by touch. An accessor that returns `undefined` falls back to the default.
     * Only applies while `modal` is `true`.
     * @example
     * ```tsx
     * import { Button, Dialog } from 'moraine'
     * import { createSignal } from 'solid-js'
     *
     * const [input, setInput] = createSignal<HTMLInputElement>()
     *
     * <Dialog initialFocus={() => input()}>
     *   <Dialog.Trigger as={Button}>Rename</Dialog.Trigger>
     *   <Dialog.Content title="Rename">
     *     <input ref={setInput} />
     *   </Dialog.Content>
     * </Dialog>
     * ```
     */
    initialFocus?: HTMLElement | (() => HTMLElement | undefined) | false

    /**
     * Element (or accessor resolving to one) that receives focus after the shell closes, or
     * `false` to skip the close-time focus restore. Defaults to the trigger, then the element
     * focused when the shell opened. An accessor that returns `undefined` restores no focus. Only
     * applies while `modal` is `true`.
     * @example
     * ```tsx
     * import { Button, Dialog } from 'moraine'
     *
     * <Dialog finalFocus={() => document.getElementById('search') ?? undefined}>
     *   <Dialog.Trigger as={Button}>Open</Dialog.Trigger>
     *   <Dialog.Content title="Settings">Preferences</Dialog.Content>
     * </Dialog>
     * ```
     */
    finalFocus?: HTMLElement | (() => HTMLElement | undefined) | false

    /** Composed trigger and content primitives. */
    children?: JSX.Element
  }

  export type Props = BaseProps<never, Base, Variants, Classes, Styles, never>

  export interface PortalBase {
    /**
     * DOM node the overlay and content render into. Takes precedence over `mount` on `BaseDialog`;
     * defaults to the `body` of the trigger's document.
     */
    mount?: Element | ShadowRoot
    /** Overlay and content parts rendered in the same portal. */
    children?: JSX.Element
  }

  export type PortalProps = PortalBase

  export type TriggerBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>

  export interface OverlayBase {
    /** Receives the mounted overlay element. */
    ref?: Ref<HTMLDivElement>

    /**
     * Whether the overlay element itself scrolls, so content taller than the viewport scrolls
     * inside the backdrop (with padding) while `preventScroll` keeps the page itself from
     * scrolling.
     * @default false
     */
    scrollable?: boolean

    /** Optional elements rendered inside the overlay. */
    children?: JSX.Element
  }

  export type OverlayProps = BaseProps<'div', OverlayBase, never, never, never>

  export interface ContentBase<T extends ValidComponent = 'div'> {
    as?: T
    /**
     * Content or render function inside the modal content surface.
     * A render function must declare its parameter, even when unused. A zero-argument
     * function is called as an accessor and is not mounted as a component.
     */
    children?: JSX.Element | Component<ContentRenderProps>
  }

  export type ContentProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    ContentBase<T>,
    never,
    never,
    never,
    'div'
  >

  export type CloseBase<T extends ValidComponent = 'button'> = OverlayCloseBase<T>
  export type CloseProps<T extends ValidComponent = 'button'> = OverlayCloseComponentProps<T>
}

/** Props for the BaseDialog component. */
export type BaseDialogProps = BaseDialogT.Props
