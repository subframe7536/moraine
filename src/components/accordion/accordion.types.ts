import type { JSX } from '@solidjs/web'
import type { Component } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'

import type { AccordionStyleSlot, AccordionStyleVariants } from './accordion.style-types'
export namespace AccordionT {
  export type Kind = 'single'

  export type Slot<T = unknown> = AccordionStyleSlot<T>
  export type Variants = AccordionStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface ContentRenderProps {
    /** Whether the item is expanded. */
    expanded: boolean
    /** Whether the item is disabled, by its own `disabled` or the accordion's. */
    disabled: boolean
    /** The item `value`. */
    value: string
  }

  export interface Item {
    /**
     * Header label rendered inside the trigger button. When omitted and `ariaLabel` is not set,
     * the trigger's accessible name falls back to `value`.
     */
    label?: JSX.Element

    /**
     * Accessible label for the accordion trigger button.
     * Useful when `label` is omitted, icon-only, or contains non-text content.
     */
    ariaLabel?: string

    /**
     * Unique value identifying the item. It is the entry stored in the accordion's `value` array and
     * passed to `onValueChange`; duplicates trigger a development warning.
     */
    value: string

    /**
     * Whether this item's trigger is disabled. A disabled item cannot be toggled and is skipped by
     * arrow-key, `Home` and `End` navigation.
     * @default false
     */
    disabled?: boolean

    /**
     * Name of an icon rendered before the label inside the trigger.
     */
    icon?: IconT.Name

    /**
     * Panel content for the item. Accepts static JSX or a component that receives
     * `{ expanded, disabled, value }`. It is mounted while the item is open and unmounted after it
     * closes, unless `forceMount` is set on the accordion.
     */
    content?: JSX.Element | Component<ContentRenderProps>

    /**
     * Extra class applied to this item's root element, merged after the `item` slot class and
     * `classes.item`, so it wins on conflicts.
     */
    class?: SlotClassValue
  }
  /**
   * Base props for the Accordion component.
   */
  export interface Base {
    /**
     * Id of the root element. Also used as the prefix of the generated trigger and content ids that
     * link each trigger to its panel through `aria-controls` and `aria-labelledby`. A unique id is
     * generated when omitted.
     */
    id?: string

    /**
     * Controlled list of expanded item values. Always an array, even when `multiple` is `false`.
     * Leave it `undefined` for uncontrolled usage; when set, update it from `onValueChange`.
     */
    value?: string[]

    /**
     * Item values expanded on first render when `value` is not provided. Read once at creation.
     * @default []
     */
    defaultValue?: string[]

    /**
     * Whether several items can be expanded at once. When `false`, opening an item replaces the
     * current `value` with just that item, which closes the others.
     * @default false
     */
    multiple?: boolean

    /**
     * Whether the expanded item can be closed by activating its trigger again. Only applies when
     * `multiple` is `false`; with `multiple`, every item can always be collapsed.
     * @default true
     */
    collapsible?: boolean

    /**
     * Called when a user toggles an item (trigger click, `Enter`, `Space`, or browser find-in-page
     * revealing hidden content). Receives the complete next array of expanded values, in both
     * controlled and uncontrolled mode. It is not called for changes you make to `value`.
     * @example
     * ```tsx
     * import { Accordion } from 'moraine'
     *
     * <Accordion
     *   multiple
     *   items={[
     *     { value: 'a', label: 'A', content: 'First' },
     *     { value: 'b', label: 'B', content: 'Second' },
     *   ]}
     *   onValueChange={(value) => console.log(value)}
     * />
     * ```
     */
    onValueChange?: (value: string[]) => void

    /**
     * Whether `ArrowDown` and `ArrowUp` focus wraps from the last enabled trigger to the first and
     * vice versa. `Home` and `End` always jump to the first and last enabled trigger.
     * @default true
     */
    loop?: boolean

    /**
     * Items to render, in order. Each item needs a unique `value`; `label`, `icon`, `content`,
     * `disabled`, `ariaLabel` and `class` are optional.
     * @example
     * ```tsx
     * import { Accordion } from 'moraine'
     *
     * <Accordion
     *   defaultValue={['intro']}
     *   items={[
     *     { value: 'intro', label: 'Intro', icon: 'icon-info', content: 'Getting started.' },
     *     { value: 'faq', label: 'FAQ', content: (state) => (state.expanded ? 'Open' : 'Closed') },
     *     { value: 'beta', label: 'Beta', disabled: true },
     *   ]}
     * />
     * ```
     */
    items?: Item[]

    /**
     * Whether every item is disabled, regardless of each item's own `disabled`. No trigger can be
     * toggled or reached with arrow keys.
     * @default false
     */
    disabled?: boolean

    /**
     * Whether to animate the content height when items expand or collapse. Respects
     * `prefers-reduced-motion`.
     * @default true
     */
    transition?: boolean
    /**
     * Whether closed content stays mounted. When `false`, an item's content mounts each time it
     * opens and unmounts once it has closed (after the exit transition); when `true`, it mounts
     * before the first open and stays mounted while hidden. The content panel element itself is
     * always rendered.
     * @default false
     */
    forceMount?: boolean

    /**
     * Name of the icon rendered after the label in every item's trigger, typically an expand
     * indicator.
     * @default 'icon-chevron-down'
     */
    expandIcon?: IconT.Name

    /**
     * Heading level (1 to 6) of the element that wraps each trigger, rendered as `<h1>` to `<h6>`.
     * Pick the level that fits the surrounding document outline.
     * @default 3
     */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  }

  /**
   * Props for the Accordion component.
   */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/**
 * Props for the Accordion component.
 */
export type AccordionProps = AccordionT.Props
