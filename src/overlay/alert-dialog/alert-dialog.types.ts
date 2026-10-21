import type { Component, JSX } from 'solid-js'

import type { IconT } from '../../element/icon'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type {
  FeedbackAction,
  FeedbackCloseReason,
  FeedbackHandle,
  FeedbackId,
  FeedbackPending,
} from '../base/feedback/feedback.types'

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
     * Unique identifier for this host when multiple hosts are mounted.
     * A call without `host` goes to the last mounted host without an id. Pass `host` in the
     * call options to target one host. If duplicate ids are mounted, the last mounted host takes precedence.
     * Unmounting a host settles its open dialogs with reason `api`.
     */
    id?: string

    /**
     * Renders the inner content of every dialog on this host that was not opened with
     * `AlertDialog.custom`. Receives the instance context and the resolved call options.
     */
    dialogRender?: Component<DialogRenderProps>

    /**
     * Whether the corner close button is shown.
     * @default false
     */
    close?: boolean

    /**
     * Whether Escape dismisses the dialog.
     * @default true
     */
    closeOnEscape?: boolean

    /**
     * Whether an outside pointer press on the overlay dismisses the dialog.
     * @default false
     */
    closeOnOverlayClick?: boolean

    /**
     * Status tone. `default` has no icon unless `danger` is set.
     * @default 'default'
     */
    type?: Type

    /** Sets the dialog content `max-width`. */
    width?: string | number
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
    /** Targets `<AlertDialog id="..." />`. Omit to use the host without an id. */
    host?: string
    /** Status tone. Methods such as `info` set this for you. */
    type?: Type
    title?: JSX.Element
    description?: JSX.Element
    /** Replaces the type icon. `null` omits the icon. */
    icon?: IconT.Name
    /** Primary action. A returned promise shows loading and disables the other action. */
    action?: Action
    /**
     * Cancel action. `true` uses the locale label. `confirm` shows it when this is omitted;
     * other methods hide it.
     */
    cancel?: Action | boolean
    /** Whether the corner close button is shown. */
    close?: boolean
    /** Called once when the dialog closes. */
    onClose?: (reason: CloseReason) => void
    class?: SlotClassValue
    style?: SlotStyleValue
    classes?: Classes
    styles?: Styles
    danger?: Variants['danger'] | null
    center?: Variants['center'] | null
    subtle?: Variants['subtle'] | null
    width?: string | number
    closeOnEscape?: boolean
    closeOnOverlayClick?: boolean
    /** Accessible name used when `title` is absent. */
    ariaLabel?: string
  }

  /** Selects dialogs for `AlertDialog.close`. Omitted fields match every dialog. */
  export interface CloseTarget {
    /** Closes only the dialog with this id. */
    id?: Id
    /** Closes only dialogs on `<AlertDialog id="..." />`. */
    host?: string
  }

  /** Options for updating an open alert dialog in place. */
  export type UpdateOptions = Partial<Omit<Options, 'host' | 'id'>>

  export interface Handle extends FeedbackHandle<UpdateOptions> {}

  /** Props for `AlertDialog.custom` and `dialogRender`. */
  export interface RenderProps {
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

  export type DialogRenderProps = RenderProps
}

/** Props for the AlertDialog host component. */
export type AlertDialogProps = AlertDialogT.Props
