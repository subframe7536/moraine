import type { ComponentProps, JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useLoadingAutoClick } from '../../shared/use-loading-auto'
import { cn } from '../../shared/utils'

import type { IconT } from './icon'
import { IconButtonInner } from './icon-button-inner'
import type { IconButtonVariantProps } from './icon-button.class'

export namespace IconButtonT {
  export interface Slot<T = unknown> {
    /**
     * Icon-only button element that owns loading, disabled, and interaction state.
     */
    root?: T

    /** Icon glyph rendered inside the button, including the loading icon when active. */
    icon?: T
  }
  export type Variant = IconButtonVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}
  /**
   * Base props for the IconButton component.
   */
  export interface Base extends Omit<
    ComponentProps<'button'>,
    'children' | 'class' | 'style' | 'classes' | 'styles' | 'name' | 'size'
  > {
    /**
     * Icon source. Strings should be Uno icon classes such as `i-lucide-search`.
     */
    name: IconT.Name

    /**
     * Controlled loading state.
     * @default false
     */
    loading?: boolean

    /**
     * Optional icon shown when `loading` is active.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Auto toggles loading while async click handlers are pending.
     * @default false
     */
    loadingAuto?: boolean
  }

  /**
   * Props for the IconButton component.
   */
  export interface Props extends BaseProps<Base, Variant, never, Classes, Styles> {}
}

/**
 * Props for the IconButton component.
 */
export interface IconButtonProps extends IconButtonT.Props {}

/**
 * Button with icon, without padding
 */
export function IconButton(props: IconButtonProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'class',
    'style',
    'classes',
    'styles',
    'name',
    'loading',
    'loadingAuto',
    'loadingIcon',
    'disabled',
    'size',
    'onClick',
  ])

  const { isLoading, onClick } = useLoadingAutoClick<HTMLButtonElement, MouseEvent>({
    loading: () => local.loading,
    loadingAuto: () => local.loadingAuto,
    onClick: () => local.onClick,
  })

  return (
    <IconButtonInner
      {...rest}
      name={isLoading() ? (local.loadingIcon ?? 'icon-loading') : local.name}
      size={local.size}
      class={local.class}
      classes={{
        root: local.classes?.root,
        icon: cn(isLoading() && 'effect-loading', local.classes?.icon),
      }}
      style={local.style}
      styles={local.styles}
      aria-busy={isLoading() || undefined}
      data-loading={isLoading() ? '' : undefined}
      disabled={isLoading() || local.disabled}
      onClick={onClick}
      aria-label={isLoading() ? 'Loading' : rest['aria-label']}
    />
  )
}
