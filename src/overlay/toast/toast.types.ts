import type { JSX } from 'solid-js'

import type { ButtonT } from '../../element/button'
import type { IconT } from '../../element/icon'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { ToastStore } from './toast-store'
import type { ToastStyleSlot, ToastStyleVariant } from './toast.style-types'

export const DEFAULT_TOAST_DURATION = 4000
export const DEFAULT_TOAST_GAP = 14

export interface ToastItemRecord extends ToastT.InitOptions {
  id: string | number
  closed?: boolean
  isBumping?: boolean
  role?: 'status' | 'alert'
  jsx?: JSX.Element | ((id: string | number) => JSX.Element)
}

export namespace ToastT {
  export type Kind = 'single'

  export type Slot<T = unknown> = ToastStyleSlot<T>
  export type Variant = ToastStyleVariant
  export type Variants = ToastStyleVariant
  export type Placement = NonNullable<ToastStyleVariant['placement']>

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** Context provided to a custom toast item renderer. */
  export interface ItemRenderProps {
    /** The toast record being rendered. */
    toast: ToastItemRecord
    /** Closes this toast notification. */
    close: () => void
    /** Position index of the toast in its stack. */
    index: number
    /** Whether the toast stack is expanded. */
    expanded: boolean
  }

  /** Action button configuration for a toast. */
  export interface Action extends ButtonT.Variant {
    /** Button label content. */
    label?: JSX.Element
    /** Custom leading icon name. */
    leading?: IconT.Name
    /** Click handler callback. */
    onClick?: (event: MouseEvent) => void
    /** Class override for the button. */
    class?: SlotClassValue
    /** Style override for the button. */
    style?: SlotStyleValue
  }

  /**
   * Custom predicate or boolean flag for preventing duplicate toasts.
   * When a function is provided, it receives the candidate toast options and the front toast,
   * returning true if the new toast should be prevented as a duplicate.
   */
  export type PreventDuplicate =
    | boolean
    | ((candidate: Partial<ToastItemRecord>, frontToast: ToastItemRecord) => boolean)

  /** Options passed to toast creation methods. */
  export interface InitOptions {
    /** Explicit identifier for updating or preventing duplicate toasts. */
    id?: string | number

    /** Primary notification title. */
    title?: JSX.Element

    /** Secondary notification description. */
    description?: JSX.Element

    /** Variant styling options (status variant, large layout, placement, align, invert). */
    variants?: Variants

    /** Custom leading icon name. */
    icon?: IconT.Name

    /** Auto-close duration in milliseconds. Pass Infinity to disable auto-close. */
    duration?: number

    /** Close button configuration or custom JSX element. Pass `true` for default button. */
    close?: Action | JSX.Element

    /** Whether to show the remaining duration progress bar. */
    showProgress?: boolean

    /** Primary call-to-action button. */
    action?: Action | JSX.Element

    /** Secondary cancel button. */
    cancel?: Action | JSX.Element

    /** Callback invoked when toast closes. `auto` is true if triggered by duration timer. */
    onClose?: (id: string | number, auto: boolean) => void

    /** Class overrides for toast slots. */
    classes?: Classes

    /** Style overrides for toast slots. */
    styles?: Styles

    /** Custom class for toast item. */
    class?: SlotClassValue

    /** Custom style for toast item. */
    style?: SlotStyleValue

    /** Target Toast host `id` for scoped instances. */
    toastId?: string

    /** Prevent duplicate toasts with matching content. */
    preventDuplicate?: PreventDuplicate
  }

  /** Options for updating an existing toast in place. */
  export interface UpdateOptions extends Partial<Omit<InitOptions, 'id'>> {}

  /** Options for binding toast lifecycles to an asynchronous promise. */
  export interface PromiseOptions<T = unknown> extends Omit<InitOptions, 'title' | 'description'> {
    /** Message shown while the promise is pending. */
    loading?: JSX.Element
    /** Message shown when the promise resolves. */
    success?: JSX.Element | ((data: T) => JSX.Element)
    /** Message shown when the promise rejects. */
    error?: JSX.Element | ((error: unknown) => JSX.Element)
    /** Secondary description rendered during or after resolution. */
    description?: JSX.Element | ((data: unknown) => JSX.Element)
    /** Optional callback executed after promise settlement. */
    finally?: () => void | Promise<void>
  }

  /** Result returned from Toast.promise, exposing unwrap helper. */
  export type PromiseReturn<T = unknown> = (string | number) & {
    /** Unwrap the underlying promise result. */
    unwrap: () => Promise<T>
  }

  /** Base props for the Toast host component. */
  export interface Base {
    /**
     * Custom renderer for individual toast items.
     */
    itemRender?: (props: ItemRenderProps) => JSX.Element

    /**
     * Max number of simultaneously visible toasts in a stack.
     * @default 3
     */
    visibleToasts?: number

    /**
     * Default duration before auto-close in milliseconds.
     * @default 4000
     */
    duration?: number

    /**
     * Close button configuration or custom JSX element. When truthy, enables closing.
     * @default false
     */
    close?: Action | JSX.Element

    /**
     * Whether to show the remaining duration progress bar.
     * @default false
     */
    showProgress?: boolean

    /**
     * Whether to expand the stacked toast list by default.
     * @default false
     */
    expand?: boolean

    /**
     * Prevent duplicate toasts with matching content.
     * Can be a boolean or a custom predicate comparing candidate against the front toast.
     * @default false
     */
    preventDuplicate?: PreventDuplicate

    /**
     * Match toasts targeting a specific Toast host identifier.
     */
    id?: string

    /**
     * Isolated store rendered by this host. Defaults to the shared `Toast.*` store.
     */
    store?: ToastStore

    /**
     * Gap between toasts in pixels when expanded.
     * @default 14
     */
    gap?: number
  }

  /** Props for the Toast host component. */
  export type Props = BaseProps<'section', Base, Variant, Classes, Styles, 'section'>
}

/** Props for the Toast host component. */
export type ToastProps = ToastT.Props
