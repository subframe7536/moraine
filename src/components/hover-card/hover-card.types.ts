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
    | 'disabled'
    | 'placement'
    | 'align'
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
     * Delay in milliseconds before opening on hover or keyboard focus.
     * @default 600
     */
    openDelay?: number

    /**
     * Delay in milliseconds before closing after leaving the trigger or content.
     * @default 300
     */
    closeDelay?: number

    /** Composed trigger and content primitives. */
    children?: JSX.Element
  }
  export type Props = BaseProps<never, Base, Variants, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'a'> = OverlayTriggerBase<T> & {
    /**
     * Identifies this trigger when several triggers share one card. The content
     * reads it from its render context.
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
    /** Card content shown on hover or keyboard focus. */
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
