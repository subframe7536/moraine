import type { JSX } from 'solid-js'

import type { ButtonT } from '../../element/button'
import type { IconT } from '../../element/icon'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { AlertDialogStyleSlot, AlertDialogStyleVariant } from './alert-dialog.style-types'

export namespace AlertDialogT {
  export type Kind = 'single'

  export type Slot<T = unknown> = AlertDialogStyleSlot<T>

  export type Variant = AlertDialogStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Type = 'confirm' | 'info' | 'warning' | 'error' | 'success'

  /** Defaults applied to every alert dialog opened while this host is mounted. */
  export interface Base {
    /** Shows the cancel action. Defaults to true for `confirm` and false otherwise. */
    cancel?: boolean
    cancelText?: JSX.Element
    cancelVariant?: ButtonT.Variant['variant']
    /** Class applied to the dialog content. */
    class?: string
    /** Slot class defaults for this alert dialog. */
    classes?: Classes
    /**
     * Whether Escape dismisses the dialog.
     * @default true
     */
    closeOnEscape?: boolean
    /**
     * Whether the corner close button is shown.
     * @default false
     */
    closable?: boolean
    /**
     * Centers the icon, title, and description, and stretches the actions into an equal row.
     * @default false
     */
    center?: boolean | null
    /**
     * Styles the OK action as `destructive` when `okVariant` is omitted.
     * @default false
     */
    danger?: boolean | null
    /** Replaces the type icon. `null` omits the icon. */
    icon?: IconT.Name | null
    /**
     * Whether an outside pointer press on the overlay dismisses the dialog.
     * @default false
     */
    overlayDismissable?: boolean
    okText?: JSX.Element
    /**
     * Visual treatment of the OK action.
     * @default 'default'
     */
    okVariant?: ButtonT.Variant['variant']
    /** Style applied to the dialog content. */
    style?: JSX.CSSProperties
    /** Slot style defaults for this alert dialog. */
    styles?: Styles
    /**
     * Gives the footer a top border and muted background, like Card's `subtle` variant.
     * @default false
     */
    subtle?: boolean | null
    /** Sets the dialog content `max-width`. */
    width?: string | number
  }

  export type Props = Base

  export type Config = Base

  export interface Options extends Config {
    /** Accessible name used when `title` is absent. */
    ariaLabel?: string
    description?: JSX.Element
    /** Called before the dialog closes from a cancel or dismiss gesture. A rejection leaves it open. */
    onCancel?: () => void | Promise<unknown>
    /** Called before the dialog closes from the OK action. A rejection leaves it open. */
    onOk?: () => void | Promise<unknown>
    title?: JSX.Element
  }

  export interface Instance extends Promise<boolean> {
    /** Resolves `false` and plays the exit transition. */
    close: () => void
    /** Resolves `false` and removes the dialog immediately. */
    destroy: () => void
    update: (options: Partial<Options>) => void
  }
}

export type AlertDialogProps = AlertDialogT.Props
