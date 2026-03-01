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

function getSizeClass(size: IconButtonBaseProps['size']) {
  switch (size ?? 'md') {
    case 'xs':
    case 'sm':
      return 'size-4'
    case 'md':
    case 'lg':
      return 'size-5'
    case 'xl':
      return 'size-6'
  }
}

export type IconButtonProps<T extends ValidComponent = 'button'> = PolymorphicProps<
  T,
  IconButtonBaseProps & Omit<KobalteButton.ButtonRootProps<ElementOf<T>>, 'class'>
>

export function IconButton<T extends ValidComponent = 'button'>(
  props: IconButtonProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props as IconButtonProps, [
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
        getSizeClass(local.size),
        local.loading
          ? 'cursor-wait opacity-80 animate-spin pointer-events-none'
          : 'cursor-pointer',
        local.class,
      )}
      aria-busy={local.loading || undefined}
      data-loading={local.loading ? '' : undefined}
      disabled={local.loading || local.disabled}
      {...rest}
    >
      <Icon
        name={local.loading ? local.loadingIcon || 'icon-loading' + 'animate-spin' : local.name}
        class="size-full"
      />
    </KobalteButton.Root>
  )
}
