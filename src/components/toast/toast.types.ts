import type { Component, JSX } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'
import type {
  FeedbackAction,
  FeedbackCloseReason,
  FeedbackHandle,
  FeedbackId,
  FeedbackPending,
} from '../shared/overlay/feedback/feedback.types'

import type { defaultToastMessages } from './toast.messages'
import type { ToastStyleSlot, ToastStyleVariants } from './toast.style-types'

export const DEFAULT_TOAST_DURATION = 4000
export const DEFAULT_TOAST_GAP = 14

export namespace ToastT {
  export type Kind = 'single'

  export type Slot<T = unknown> = ToastStyleSlot<T>
  export type Variants = ToastStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultToastMessages>
  export type Translations = Partial<Messages>

  export type Id = FeedbackId
  export type CloseReason = FeedbackCloseReason
  export type Action = FeedbackAction

  /** Options passed to toast creation methods. */
  export interface Options extends Variants {
    /**
     * Localized labels for this toast's `close` and `cancel` buttons. Merged per key over the host
     * `translations`; keys missing from both fall back to the provider or English defaults.
     */
    translations?: Translations
    /**
     * Stable id used by `update` and `close`. A numeric id is generated when omitted. Reusing the
     * id of an open toast merges the new options into it, restarts its timer, and returns the
     * existing handle instead of adding a second toast.
     */
    id?: Id
    /**
     * Id of the `<Toast id="..." />` host that shows this toast. Omit to use the host without an
     * id. Throws when no host with that id is mounted.
     */
    hostId?: string
    /** Primary text of the toast. Not rendered when empty. */
    title?: JSX.Element
    /** Secondary text shown below `title`. Not rendered when empty. */
    description?: JSX.Element
    /**
     * Replaces the icon derived from `type` (`info`, `success`, `warning`, `error` and `loading`
     * have one; `default` has none). `null` omits the icon.
     */
    icon?: IconT.Name
    /**
     * Primary action button. Clicking it runs `onClick` and then closes the toast with reason
     * `action`, unless the handler throws, rejects, or calls `event.preventDefault()`. If
     * `onClick` returns a promise the button shows a loading state, the auto-close timer pauses,
     * and the toast closes once the promise resolves.
     * @example
     * ```tsx
     * import { Button, Toast } from 'moraine'
     *
     * const restore = async () => {}
     *
     * <Button
     *   onClick={() =>
     *     Toast.success({
     *       title: 'Item deleted',
     *       action: { label: 'Undo', onClick: () => restore() },
     *     })
     *   }
     * >
     *   Delete
     * </Button>
     * ```
     */
    action?: Action
    /**
     * Secondary button that closes the toast with reason `cancel` after its optional `onClick`
     * runs (same promise and `preventDefault` rules as `action`). `true` shows a button with the
     * localized `cancel` label and no handler.
     */
    cancel?: Action | boolean
    /**
     * Whether the corner close button is shown. Overrides the host `closable`. Never shown on
     * `loading` toasts.
     */
    closable?: boolean
    /**
     * Called once when the toast closes, with the reason: `timeout`, `dismiss` (close button or
     * swipe), `action`, `cancel`, or `api` (`Toast.close`, `handle.close()`, or the host
     * unmounting). Cannot cancel the close. Passing a new `onClose` to `update` replaces it.
     */
    onClose?: (reason: CloseReason) => void
    /** Class for this toast (the `item` slot). */
    class?: SlotClassValue
    /** Inline style for this toast (the `item` slot). */
    style?: SlotStyleValue
    /** Per-slot classes, merged per slot over the host's `classes`. */
    classes?: Classes
    /** Per-slot styles, merged per slot over the host's `styles`. */
    styles?: Styles
    /**
     * Auto-close duration in milliseconds. `Infinity` stays open. Loading toasts never auto-close.
     * The timer pauses while the pointer is over the stack, the window is blurred or the tab is
     * hidden, the toast is being swiped, or an action promise is pending. Falls back to the host
     * `duration`, then `4000`.
     */
    duration?: number
    /**
     * Whether to show a progress bar that depletes over `duration`. Overrides the host
     * `progress`. Never shown on `loading` toasts.
     */
    progress?: boolean
    /**
     * When true, the toast is not added if it matches the front toast of the same host,
     * `placement`, and `align`. A match needs the same `title` and `description` (strings and
     * numbers compare as text, other content by identity), the same `type`, and matching `action`
     * and `cancel` buttons: both unset, both `true`, or both objects with the same `label`,
     * `variant`, and `leading` (`onClick` is not compared). The existing toast is bumped (its
     * timer restarts) and its handle is returned. Not applied when `id` is set. Overrides the
     * host `preventDuplicate`.
     */
    preventDuplicate?: boolean
  }

  /** Options for updating an open toast in place. */
  export type UpdateOptions = Partial<Omit<Options, 'hostId' | 'id'>>

  export interface Handle extends FeedbackHandle<UpdateOptions> {}

  /**
   * States for `Toast.promise`. Each value is a normal toast options object.
   * `success` and `error` may also be a function of the promise result.
   * An omitted state closes the toast.
   */
  export interface PromiseOptions<T = unknown> {
    /** Options of the `loading` toast shown while the promise is pending. Defaults to `{}`. */
    loading?: Options
    /**
     * Options applied to the same toast (as `type: 'success'`) when the promise resolves, or a
     * function of the resolved value that returns them. Omit to close the toast instead.
     * @example
     * ```tsx
     * import { Button, Toast } from 'moraine'
     *
     * const save = () => Promise.resolve({ name: 'report.pdf' })
     *
     * <Button
     *   onClick={() =>
     *     Toast.promise(save(), {
     *       loading: { title: 'Saving…' },
     *       success: (file) => ({ title: `Saved ${file.name}` }),
     *       error: (error) => ({ title: 'Save failed', description: String(error) }),
     *     })
     *   }
     * >
     *   Save
     * </Button>
     * ```
     */
    success?: Options | ((data: T) => Options)
    /**
     * Options applied to the same toast (as `type: 'error'`) when the promise rejects, or a
     * function of the rejection reason that returns them. Omit to close the toast instead.
     */
    error?: Options | ((error: unknown) => Options)
  }

  /** Props for `Toast.custom` and `itemRender`. */
  export interface ItemRenderProps {
    /** Id of the toast being rendered. */
    id: Id
    /** Host defaults merged with the call options. Reflects later `update` calls. */
    options: Options
    /** Which button (`action` or `cancel`) is awaiting a returned promise; `undefined` when idle. */
    pending: () => FeedbackPending | undefined
    /** Runs `options.action.onClick`, then closes with reason `action`. */
    action: (event?: MouseEvent) => Promise<void>
    /** Runs `options.cancel.onClick` when `cancel` is an action, then closes with reason `cancel`. */
    cancel: (event?: MouseEvent) => Promise<void>
    /** Closes the toast. The reason defaults to `dismiss`. */
    close: (reason?: CloseReason) => void
    /** Merges options into this toast and restarts its auto-close timer. */
    update: (options: UpdateOptions) => void
    /** Position index of the toast in its stack; `0` is the front toast. */
    index: number
    /** Whether the toast stack is expanded. */
    expanded: boolean
  }

  /** Base props for the Toast host component. */
  export interface Base {
    /**
     * Localized labels for this host's region (`label`) and the `close` and `cancel` buttons of
     * its toasts. A toast's own `translations` override these per key.
     */
    translations?: Translations
    /**
     * Renders the inner content of every toast on this host that was not opened with
     * `Toast.custom`, replacing the default icon, title, description, actions, and close button.
     * Receives the instance context and the resolved call options.
     * @example
     * ```tsx
     * import { Toast } from 'moraine'
     *
     * <Toast
     *   itemRender={(ctx) => (
     *     <div>
     *       <strong>{ctx.options.title}</strong>
     *       <button type="button" onClick={() => ctx.close()}>
     *         Dismiss
     *       </button>
     *     </div>
     *   )}
     * />
     * ```
     */
    itemRender?: Component<ItemRenderProps>

    /**
     * Max number of toasts shown per stack (one stack per `placement` and `align`). Toasts beyond
     * the limit stay queued but are hidden until earlier ones close.
     * @default 3
     */
    maxVisible?: number

    /**
     * Default auto-close duration in milliseconds for toasts on this host; a toast's own
     * `duration` takes precedence.
     * @default 4000
     */
    duration?: number

    /**
     * Whether toasts on this host show a close button by default; a toast's own `closable`
     * takes precedence.
     * @default false
     */
    closable?: boolean

    /**
     * Whether toasts on this host show the remaining duration progress bar by default; a
     * toast's own `progress` takes precedence.
     * @default false
     */
    progress?: boolean

    /**
     * Whether stacks always show every visible toast at full height. When `false`, stacks collapse
     * behind the front toast and expand while the pointer is over them. The live state reaches
     * `itemRender` as `expanded`.
     * @default false
     */
    expanded?: boolean

    /**
     * Whether toasts on this host skip content that matches the front toast by default; a toast's
     * own `preventDuplicate` takes precedence.
     * @default false
     */
    preventDuplicate?: boolean

    /**
     * Identifier of this host. A toast opened with `hostId: id` is shown here; toasts without
     * `hostId` go to the host that has no `id`. Use unique ids when mounting several hosts.
     */
    id?: string

    /**
     * Spacing in pixels between toasts. Collapsed stacks use it as the peek offset of each toast
     * behind the front one; expanded stacks add it between full toast heights.
     * @default 14
     */
    gap?: number
  }

  /** Props for the Toast host component. */
  export type Props = BaseProps<'section', Base, Variants, Classes, Styles, 'section'>
}

/** Props for the Toast host component. */
export type ToastProps = ToastT.Props
