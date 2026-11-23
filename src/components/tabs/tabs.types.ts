import type { JSX } from '@solidjs/web'
import type { Component } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon/icon.types'

import type { TabsStyleSlot, TabsStyleVariants } from './tabs.style-types'
export namespace TabsT {
  export type Kind = 'single'

  export type Slot<T = unknown> = TabsStyleSlot<T>

  export type Variants = TabsStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface ContentRenderProps {
    /** `value` of the active tab. */
    value: string
  }

  /**
   * An individual tab in the tabs component.
   */
  export interface Item {
    /**
     * Label to display on the tab trigger. It is also the tab's accessible name unless `ariaLabel`
     * is set, so give icon-only tabs an `ariaLabel`.
     */
    label?: JSX.Element

    /**
     * Accessible name of the tab trigger, set as its `aria-label`. It replaces the name computed
     * from `label` and also names the tab panel, which is labelled by the trigger. Use it for
     * icon-only tabs.
     */
    ariaLabel?: string

    /**
     * Icon to display before the label.
     */
    icon?: IconT.Name

    /**
     * Unique value identifying the tab in `value` and `onValueChange`. A tab that repeats an earlier
     * tab's value is disabled.
     */
    value: string

    /**
     * Content of the tab panel. Only the active tab's panel is mounted; switching tabs unmounts the
     * previous one. Accepts static JSX or a component receiving `{ value }`, which defers building the panel until it is shown.
     * @example
     * ```tsx
     * import { Tabs } from 'moraine'
     *
     * <Tabs
     *   items={[
     *     { value: 'overview', label: 'Overview', content: () => <p>Summary</p> },
     *     { value: 'logs', label: 'Logs', content: (props) => <p>Panel for {props.value}</p> },
     *   ]}
     * />
     * ```
     */
    content?: JSX.Element | Component<ContentRenderProps>

    /**
     * Whether the tab is disabled: it cannot be selected and is skipped by arrow-key navigation.
     * @default false
     */
    disabled?: boolean
  }

  /**
   * Base props for the Tabs component.
   */
  export interface Base {
    /**
     * DOM `id` of the tabs root element; the trigger and panel ids derive from it. Generated when omitted.
     */
    id?: string

    /**
     * Controlled active tab value. When `undefined`, or when it matches no enabled tab, the first enabled tab is active.
     */
    value?: string

    /**
     * Initially active tab value for uncontrolled usage. The first enabled tab is active when omitted.
     */
    defaultValue?: string

    /**
     * Whether arrow-key focus movement activates the tab immediately (`automatic`) or only moves
     * focus until `Enter` or `Space` confirms it (`manual`).
     * @default 'automatic'
     */
    activationMode?: 'automatic' | 'manual'

    /**
     * Whether the whole tab list is disabled: no tab can be selected by click or keyboard.
     * @default false
     */
    disabled?: boolean

    /**
     * Whether arrow-key navigation wraps from the last tab to the first and back. Disabled tabs are skipped.
     * @default true
     */
    loop?: boolean

    /**
     * Called with the tab's `value` when the user selects a different tab by click or keyboard.
     * It does not fire for programmatic `value` changes, for the already-active tab, or while the
     * tabs are `disabled`.
     */
    onValueChange?: (value: string) => void

    /**
     * Array of tabs to display, in order.
     * @example
     * ```tsx
     * import { Tabs } from 'moraine'
     *
     * <Tabs
     *   defaultValue="code"
     *   items={[
     *     { value: 'code', label: 'Code', icon: 'icon-code' },
     *     { value: 'preview', label: 'Preview' },
     *     { value: 'history', label: 'History', disabled: true },
     *   ]}
     * />
     * ```
     */
    items?: Item[]
  }

  /**
   * Props for the Tabs component.
   */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/**
 * Props for the Tabs component.
 */
export type TabsProps = TabsT.Props
