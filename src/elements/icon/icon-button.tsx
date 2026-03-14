import * as KobalteButton from '@kobalte/core/button'
import type { ElementOf, PolymorphicProps } from '@kobalte/core/polymorphic'
import type { JSX, ValidComponent } from 'solid-js'
import { splitProps } from 'solid-js'

import { cn } from '../../shared/utils'
import { buttonVariants } from '../button/button.class'

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
        buttonVariants({
          size: localProps.size ? (`icon-${localProps.size}` as any) : 'icon-md',
          variant: 'ghost',
        }),
        localProps.loading ? 'opacity-80 cursor-wait pointer-events-none' : 'cursor-pointer',
        localProps.class,
      )}
      aria-busy={localProps.loading || undefined}
      data-loading={localProps.loading ? '' : undefined}
      disabled={localProps.loading || localProps.disabled}
      {...restProps}
    >
      <Icon
        name={localProps.loading ? localProps.loadingIcon || 'icon-loading' : localProps.name}
        size={localProps.size}
        class={cn(localProps.loading && 'animate-spin')}
      />
    </KobalteButton.Root>
  )
}
