import * as KobalteButton from '@kobalte/core/button'
import type { ElementOf, PolymorphicProps } from '@kobalte/core/polymorphic'
import type { JSX, ValidComponent } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'

import type { MaybeRenderProp } from '../../shared/render-prop'
import { resolveRenderProp } from '../../shared/render-prop'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { useLoadingAutoClick } from '../../shared/use-loading-auto'
import { cn } from '../../shared/utils'
import { Icon } from '../icon'
import type { IconT } from '../icon'

import type { ButtonVariantProps } from './button.class'
import { buttonVariants } from './button.class'

export namespace ButtonT {
  export type Slot = 'root' | 'loading' | 'leading' | 'label' | 'trailing'
  export type Variant = ButtonVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend<T extends ValidComponent = 'button'> = PolymorphicProps<
    T,
    KobalteButton.ButtonRootProps<ElementOf<T>>
  >

  export interface Items {}
  /**
   * Base props for the Button component.
   */
  export interface Base {
    /**
     * Root `data-slot` name
     */
    slotName?: string
    /**
     * Controlled loading state.
     * @default false
     */
    loading?: boolean

    /**
     * Auto toggles loading while async click handlers are pending.
     * @default false
     */
    loadingAuto?: boolean

    /**
     * Optional icon shown when `loading` is active.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Leading visual content, usually an icon.
     */
    leading?: IconT.Name

    /**
     * Trailing visual content, usually an icon.
     */
    trailing?: IconT.Name

    /**
     * Children of the button. Supports render function form.
     */
    children?: MaybeRenderProp<{
      /**
       * Whether the button is currently in loading state.
       */
      loading: boolean
    }>
  }

  /**
   * Props for the Button component.
   */
  export type Props<T extends ValidComponent = 'button'> = BaseProps<Base, Variant, Extend<T>, Slot>
}

/**
 * Props for the Button component.
 */
export type ButtonProps<T extends ValidComponent = 'button'> = ButtonT.Props<T>

/**
 * Button component built on top of Kobalte `Button.Root` with polymorphic `as` support.
 */
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, [
    'variant',
    'size',
    'classes',
    'styles',
    'slotName',
    'disabled',
    'loading',
    'loadingAuto',
    'loadingIcon',
    'onClick',
    'leading',
    'trailing',
    'children',
  ])

  const { isLoading, onClick } = useLoadingAutoClick<ElementOf<T>, MouseEvent>({
    loading: () => local.loading,
    loadingAuto: () => local.loadingAuto,
    onClick: () => local.onClick,
  })

  const iconSize = createMemo(() =>
    local.size?.startsWith('icon-') ? local.size.replace('icon-', '') : undefined,
  )

  const loadingIconName = createMemo<IconT.Name>(() => local.loadingIcon ?? 'icon-loading')

  const isLeadingLoading = createMemo(() => isLoading() && (local.leading || !local.trailing))
  const isTrailingLoading = createMemo(() => isLoading() && !(local.leading && local.trailing))

  const resolvedLeading = createMemo(() => {
    if (!isLoading()) {
      return local.leading
    }

    if (local.leading || !local.trailing) {
      return loadingIconName()
    }

    return undefined
  })

  const resolvedTrailing = createMemo(() => {
    if (!isLoading()) {
      return local.trailing
    }

    if (!local.leading && local.trailing) {
      return loadingIconName()
    }

    return local.trailing
  })

  return (
    <KobalteButton.Root
      data-slot={local.slotName || 'root'}
      style={local.styles?.root}
      class={buttonVariants(
        {
          variant: local.variant,
          size: local.size,
        },
        local.classes?.root,
      )}
      aria-busy={isLoading() ? true : undefined}
      data-loading={isLoading() ? '' : undefined}
      disabled={isLoading() || local.disabled}
      onClick={onClick}
      {...rest}
    >
      <Show when={resolvedLeading()}>
        {(leading) => (
          <Icon
            name={leading()}
            size={iconSize()}
            slotName="leading"
            style={local.styles?.leading}
            class={cn(
              local.classes?.leading,
              isLeadingLoading() && ['effect-loading', local.classes?.loading],
            )}
            aria-hidden={isLeadingLoading() ? true : undefined}
          />
        )}
      </Show>

      <Show when={local.children}>
        <span
          data-slot="label"
          style={local.styles?.label}
          class={cn('min-w-0 truncate', local.classes?.label)}
        >
          {resolveRenderProp(local.children, () => ({
            loading: isLoading(),
          }))}
        </span>
      </Show>

      <Show when={resolvedTrailing()}>
        {(trailing) => (
          <Icon
            name={trailing()}
            size={iconSize()}
            slotName="trailing"
            style={local.styles?.trailing}
            class={cn(
              local.classes?.trailing,
              isTrailingLoading() && ['effect-loading', local.classes?.loading],
            )}
          />
        )}
      </Show>
    </KobalteButton.Root>
  )
}
