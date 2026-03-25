import * as KobalteButton from '@kobalte/core/button'
import type { ElementOf, PolymorphicProps } from '@kobalte/core/polymorphic'
import type { JSX, ValidComponent } from 'solid-js'
import { splitProps } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { useLoadingAutoClick } from '../../shared/use-loading-auto'

import { Icon } from './icon'
import type { IconT } from './icon'
import { iconButtonVariants, iconVariants } from './icon-button.class'
import type { IconButtonVariantProps } from './icon-button.class'

export namespace IconButtonT {
  export type Slot = 'root' | 'icon'
  export interface Variant extends IconButtonVariantProps {}
  export interface Items {}
  export type Extend<T extends ValidComponent = 'button'> = PolymorphicProps<
    T,
    KobalteButton.ButtonRootProps<ElementOf<T>>
  >
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}
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
  export type Props<T extends ValidComponent = 'button'> = BaseProps<Base, Variant, Extend<T>, Slot>
}

/**
 * Props for the IconButton component.
 */
export type IconButtonProps<T extends ValidComponent = 'button'> = IconButtonT.Props<T>

/**
 * Button with icon, without padding
 */
export function IconButton<T extends ValidComponent = 'button'>(
  props: IconButtonProps<T>,
): JSX.Element {
  const [localProps, restProps] = splitProps(props as IconButtonProps, [
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

  const { isLoading, onClick } = useLoadingAutoClick<ElementOf<T>, MouseEvent>({
    loading: () => localProps.loading,
    loadingAuto: () => localProps.loadingAuto,
    onClick: () => localProps.onClick,
  })

  return (
    <KobalteButton.Root
      data-slot="root"
      class={iconButtonVariants({ size: localProps.size }, localProps.classes?.root)}
      style={localProps.styles?.root}
      aria-busy={isLoading() || undefined}
      data-loading={isLoading() ? '' : undefined}
      disabled={isLoading() || localProps.disabled}
      onClick={onClick}
      {...restProps}
    >
      <Icon
        data-loading={isLoading() ? '' : undefined}
        name={isLoading() ? (localProps.loadingIcon ?? 'icon-loading') : localProps.name}
        class={iconVariants({ size: localProps.size }, localProps.classes?.icon)}
        style={localProps.styles?.icon}
      />
    </KobalteButton.Root>
  )
}
