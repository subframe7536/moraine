import type { JSX } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'

import type { defaultAlertMessages } from './alert.messages'
import type { AlertStyleSlot, AlertStyleVariants } from './alert.style-types'

export namespace AlertT {
  export type Kind = 'single'
  export type Slot<T = unknown> = AlertStyleSlot<T>
  export type Variants = AlertStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Tone = NonNullable<Variants['tone']>
  export type Messages = ComponentMessages<typeof defaultAlertMessages>
  export type Translations = Partial<Messages>

  export interface Base<T extends ValidComponent = 'div'> {
    /**
     * Overrides the built-in strings for this instance, merged over the provider locale. The only
     * key is `close`, the accessible label of the dismiss button (default `'Close alert'`).
     * @example
     * ```tsx
     * import { Alert } from 'moraine'
     *
     * <Alert closable title="Saved" translations={{ close: 'Dismiss' }} />
     * ```
     */
    translations?: Translations

    /**
     * Element or component to render as.
     * @default 'div'
     */
    as?: T

    /**
     * Primary title, rendered above the description (in bold when a `description` is present).
     * Nothing is rendered when empty.
     */
    title?: JSX.Element

    /**
     * Supporting text rendered under the title. Its presence switches the alert to the multi-line
     * layout (larger icon); `children` render after it.
     */
    description?: JSX.Element

    /** Buttons or links rendered in a container at the end of the alert, before the close button. */
    actions?: JSX.Element

    /**
     * Leading icon displayed in the alert.
     * - `undefined` (default): automatically resolves to the semantic icon of the `tone` (`info`,
     *   `success`, `warning`, `danger`), or none for `default`.
     * - `false` or `null`: hides the icon.
     * - `IconT.Name`: displays the specified icon shortcut (e.g. `'icon-tip'`) or custom JSX element.
     */
    icon?: IconT.Name

    /**
     * Whether to show a dismiss button at the end of the alert. Clicking it sets the open state to
     * `false`, which plays the exit animation and then removes the alert from the DOM.
     * @default false
     */
    closable?: boolean

    /**
     * Icon name shown inside the dismiss button. Only used when `closable` is `true`.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name

    /**
     * Controlled open state. Leave `undefined` for uncontrolled usage. A closed alert is removed
     * from the DOM after its exit animation, so it renders nothing.
     */
    open?: boolean

    /**
     * Uncontrolled default open state.
     * @default true
     */
    defaultOpen?: boolean

    /**
     * Called with the next open state when the user dismisses the alert through the close button.
     * It is not called when `open` is changed from outside.
     */
    onOpenChange?: (open: boolean) => void

    /**
     * Called once after the alert closed, its CSS exit animation (if any) has finished, and the
     * element has been removed from the DOM.
     */
    onExitComplete?: () => void

    /** Free-form content rendered in the content area after the title and description. */
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
