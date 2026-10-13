import type { JSX } from 'solid-js'

import type { ButtonT } from '../../element/button'
import type { IconT } from '../../element/icon'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { AlertDialogStyleSlot, AlertDialogStyleVariant } from './alert-dialog.style-types'

export namespace AlertDialogT {
  export type Kind = 'single'

  export type Slot<T = unknown> = AlertDialogStyleSlot<T>
  export type Variant = AlertDialogStyleVariant
  export type Variants = AlertDialogStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Type = 'confirm' | 'info' | 'warning' | 'error' | 'success'

  /** Defaults applied to every alert dialog opened while this host is mounted. */
  export interface Base {
    /**
     * Unique identifier for this host when multiple hosts are mounted.
     * Selects this host from `AlertDialog.confirm({ id, ... })` and the other methods.
     * A call without an id uses the last mounted host. If duplicate ids are mounted,
     * the last mounted host takes precedence. Unmounting the host settles its open dialogs as `false`.
     */
    id?: string

    /** Shows the cancel action. Defaults to true for `confirm` and false otherwise. */
    cancel?: boolean
    cancelText?: JSX.Element
    cancelVariant?: ButtonT.Variant['variant']

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

    /** Replaces the type icon. `null` omits the icon. */
    icon?: IconT.Name | null

    okText?: JSX.Element
    /**
     * Visual treatment of the OK action.
     * @default 'default'
     */
    okVariant?: ButtonT.Variant['variant']

    /** Sets the dialog content `max-width`. */
    width?: string | number
  }

  /** Props for the AlertDialog host component. */
  export type Props = BaseProps<never, Base, Variant, Classes, Styles>

  /** Options passed to alert dialog creation methods. */
  export interface Options extends Props {
    /** Accessible name used when `title` is absent. */
    ariaLabel?: string
    description?: JSX.Element
    /**
     * Called before the dialog closes from a cancel or dismiss gesture.
     * A rejection or synchronous throw leaves it open.
     * A synchronous throw is reported with `console.error`.
     * A rejection is reported with `console.error` and rethrown to the action button.
     */
    onCancel?: () => void | Promise<unknown>
    /**
     * Called before the dialog closes from the OK action.
     * A rejection or synchronous throw leaves it open.
     * A synchronous throw is reported with `console.error`.
     * A rejection is reported with `console.error` and rethrown to the action button.
     */
    onOk?: () => void | Promise<unknown>
    title?: JSX.Element
  }

  /** Options alias for parity with Toast. */
  export type InitOptions = Options

  /** Options for updating an open alert dialog in place. */
  export type UpdateOptions = Partial<Options>

  export interface Instance extends Promise<boolean> {
    /** Resolves `false` and plays the exit transition. */
    close: () => void
    /** Resolves `false` and removes the dialog immediately. */
    destroy: () => void
    update: (options: UpdateOptions) => void
  }
}

/** Props for the AlertDialog host component. */
export type AlertDialogProps = AlertDialogT.Props
