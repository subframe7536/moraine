import type { JSX } from 'solid-js'

import type {
  BaseProps,
  TriggerBase as SharedTriggerBase,
  ValidComponent,
} from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { CollapsibleStyleSlot, CollapsibleStyleVariants } from './collapsible.style-types'

export namespace CollapsibleT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = CollapsibleStyleSlot<T>
  export type Variants = CollapsibleStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  /**
   * Base props for the Collapsible component.
   */
  export interface Base {
    /**
     * Unique identifier for the collapsible root element. The trigger and content derive their
     * IDs from it (`{id}-trigger`, `{id}-content`) for `aria-controls` and `aria-labelledby`. A
     * unique ID is generated when omitted.
     */
    id?: string

    /**
     * Whether the collapsible is open (controlled). Leave it `undefined` for uncontrolled state
     * and update it from `onOpenChange`.
     */
    open?: boolean

    /**
     * Whether the collapsible is open initially when uncontrolled.
     * @default false
     */
    defaultOpen?: boolean

    /**
     * Called with the next open state when the user toggles the collapsible with the trigger, or
     * when in-page search reveals `forceMount`ed content. It is not called while `disabled`, nor
     * when `open` changes from outside. When `open` is controlled, the state only changes if you
     * update `open`.
     */
    onOpenChange?: (open: boolean) => void

    /**
     * Whether the collapsible is disabled: its triggers cannot toggle it and `onOpenChange` is not
     * called. The current open state is kept.
     * @default false
     */
    disabled?: boolean

    /**
     * Whether to animate the content height when opening and closing. The content is measured in
     * pixels and exposed as the `--mo-collapsible-content-height` CSS variable on the root, and
     * on close it stays mounted until the animation ends. Animations are skipped with
     * `prefers-reduced-motion`.
     * @default false
     */
    transition?: boolean

    /**
     * Whether closed content stays mounted. When `false`, content mounts on first open and
     * unmounts once it closes; when `true`, content mounts even before the first open and stays
     * hidden (and `inert`) while closed. Mounted closed content can be found by browser
     * in-page search, which opens the collapsible.
     * @default false
     */
    forceMount?: boolean

    /**
     * Content to render inside the collapsible.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Collapsible component.
   */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>

  export type TriggerBase<T extends ValidComponent = 'button'> = SharedTriggerBase<T>

  export type TriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never,
    'button'
  >

  export interface ContentBase<T extends ValidComponent = 'div'> {
    /**
     * Element or component to render inner content as.
     * @default 'div'
     */
    as?: T

    /** Content to render. */
    children?: JSX.Element
  }

  export type ContentProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    ContentBase<T>,
    never,
    never,
    never,
    'div'
  >
}

/**
 * Props for the Collapsible component.
 */
export type CollapsibleProps = CollapsibleT.Props
