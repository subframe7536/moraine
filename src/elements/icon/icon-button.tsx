import * as KobalteButton from '@kobalte/core/button'
import type { ElementOf, PolymorphicProps } from '@kobalte/core/polymorphic'
import type { JSX, ValidComponent } from 'solid-js'
import { splitProps } from 'solid-js'

import type { RockUIProps, SlotClasses, SlotStyles } from '../../shared/types'

import { Icon } from './icon'
import type { IconName } from './icon'
import { iconButtonVariants } from './icon-button.class'

export namespace IconButtonT {
  export type Slot = 'root'
  export interface Variant {}
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
    name: IconName

    /**
     * Controlled loading state.
     * @default false
     */
    loading?: boolean

    /**
     * Optional icon shown when `loading` is active.
     * @default 'icon-loading'
     */
    loadingIcon?: IconName

    /**
     * The size of the button.
     * @default 'md'
     */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }

  /**
   * Props for the IconButton component.
   */
  export type Props<T extends ValidComponent = 'button'> = RockUIProps<
    Base,
    Variant,
    Extend<T>,
    Slot
  >
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
    'name',
    'loading',
    'loadingIcon',
    'disabled',
    'size',
  ])

  return (
    <KobalteButton.Root
      data-slot="icon-button"
      class={iconButtonVariants({ size: localProps.size }, localProps.classes?.root)}
      aria-busy={localProps.loading || undefined}
      data-loading={localProps.loading ? '' : undefined}
      disabled={localProps.loading || localProps.disabled}
      {...restProps}
    >
      <Icon
        name={localProps.loading ? localProps.loadingIcon || 'icon-loading' : localProps.name}
        class={localProps.loading ? 'animate-loading' : ''}
      />
    </KobalteButton.Root>
  )
}
