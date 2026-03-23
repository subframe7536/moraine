import * as KobalteButton from '@kobalte/core/button'
import type { ElementOf, PolymorphicProps } from '@kobalte/core/polymorphic'
import type { JSX, ValidComponent } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'

import type { MaybeRenderProp } from '../../shared/render-prop'
import { resolveRenderProp } from '../../shared/render-prop'
import type { RockUIProps, SlotClasses, SlotStyles } from '../../shared/types'
import { useLoadingAutoClick } from '../../shared/use-loading-auto'
import { cn } from '../../shared/utils'
import { Icon } from '../icon'
import type { IconT } from '../icon'

import type { ButtonVariantProps } from './button.class'
import { buttonVariants } from './button.class'

export namespace ButtonT {
  export type Slot = 'root' | 'loading' | 'leading' | 'label' | 'trailing'
  export type Variant = ButtonVariantProps
  export interface Items {}
  export type Extend<T extends ValidComponent = 'button'> = PolymorphicProps<
    T,
    KobalteButton.ButtonRootProps<ElementOf<T>>
  >
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

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
   * Polymorphic button props composed from Kobalte button root props and Rock UI button options.
   */
  export type Props<T extends ValidComponent = 'button'> = RockUIProps<
    Base,
    Variant,
    Extend<T>,
    Slot
  >
}

/**
 * Props for the Button component.
 * Polymorphic button props composed from Kobalte button root props and Rock UI button options.
 */
// NOTE: keep `type` here; `interface extends ...` breaks Solid JSX inference for polymorphic components.
export type ButtonProps<T extends ValidComponent = 'button'> = ButtonT.Props<T>

/**
 * Rock UI Button built on top of Kobalte `Button.Root` with polymorphic `as` support.
 */
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const [styleProps, stateProps, contentProps, restProps] = splitProps(
    props as ButtonProps,
    ['variant', 'size', 'classes', 'styles', 'slotName'],
    ['disabled', 'loading', 'loadingAuto', 'loadingIcon', 'onClick'],
    ['leading', 'trailing', 'children'],
  )

  const { isLoading, onClick } = useLoadingAutoClick<ElementOf<T>, MouseEvent>({
    loading: () => stateProps.loading,
    loadingAuto: () => stateProps.loadingAuto,
    onClick: () => stateProps.onClick,
  })

  const iconSize = createMemo(() =>
    styleProps.size?.startsWith('icon-') ? styleProps.size.replace('icon-', '') : undefined,
  )

  const resolvedLeading = createMemo(() => {
    if (!isLoading()) {
      return contentProps.leading
    }

    if (stateProps.loadingIcon || stateProps.loadingAuto) {
      return stateProps.loadingIcon ?? 'icon-loading'
    }

    return contentProps.leading
  })

  return (
    <KobalteButton.Root
      data-slot={styleProps.slotName || 'root'}
      style={styleProps.styles?.root}
      class={buttonVariants(
        {
          variant: styleProps.variant,
          size: styleProps.size,
        },
        styleProps.classes?.root,
      )}
      aria-busy={isLoading() ? true : undefined}
      data-loading={isLoading() ? '' : undefined}
      disabled={isLoading() || stateProps.disabled}
      onClick={onClick}
      {...restProps}
    >
      <Show when={resolvedLeading()}>
        {(leading) => (
          <Icon
            name={leading()}
            size={iconSize()}
            slotName="leading"
            style={styleProps.styles?.leading}
            class={cn(
              styleProps.classes?.leading,
              isLoading() && ['animate-loading', styleProps.classes?.loading],
            )}
            aria-hidden={isLoading() ? true : undefined}
          />
        )}
      </Show>

      <Show when={contentProps.children}>
        <span
          data-slot="label"
          style={styleProps.styles?.label}
          class={cn('min-w-0 truncate', styleProps.classes?.label)}
        >
          {resolveRenderProp(contentProps.children, () => ({
            loading: isLoading(),
          }))}
        </span>
      </Show>

      <Show when={contentProps.trailing}>
        {(trailing) => (
          <Icon
            name={trailing()}
            size={iconSize()}
            slotName="trailing"
            style={styleProps.styles?.trailing}
            class={cn(styleProps.classes?.trailing)}
          />
        )}
      </Show>
    </KobalteButton.Root>
  )
}
