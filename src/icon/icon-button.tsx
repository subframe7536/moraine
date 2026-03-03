import * as KobalteButton from '@kobalte/core/button'
import type { ElementOf, PolymorphicProps } from '@kobalte/core/polymorphic'
import type { JSX, ValidComponent } from 'solid-js'
import { splitProps } from 'solid-js'

import { cn } from '../shared/utils'

import { Icon } from './icon'
import type { IconName } from './icon'

export interface IconButtonBaseProps {
  /**
   * Icon source. Strings should be Uno icon classes such as `i-lucide-search`.
   */
  name: IconName

  /**
   * Controlled loading state.
   */
  loading?: boolean

  /**
   * Optional icon shown when `loading` is active.
   */
  loadingIcon?: IconName
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

function getIconSizeClass(size: IconButtonBaseProps['size']) {
  switch (size) {
    case 'xs':
    case 'sm':
      return 'size-4'
    case 'md':
    case 'lg':
      return 'size-5'
    case 'xl':
      return 'size-6'
  }
  return undefined
}

export type IconButtonProps<T extends ValidComponent = 'button'> = PolymorphicProps<
  T,
  IconButtonBaseProps & Omit<KobalteButton.ButtonRootProps<ElementOf<T>>, 'class'>
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
      class={cn(
        getIconSizeClass(localProps.size),
        localProps.loading
          ? 'cursor-wait opacity-80 animate-spin pointer-events-none'
          : 'cursor-pointer',
        localProps.class,
      )}
      aria-busy={localProps.loading || undefined}
      data-loading={localProps.loading ? '' : undefined}
      disabled={localProps.loading || localProps.disabled}
      {...restProps}
    >
      <Icon
        name={
          localProps.loading
            ? localProps.loadingIcon || 'icon-loading' + 'animate-spin'
            : localProps.name
        }
        class="size-full"
      />
    </KobalteButton.Root>
  )
}
