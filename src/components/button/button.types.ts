import type { JSX } from '@solidjs/web'
import type { Component } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'

import type { ButtonStyleSlot, ButtonStyleVariants } from './button.style-types'
export namespace ButtonT {
  export type Kind = 'single'

  export type Slot<T = unknown> = ButtonStyleSlot<T>
  export type Variants = ButtonStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface ChildrenRenderProps {
    /**
     * Whether the button is currently in loading state.
     */
    loading: boolean
  }

  /**
   * Base props for the Button component.
   */
  export type Base<T extends ValidComponent = 'button'> = {
    /**
     * Element or component to render as.
     * @default 'button'
     */
    as?: T

    /**
     * Disables the button, including non-button roots set with `as` (those get `aria-disabled`
     * and are removed from the tab order). Clicks and Enter/Space activation are ignored while
     * disabled.
     */
    disabled?: boolean

    /**
     * Shows the loading indicator. While loading the button sets `aria-busy`, ignores clicks and
     * keyboard activation, and stays focusable. Combine with `autoLoading` to also show loading
     * while an async click handler is pending.
     * @default false
     */
    loading?: boolean

    /**
     * Shows loading automatically from the `onClick` handler: when it returns a promise (for example
     * an `async` function), the button is loading until the promise settles, whether it resolves or
     * rejects. A handler that calls `event.preventDefault()` does not trigger loading.
     * @default false
     */
    autoLoading?: boolean

    /**
     * Name of the icon shown while loading. It replaces the `leading` icon, or the `trailing` icon
     * when only `trailing` is set; with no icons it is added before the label.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Name of an icon rendered before the label. Replaced by the loading icon while loading.
     */
    leading?: IconT.Name

    /**
     * Name of an icon rendered after the label. It is replaced by the loading icon only when no
     * `leading` icon is set.
     */
    trailing?: IconT.Name

    /**
     * Label content, or a render function receiving `{ loading }`.
     * A render function must declare its parameter, even when unused. A zero-argument
     * function is called as an accessor and is not mounted as a component. Empty content renders no
     * label element, which suits icon-only buttons (add an `aria-label`).
     * @example
     * ```tsx
     * import { Button } from 'moraine'
     *
     * <Button autoLoading onClick={() => fetch('/api/save')}>
     *   {(state) => (state.loading ? 'Saving...' : 'Save')}
     * </Button>
     * ```
     */
    children?: JSX.Element | Component<ChildrenRenderProps>
  }

  /**
   * Props for the Button component.
   */
  export type Props<T extends ValidComponent = 'button'> = BaseProps<
    T,
    Base<T>,
    Variants,
    Classes,
    Styles,
    'button'
  >
}

/**
 * Props for the Button component.
 */
export type ButtonProps<T extends ValidComponent = 'button'> = ButtonT.Props<T>
