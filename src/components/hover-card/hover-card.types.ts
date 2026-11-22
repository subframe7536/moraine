import type { Accessor, JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { PopperContentOptions, PopperProps } from '../shared/overlay/popper.types'
import type { OverlayTriggerBase } from '../shared/overlay/trigger'

import type { HoverCardStyleSlot, HoverCardStyleVariants } from './hover-card.style-types'

export namespace HoverCardT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = HoverCardStyleSlot<T>

  export type Variants = HoverCardStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * Base props for the HoverCard component.
   */
  export interface Base extends Pick<
    PopperProps & PopperContentOptions,
    | 'id'
    | 'open'
    | 'defaultOpen'
    | 'onOpenChange'
    | 'onExitComplete'
    | 'mount'
    | 'disabled'
    | 'placement'
    | 'align'
    | 'shift'
    | 'flip'
    | 'slide'
    | 'forceMount'
  > {
    /**
     * Gap in pixels between the trigger and the content.
     * @default 4
     */
    gutter?: number

    /**
     * Minimum padding in pixels between the content and the viewport edge.
     * @default 4
     */
    overflowPadding?: number

    /**
     * Delay in milliseconds between a mouse pointer entering the trigger and opening. Keyboard
     * focus on the trigger also opens it after this delay, but only for focus-visible (keyboard)
     * focus. Touch hover is ignored.
     * @default 600
     */
    openDelay?: number

    /**
     * Delay in milliseconds between the pointer leaving the trigger and content, or the trigger
     * losing focus, and closing. Moving onto the content within the delay keeps the card open.
     * @default 300
     */
    closeDelay?: number

    /** Composed trigger and content primitives. */
    children?: JSX.Element
  }
  export type Props = BaseProps<never, Base, Variants, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'a'> = OverlayTriggerBase<T> & {
    /**
     * Identifies this trigger when several triggers share one card. `HoverCard.Content` receives
     * the `value` of the trigger that most recently anchored the card through its function
     * children.
     */
    value?: string
  }
  export type TriggerProps<T extends ValidComponent = 'a'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never,
    'a'
  >

  /** Render context passed to `Content` function children. */
  export interface ContentContext {
    /** `value` of the trigger that opened or most recently anchored the card. */
    value: Accessor<string | undefined>
  }

  export interface ContentBase {
    /**
     * Card content shown while the card is open. A function receives `{ value }`, an accessor for
     * the `value` of the `HoverCard.Trigger` that anchored the card (`undefined` when that trigger
     * has no `value`).
     * @example
     * ```tsx
     * import { HoverCard } from 'moraine'
     *
     * <HoverCard>
     *   <HoverCard.Trigger href="/u/alex" value="alex">@alex</HoverCard.Trigger>
     *   <HoverCard.Trigger href="/u/sam" value="sam">@sam</HoverCard.Trigger>
     *   <HoverCard.Content>{({ value }) => <span>Profile of {value()}</span>}</HoverCard.Content>
     * </HoverCard>
     * ```
     */
    children?: JSX.Element | ((context: ContentContext) => JSX.Element)
  }

  /**
   * Props for the HoverCard component.
   */
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never>
}

/**
 * Props for the HoverCard component.
 */
export type HoverCardProps = HoverCardT.Props
