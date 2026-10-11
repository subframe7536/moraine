import type { JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type {
  OverlayAlign,
  OverlayPlacement,
  SlotClassValue,
  SlotStyleValue,
} from '../../theme/style-types'

import type { ToasterStyleSlot, ToasterStyleVariant } from './toaster.style-types'

export namespace ToasterT {
  export type Kind = 'single'

  export type Slot<T = unknown> = ToasterStyleSlot<T>
  export type Variant = NonNullable<ToasterStyleVariant['variant']>

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** Action button configuration for a toast. */
  export interface Action {
    /** Button label content. */
    label: JSX.Element
    /** Click handler callback. */
    onClick?: (event: MouseEvent) => void
    /** Class override for the button. */
    class?: SlotClassValue
    /** Style override for the button. */
    style?: SlotStyleValue
  }

  /** Complete internal and external representation of a toast notification. */
  export interface Item {
    /** Unique identifier for the toast. */
    id: string | number
    /** Primary notification title. */
    title?: JSX.Element | (() => JSX.Element)
    /** Secondary notification description. */
    description?: JSX.Element | (() => JSX.Element)
    /** Visual status variant. */
    variant?: Variant
    /** Custom leading icon. */
    icon?: JSX.Element | (() => JSX.Element)
    /** Auto-dismiss duration in milliseconds. Pass Infinity to disable auto-dismiss. */
    duration?: number
    /** Whether user interaction can dismiss the toast. Default: true. */
    dismissible?: boolean
    /** Whether to show a close button. Default: false. */
    closeButton?: boolean
    /** Accessible label for the close button. */
    closeButtonAriaLabel?: string
    /** Whether to show the remaining duration progress bar. */
    showProgress?: boolean
    /** Primary call-to-action button. */
    action?: Action | JSX.Element
    /** Secondary cancel button. */
    cancel?: Action | JSX.Element
    /** Callback invoked when the toast begins dismiss. */
    onDismiss?: (item: Item) => void
    /** Callback invoked when auto-dismiss timer expires. */
    onAutoClose?: (item: Item) => void
    /** Whether to invert toast colors. */
    invert?: boolean
    /** Viewport placement on screen. */
    placement?: OverlayPlacement
    /** Viewport alignment on screen. */
    align?: OverlayAlign
    /** Class overrides for toast slots. */
    classes?: Classes
    /** Style overrides for toast slots. */
    styles?: Styles
    /** Custom class for toast root. */
    class?: SlotClassValue
    /** Custom style for toast root. */
    style?: SlotStyleValue
    /** Custom arbitrary JSX renderer. */
    jsx?: JSX.Element | ((id: string | number) => JSX.Element)
    /** Target toaster ID for scoped toast instances. */
    toasterId?: string
    /** ARIA role for this toast. Defaults to 'alert' for error variant, 'status' otherwise. */
    role?: 'status' | 'alert'
    /** Whether the toast is currently marked for dismissal. */
    dismissed?: boolean
    /** Key bumped on duplicate toast trigger to replay attention animation. */
    bumpKey?: number
  }

  /** Options passed to toast creation methods. */
  export interface AddOptions extends Omit<Partial<Item>, 'id' | 'dismissed' | 'bumpKey'> {
    /** Explicit identifier for updating or preventing duplicate toasts. */
    id?: string | number
    /** Prevent creating duplicate toasts with matching content. */
    preventDuplicate?: boolean
  }

  /** Options for binding toast lifecycles to an asynchronous promise. */
  export interface PromiseOptions<T = unknown> extends Omit<AddOptions, 'title' | 'description'> {
    /** Message shown while the promise is pending. */
    loading?: JSX.Element | (() => JSX.Element)
    /** Message shown when the promise resolves. */
    success?: JSX.Element | ((data: T) => JSX.Element)
    /** Message shown when the promise rejects. */
    error?: JSX.Element | ((error: unknown) => JSX.Element)
    /** Secondary description rendered during or after resolution. */
    description?: JSX.Element | ((data: any) => JSX.Element)
    /** Optional callback executed after promise settlement. */
    finally?: () => void | Promise<void>
  }

  /** Result returned from toast.promise, exposing unwrap helper. */
  export type PromiseReturn<T = unknown> = (string | number) & {
    /** Unwrap the underlying promise result. */
    unwrap: () => Promise<T>
  }

  /** Base props for the Toaster container component. */
  export interface Base {
    /**
     * Viewport placement on the screen.
     * @default 'bottom'
     */
    placement?: OverlayPlacement

    /**
     * Viewport alignment relative to the placement side.
     * @default 'end'
     */
    align?: OverlayAlign

    /**
     * Max number of simultaneously visible toasts in a stack.
     * @default 3
     */
    visibleToasts?: number

    /**
     * Default duration before auto-dismissal in milliseconds.
     * @default 4000
     */
    duration?: number

    /**
     * Whether to show a close button on toasts by default.
     * @default false
     */
    closeButton?: boolean

    /**
     * Accessible label for the close button.
     * @default 'Close notification'
     */
    closeButtonAriaLabel?: string

    /**
     * Whether to show the remaining duration progress bar.
     * @default false
     */
    showProgress?: boolean

    /**
     * Keyboard shortcuts to focus the notification region.
     * @default ['F6']
     */
    hotkey?: string[]

    /**
     * Whether to expand the stacked toast list by default.
     * @default false
     */
    expand?: boolean

    /**
     * Prevent duplicate toasts with matching content.
     * @default false
     */
    preventDuplicate?: boolean

    /**
     * Invert toast colors.
     * @default false
     */
    invert?: boolean

    /**
     * Match toasts targeting a specific toaster identifier.
     */
    id?: string

    /**
     * Gap between toasts in pixels when expanded.
     * @default 14
     */
    gap?: number

    /**
     * Accessible label for the notification region.
     * @default 'Notifications (F6)'
     */
    regionAriaLabel?: string

    /**
     * Class overrides for component slots.
     */
    classes?: Classes

    /**
     * Style overrides for component slots.
     */
    styles?: Styles
  }

  /** Props for the Toaster component. */
  export type Props = BaseProps<'section', Base, never, Classes, Styles, 'section'>
}

/** Props for the Toaster component. */
export type ToasterProps = ToasterT.Props
