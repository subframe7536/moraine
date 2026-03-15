import * as KobalteButton from '@kobalte/core/button'
import type { ElementOf, PolymorphicProps } from '@kobalte/core/polymorphic'
import type { JSX, ValidComponent } from 'solid-js'
import { splitProps } from 'solid-js'

import type { RockUIComposeProps } from '../../shared/types'

import { Icon } from './icon'
import type { IconName } from './icon'
import { iconButtonVariants } from './icon-button.class'

/**
 * Base props for the IconButton component.
 */
export interface IconButtonBaseProps {
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
export type IconButtonProps<T extends ValidComponent = 'button'> = PolymorphicProps<
  T,
  RockUIComposeProps<IconButtonBaseProps, KobalteButton.ButtonRootProps<ElementOf<T>>, 'class'>
>

export function IconButton<T extends ValidComponent = 'button'>(
  props: IconButtonProps<T>,
): JSX.Element {
  const [localProps, restProps] = splitProps(props as IconButtonProps, [
    'class',
    'name',
    'loading',
    'loadingIcon',
    'disabled',
    'size',
  ])

  return (
    <KobalteButton.Root
      data-slot="icon-button"
      class={iconButtonVariants({ size: localProps.size }, localProps.class)}
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
