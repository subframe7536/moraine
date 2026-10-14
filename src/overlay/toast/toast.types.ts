import type { JSX } from 'solid-js'

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

import type { ToastStyleSlot, ToastStyleVariant } from './toast.style-types'

export const DEFAULT_TOAST_DURATION = 4000
export const DEFAULT_TOAST_GAP = 14

export namespace ToastT {
  export type Kind = 'single'

  export type Slot<T = unknown> = ToastStyleSlot<T>
  export type Variant = ToastStyleVariant
  export type Variants = ToastStyleVariant
  export type Placement = NonNullable<ToastStyleVariant['placement']>

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Id = FeedbackId
  export type CloseReason = FeedbackCloseReason
  export type Type = NonNullable<ToastStyleVariant['type']>
  export type Action = FeedbackAction

  /** Options passed to toast creation methods. */
  export interface Options {
    /** Stable id used by `update` and `close`. Reusing an open id updates that toast. */
    id?: Id
    /** Targets `<Toast id="..." />`. Omit to use the host without an id. */
    host?: string
    /** Status tone. Methods such as `success` set this for you. */
    type?: Type
    title?: JSX.Element
    description?: JSX.Element
    /** Replaces the type icon. `null` omits the icon. */
    icon?: IconT.Name | null
    /** Primary action. A returned promise pauses the timer until it settles. */
    action?: Action
    /** Secondary action. `true` uses the locale label. */
    cancel?: Action | boolean
    /** Whether the corner close button is shown. */
    close?: boolean
    /** Called once when the toast closes. */
    onClose?: (reason: CloseReason) => void
    class?: SlotClassValue
    style?: SlotStyleValue
    classes?: Classes
    styles?: Styles
    /** Auto-close duration in milliseconds. `Infinity` stays open. Loading toasts do not auto-close. */
    duration?: number
    /** Whether to show the remaining duration progress bar. */
    progress?: boolean
    large?: boolean | null
    invert?: boolean | null
    placement?: Placement
    align?: Variant['align']
    /**
     * When true, a toast with the same content as the front toast in this stack is not added.
     * The existing toast is bumped and its handle is returned.
     */
    preventDuplicate?: boolean
  }

  /** Options for updating an open toast in place. */
  export type UpdateOptions = Partial<Omit<Options, 'host' | 'id'>>

  export interface Handle extends FeedbackHandle<UpdateOptions> {}

  /**
   * States for `Toast.promise`. Each value is a normal toast options object.
   * `success` and `error` may also be a function of the promise result.
   * An omitted state closes the toast.
   */
  export interface PromiseOptions<T = unknown> {
    loading?: Options
    success?: Options | ((data: T) => Options)
    error?: Options | ((error: unknown) => Options)
  }

  /** Props for `Toast.custom` and `itemRender`. */
  export interface RenderProps {
    id: Id
    /** Host defaults merged with the call options. Reflects later `update` calls. */
    options: Options
    pending: () => FeedbackPending | undefined
    /** Runs `options.action.onClick`, then closes with reason `action`. */
    action: (event?: MouseEvent) => Promise<void>
    /** Runs `options.cancel.onClick` when `cancel` is an action, then closes with reason `cancel`. */
    cancel: (event?: MouseEvent) => Promise<void>
    /** Closes the toast. The reason defaults to `dismiss`. */
    close: (reason?: CloseReason) => void
    update: (options: UpdateOptions) => void
    /** Position index of the toast in its stack. */
    index: number
    /** Whether the toast stack is expanded. */
    expanded: boolean
  }

  export type Render = (props: RenderProps) => JSX.Element

  /** Base props for the Toast host component. */
  export interface Base {
    /**
     * Renders the inner content of every toast on this host that was not opened with
     * `Toast.custom`. Receives the instance context and the resolved call options.
     */
    itemRender?: Render

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
     * Whether toasts show a close button.
     * @default false
     */
    close?: boolean

    /**
     * Whether to show the remaining duration progress bar.
     * @default false
     */
    progress?: boolean

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
     * Match toasts targeting a specific Toast host identifier.
     */
    id?: string

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
