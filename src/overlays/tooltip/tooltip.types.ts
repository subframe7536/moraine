import type { JSX } from 'solid-js'

import type { KbdGroupT } from '../../elements/kbd/kbd-group.types.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue, ValidComponent } from '../../shared/types'
import type { OverlayPlacement } from '../../theme/style/style-types.ts'
import type { PopperContentOptions, PopperProps } from '../base/popper.types'
import type { ModalT } from '../modal/modal.types'

import type { TooltipStyleSlot, TooltipStyleVariant } from './tooltip.style-types'

export namespace TooltipT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = TooltipStyleSlot<T>

  export type Variant = TooltipStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * Base props for the Tooltip component.
   */
  export interface Base extends Pick<
    PopperProps & PopperContentOptions,
    'id' | 'open' | 'defaultOpen' | 'onOpenChange' | 'disabled' | 'align' | 'forceMount'
  > {
    /**
     * Preferred content placement relative to the trigger.
     * @default 'top'
     */
    placement?: OverlayPlacement

    /**
     * Delay in milliseconds before opening on hover or focus.
     * @default 600
     */
    openDelay?: number

    /**
     * Delay in milliseconds before closing after leaving trigger or content.
     * @default 200
     */
    closeDelay?: number

    /**
     * Delay in milliseconds to skip the open delay for the next trigger after closing.
     * @default 300
     */
    instantOpenDelay?: number

    /** Composed trigger and content primitives. */
    children?: JSX.Element

    /** Family slot class defaults for this Tooltip instance. */
    classes?: Classes

    /** Family slot style defaults for this Tooltip instance. */
    styles?: Styles
  }
  export type Props = Base

  export type TriggerBase<T extends ValidComponent = 'button'> = ModalT.TriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = ModalT.TriggerProps<T>

  export type ContentClasses = Pick<Classes, 'content' | 'text' | 'kbds'>
  export type ContentStyles = Pick<Styles, 'content' | 'text' | 'kbds'>
  export interface ContentBase {
    /**
     * Primary text content or element to display.
     */
    text?: JSX.Element

    /**
     * Keyboard shortcuts to display next to the text.
     */
    kbds?: string[]

    /** Visual variant for the shortcut keycaps. Overrides the variant inferred from invert. */
    kbdVariant?: KbdGroupT.Variant['variant']

    /** Text content when text is undefined. */
    children?: JSX.Element
  }

  /**
   * Props for the Tooltip component.
   */
  export type ContentProps = BaseProps<'div', ContentBase, Variant, ContentClasses, ContentStyles>
}

/**
 * Props for the Tooltip component.
 */
export type TooltipProps = TooltipT.Props
