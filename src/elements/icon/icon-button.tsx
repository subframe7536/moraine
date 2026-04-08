import * as KobalteButton from '@kobalte/core/button'
import type { ElementOf, PolymorphicProps } from '@kobalte/core/polymorphic'
import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { useLoadingAutoClick } from '../../shared/use-loading-auto'

import { Icon } from './icon'
import type { IconT } from './icon'
import { iconButtonVariants, iconVariants } from './icon-button.class'
import type { IconButtonVariantProps } from './icon-button.class'

export namespace IconButtonT {
  export type Slot = 'root' | 'icon'
  export type Variant = IconButtonVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = Omit<
    PolymorphicProps<'button', KobalteButton.ButtonRootProps<ElementOf<'button'>>>,
    'as'
  >

  export interface Items {}
  /**
   * Base props for the IconButton component.
   */
  export interface Base {
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
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
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

  const { isLoading, onClick } = useLoadingAutoClick<ElementOf<'button'>, MouseEvent>({
    loading: () => local.loading,
    loadingAuto: () => local.loadingAuto,
    onClick: () => local.onClick,
  })

  return (
    <KobalteButton.Root
      data-slot="root"
      class={iconButtonVariants({ size: local.size }, local.classes?.root)}
      style={local.styles?.root}
      aria-busy={isLoading() || undefined}
      data-loading={isLoading() ? '' : undefined}
      disabled={isLoading() || local.disabled}
      onClick={onClick}
      {...rest}
    >
      <Icon
        data-loading={isLoading() ? '' : undefined}
        name={isLoading() ? (local.loadingIcon ?? 'icon-loading') : local.name}
        class={iconVariants({ size: local.size }, local.classes?.icon)}
        style={local.styles?.icon}
      />
    </KobalteButton.Root>
  )
}
