import type { Component, JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { DialogT } from '../dialog/dialog.types'
import type { IconT } from '../icon'
import type {
  FeedbackAction,
  FeedbackCloseReason,
  FeedbackHandle,
  FeedbackId,
  FeedbackPending,
} from '../shared/overlay/feedback/feedback.types'

import type { AlertDialogStyleSlot, AlertDialogStyleVariants } from './alert-dialog.style-types'

export namespace AlertDialogT {
  export type Kind = 'single'

  export type Slot<T = unknown> = AlertDialogStyleSlot<T>
  export type Variants = AlertDialogStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Id = FeedbackId
  export type CloseReason = FeedbackCloseReason
  export type Type = 'default' | 'info' | 'success' | 'warning' | 'error'
  export type Action = FeedbackAction

  /** Defaults applied to every alert dialog opened on this host. */
  export interface Base {
    /**
     * Overrides the built-in strings for every dialog on this host: `close` (corner close button
     * label), `ok` (default action label), and `cancel` (default cancel label). A dialog's own
     * `translations` option is merged over these per key.
     * @example
     * ```tsx
     * import { AlertDialog } from 'moraine'
     *
     * <AlertDialog translations={{ ok: 'Got it', cancel: 'Never mind' }} />
     * ```
     */
    translations?: DialogT.Translations
    /**
     * Unique identifier for this host when multiple hosts are mounted.
     * A call without `hostId` goes to the last mounted host without an id. Pass `hostId` in the
     * call options to target one host. If duplicate ids are mounted, the last mounted host takes precedence.
     * Unmounting a host settles its open dialogs with reason `api`.
     */
    id?: string

    /**
     * Renders the inner content of every dialog on this host that was not opened with
     * `AlertDialog.custom`, replacing the built-in icon, title, description, and buttons. Receives the
     * instance context and the resolved call options. Put `titleId` and `descriptionId` on your
     * title and description so the dialog is named and described for assistive technology.
     * @example
     * ```tsx
     * import { AlertDialog, Button } from 'moraine'
     *
     * <AlertDialog
     *   dialogRender={(ctx) => (
     *     <div>
     *       <h2 id={ctx.titleId}>{ctx.options.title}</h2>
     *       <Button onClick={() => ctx.close('dismiss')}>Close</Button>
     *     </div>
     *   )}
     * />
     * ```
     */
    dialogRender?: Component<DialogRenderProps>

    /**
     * Whether the corner close button is shown. Closing with it settles the dialog with reason
     * `dismiss`. The button is hidden while an action or cancel promise is pending.
     * @default false
     */
    closable?: boolean

    /**
     * Whether enter and exit transition animations play for dialogs on this host.
     * Changes take effect the next time a dialog's content mounts.
     * @default true
     */
    transition?: boolean

    /**
     * Whether Escape dismisses the dialog (reason `dismiss`). Ignored while an action or cancel
     * promise is pending.
     * @default true
     */
    closeOnEscape?: boolean

    /**
     * Whether a pointer press on the overlay outside the panel dismisses the dialog (reason
     * `dismiss`). Ignored while an action or cancel promise is pending.
     * @default false
     */
    closeOnOutsideClick?: boolean

    /**
     * Default status tone for dialogs on this host. It picks the leading icon and its color
     * (`default` has no icon); `AlertDialog.info`, `success`, `warning` and `error` override it per
     * call.
     * @default 'default'
     */
    type?: Type

    /** Dialog panel `max-width`. A number is in pixels; a string is any CSS length, e.g. `'32rem'`. */
    maxWidth?: string | number
  }

  /** Props for the AlertDialog host component. */
  export type Props = BaseProps<never, Base, Variants, Classes, Styles>

  /** Options passed to alert dialog creation methods. */
  export interface Options {
    /**
     * Stable id used by `update` and `close`. Reusing an open id with the same method and render
     * updates that dialog in place; otherwise the open dialog closes with `api` and a new one opens.
     */
    id?: Id
    /**
     * Id of the `<AlertDialog id="..." />` host that shows this dialog. Omit to use the last mounted
     * host without an id. Throws when no matching host is mounted.
     */
    hostId?: string
    /** Status tone, overriding the host. Methods such as `info` and `error` set this for you. */
    type?: Type
    /** Dialog heading. It also names the dialog; omit it only with `AlertDialog.custom` or `ariaLabel`. */
    title: JSX.Element
    /** Supporting text rendered under the title. Omitted when empty. */
    description?: JSX.Element
    /** Replaces the icon of the `type`. `null` omits the icon. */
    icon?: IconT.Name
    /**
     * Primary (OK) action. `label` defaults to the locale `ok` text. Clicking runs `onClick`, then
     * closes with reason `action`. A returned promise shows loading on the button, disables the
     * cancel button, and closes when it resolves; a throw or rejection (logged to the console), or
     * `event.preventDefault()`, keeps the dialog open.
     * @example
     * ```tsx
     * import { AlertDialog, Button } from 'moraine'
     *
     * <>
     *   <AlertDialog />
     *   <Button
     *     onClick={() =>
     *       AlertDialog.confirm({
     *         title: 'Delete file?',
     *         action: {
     *           label: 'Delete',
     *           tone: 'danger',
     *           onClick: async () => {
     *             await new Promise((resolve) => setTimeout(resolve, 500))
     *           },
     *         },
     *       })
     *     }
     *   >
     *     Delete
     *   </Button>
     * </>
     * ```
     */
    action?: Action
    /**
     * Cancel action. `true` shows a button with the locale `cancel` label, `false` hides it, and an
     * action object customizes it (it follows the same click, promise and `preventDefault()` rules
     * as `action` and closes with reason `cancel`). When omitted, `AlertDialog.confirm` shows the
     * button and the other methods hide it.
     * @example
     * ```tsx
     * import { AlertDialog, Button } from 'moraine'
     *
     * <>
     *   <AlertDialog />
     *   <Button
     *     onClick={() =>
     *       AlertDialog.warning({
     *         title: 'Discard changes?',
     *         cancel: { label: 'Keep editing' },
     *         action: { label: 'Discard' },
     *       })
     *     }
     *   >
     *     Open
     *   </Button>
     * </>
     * ```
     */
    cancel?: Action | boolean
    /**
     * Whether the corner close button is shown, overriding the host. Hidden while an action or
     * cancel promise is pending.
     */
    closable?: boolean
    /**
     * Whether enter and exit transition animations play for this dialog, overriding the host.
     * Changes take effect the next time the dialog's content mounts.
     */
    transition?: boolean
    /**
     * Called once when the dialog closes, with the reason: `action` or `cancel` (button), `dismiss`
     * (Escape, overlay click, close button, or `close()` in a custom render), or `api` (`handle.close()`,
     * `AlertDialog.close`, replacement by the same `id`, or host unmount).
     */
    onClose?: (reason: CloseReason) => void
    /** Class for the dialog panel (the `content` slot). */
    class?: SlotClassValue
    /** Inline style for the dialog panel (the `content` slot). */
    style?: SlotStyleValue
    /** Per-slot classes, merged per slot over the host's `classes`. */
    classes?: Classes
    /** Per-slot styles, merged per slot over the host's `styles`. */
    styles?: Styles
    /** Layout alignment override. `null` overrides the host value instead of inheriting it. */
    align?: Variants['align'] | null
    /** Visual variant override. `null` overrides the host value instead of inheriting it. */
    variant?: Variants['variant'] | null
    /** Panel `max-width` for this dialog, overriding the host. A number is in pixels. */
    maxWidth?: string | number
    /** Whether Escape dismisses this dialog, overriding the host. */
    closeOnEscape?: boolean
    /** Whether an overlay press dismisses this dialog, overriding the host. */
    closeOnOutsideClick?: boolean
    /** Accessible name used when `title` is absent; `AlertDialog.custom` may omit `title`. */
    ariaLabel?: string
    /** Localized message overrides for this dialog, merged per key over the host translations. */
    translations?: DialogT.Translations
  }

  /**
   * Options for `AlertDialog.custom`. `title` is optional because the render owns the content and
   * may name the dialog with `titleId` or `ariaLabel`.
   */
  export type CustomOptions = Omit<Options, 'title'> & { title?: JSX.Element }

  /** Selects dialogs for `AlertDialog.close`. Omitted fields match every dialog. */
  export interface CloseTarget {
    /** Closes only the dialog with this id. */
    id?: Id
    /** Closes only dialogs on `<AlertDialog id="..." />`. */
    hostId?: string
  }

  /** Options for updating an open alert dialog in place. */
  export type UpdateOptions = Partial<Omit<Options, 'hostId' | 'id'>>

  export interface Handle extends FeedbackHandle<UpdateOptions> {}

  /** Props for `AlertDialog.custom` and `dialogRender`. */
  export interface DialogRenderProps {
    id: Id
    /** Host defaults merged with the call options. Reflects later `update` calls. */
    options: Options
    pending: () => FeedbackPending | undefined
    /** Runs `options.action.onClick`, then closes with reason `action`. */
    action: (event?: MouseEvent) => Promise<void>
    /** Runs `options.cancel.onClick` when `cancel` is an action, then closes with reason `cancel`. */
    cancel: (event?: MouseEvent) => Promise<void>
    /** Closes the dialog. The reason defaults to `dismiss`. */
    close: (reason?: CloseReason) => void
    update: (options: UpdateOptions) => void
    /** Id to place on the custom title so the dialog is named by `aria-labelledby`. */
    titleId: string
    /** Id to place on the custom description so the dialog is described by `aria-describedby`. */
    descriptionId: string
  }
}

/** Props for the AlertDialog host component. */
export type AlertDialogProps = AlertDialogT.Props
