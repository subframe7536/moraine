import type { JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'

import type { AlertStyleSlot, AlertStyleVariants } from './alert.style-types'

export namespace AlertT {
  export type Kind = 'single'
  export type Slot<T = unknown> = AlertStyleSlot<T>
  export type Variants = AlertStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Type = NonNullable<Variants['type']>

  export interface Base<T extends ValidComponent = 'div'> {
    /**
     * Element or component to render as.
     * @default 'div'
     */
    as?: T

    /** Primary alert title or message. */
    title?: JSX.Element

    /** Supporting detailed description. */
    description?: JSX.Element

    /** Action elements or controls displayed alongside the alert. */
    actions?: JSX.Element

    /**
     * Leading icon displayed in the alert.
     * - `undefined` (default): automatically resolves to semantic icon for status types, or none for `primary` / `secondary`.
     * - `false` or `null`: hides the icon.
     * - `IconT.Name`: displays specified icon shortcut (e.g. `'icon-tip'`) or custom JSX element.
     */
    icon?: IconT.Name

    /**
     * Whether to show a dismiss button.
     * @default false
     */
    closable?: boolean

    /**
     * Custom icon name or element for the close button.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name

    /** Controlled open state. */
    open?: boolean

    /**
     * Uncontrolled default open state.
     * @default true
     */
    defaultOpen?: boolean

    /** Callback when open state changes. */
    onOpenChange?: (open: boolean) => void

    /** Callback fired when exit animation has fully settled and element is unmounted. */
    onExitComplete?: () => void

    /** Direct children content. Rendered within the alert content area. */
    children?: JSX.Element
  }

  /** Props for Alert. */
  export type Props<T extends ValidComponent = 'div'> = BaseProps<
    T,
    Base<T>,
    Variants,
    Classes,
    Styles,
    'div'
  >
}

/** Props for Alert. */
export type AlertProps = AlertT.Props
