import type { JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue, OverlayPlacement } from '../../theme/style-types'
import type { KbdGroupT } from '../kbd-group/kbd-group.types'
import type { PopperContentOptions, PopperProps } from '../shared/overlay/popper.types'
import type { OverlayTriggerBase, OverlayTriggerComponentProps } from '../shared/overlay/trigger'

import type { TooltipStyleSlot, TooltipStyleVariants } from './tooltip.style-types'

export namespace TooltipT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = TooltipStyleSlot<T>

  export type Variants = TooltipStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * Base props for the Tooltip component.
   */
  export interface Base extends Pick<
    PopperProps & PopperContentOptions,
    | 'id'
    | 'open'
    | 'defaultOpen'
    | 'onOpenChange'
    | 'disabled'
    | 'align'
    | 'shift'
    | 'flip'
    | 'slide'
    | 'forceMount'
  > {
    /**
     * Preferred side of the trigger the tooltip appears on (`'top'`, `'right'`, `'bottom'` or
     * `'left'`). It may move to another side when `flip` is enabled and the side lacks space.
     * @default 'top'
     */
    placement?: OverlayPlacement

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
     * Delay in milliseconds between pointer hover or keyboard focus on the trigger and opening;
     * `0` opens immediately. The delay is skipped while another tooltip is open or within
     * `instantOpenDelay` of one closing.
     * @default 600
     */
    openDelay?: number

    /**
     * Delay in milliseconds between the pointer leaving the trigger and content and closing;
     * moving onto the content keeps the tooltip open. `0` closes immediately.
     * @default 200
     */
    closeDelay?: number

    /**
     * Duration in milliseconds after a tooltip closes during which any tooltip in the same document
     * opens without `openDelay`, so moving across a toolbar does not wait on every button. `0`
     * disables the grace period.
     * @default 300
     */
    instantOpenDelay?: number

    /** Composed trigger and content primitives. */
    children?: JSX.Element
  }
  export type Props = BaseProps<never, Base, Variants, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>

  export interface ContentBase {
    /**
     * Keys shown as keycaps after the text, for example `['command', 's']`. Names such as `meta`,
     * `ctrl`, `shift` and `command` render as symbols. This only displays the shortcut; it does not
     * register it.
     * @example
     * ```tsx
     * import { Button, Tooltip } from 'moraine'
     *
     * <Tooltip>
     *   <Tooltip.Trigger as={Button}>Search</Tooltip.Trigger>
     *   <Tooltip.Content kbds={['meta', 'k']}>Search the docs</Tooltip.Content>
     * </Tooltip>
     * ```
     */
    kbds?: string[]

    /**
     * Visual variant of the shortcut keycaps (`'default'`, `'outline'` or `'invert'`). When omitted,
     * keycaps use `'invert'` if the tooltip itself has `variant="invert"` and the default otherwise.
     */
    kbdVariant?: KbdGroupT.Variants['variant']

    /**
     * Tooltip text or element. A string is wrapped in the `text` slot; other nodes render as given.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Tooltip component.
   */
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never>
}

/**
 * Props for the Tooltip component.
 */
export type TooltipProps = TooltipT.Props
