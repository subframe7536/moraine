import * as KobalteButton from '@kobalte/core/button'
import type { ElementOf, PolymorphicProps } from '@kobalte/core/polymorphic'
import type { JSX, ValidComponent } from 'solid-js'
import { Show, createMemo, createSignal, splitProps } from 'solid-js'

import type { SlotClasses, SlotStyles } from '../../shared/slot'
import { callHandler, cn } from '../../shared/utils'
import { Icon } from '../icon'
import type { IconName } from '../icon'

import type { ButtonVariantProps } from './button.class'
import { buttonVariants } from './button.class'

/**
 * Class overrides for Button slots.
 */
type ButtonSlots = 'base' | 'loading' | 'leading' | 'label' | 'trailing'

export type ButtonClasses = SlotClasses<ButtonSlots>

export type ButtonStyles = SlotStyles<ButtonSlots>

/**
 * Additional Rock UI button options on top of Kobalte's polymorphic button props.
 */
export interface ButtonBaseProps extends ButtonVariantProps {
  /**
   * Controlled loading state.
   */
  loading?: boolean

  /**
   * Auto toggles loading while async click handlers are pending.
   */
  loadingAuto?: boolean

  /**
   * Optional icon shown when `loading` is active.
   */
  loadingIcon?: IconName

  /**
   * Leading visual content, usually an icon.
   */
  leading?: IconName

  /**
   * Trailing visual content, usually an icon.
   */
  trailing?: IconName

  /**
   * Slot-based class overrides, similar to Nuxt UI `ui` customization.
   */
  classes?: ButtonClasses
  styles?: ButtonStyles
}

/**
 * Polymorphic button props composed from Kobalte button root props and Rock UI button options.
 */
export type ButtonProps<T extends ValidComponent = 'button'> = PolymorphicProps<
  T,
  ButtonBaseProps & Omit<KobalteButton.ButtonRootProps<ElementOf<T>>, 'class'>
>

type PromiseLikeWithFinally = PromiseLike<unknown> & {
  then: PromiseLike<unknown>['then']
}

function isPromiseLike(value: unknown): value is PromiseLikeWithFinally {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
}

/**
 * Rock UI Button built on top of Kobalte `Button.Root` with polymorphic `as` support.
 */
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const [styleProps, stateProps, contentProps, restProps] = splitProps(
    props as ButtonProps,
    ['class', 'variant', 'size', 'classes', 'styles'],
    ['disabled', 'loading', 'loadingAuto', 'loadingIcon', 'onClick'],
    ['leading', 'trailing', 'children'],
  )

  const [loadingAutoState, setLoadingAutoState] = createSignal(false)

  const isLoading = createMemo(() =>
    Boolean(stateProps.loading || (stateProps.loadingAuto && loadingAutoState())),
  )

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

  const onClick: JSX.EventHandlerUnion<any, MouseEvent> = (event) => {
    const { result: handlerResult, defaultPrevented } = callHandler(event, stateProps.onClick)

    if (!stateProps.loadingAuto || defaultPrevented || !isPromiseLike(handlerResult)) {
      return
    }

    setLoadingAutoState(true)
    Promise.resolve(handlerResult).finally(() => {
      setLoadingAutoState(false)
    })
  }

  return (
    <KobalteButton.Root
      data-slot="base"
      style={styleProps.styles?.base}
      class={buttonVariants(
        {
          variant: styleProps.variant,
          size: styleProps.size,
        },
        isLoading() && 'cursor-wait opacity-80',
        styleProps.classes?.base,
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
            data-slot="leading"
            style={styleProps.styles?.leading}
            class={cn(
              styleProps.classes?.leading,
              isLoading() && ['animate-spin', styleProps.classes?.loading],
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
          {contentProps.children}
        </span>
      </Show>

      <Show when={contentProps.trailing}>
        {(trailing) => (
          <Icon
            name={trailing()}
            size={iconSize()}
            data-slot="trailing"
            style={styleProps.styles?.trailing}
            class={cn(styleProps.classes?.trailing)}
          />
        )}
      </Show>
    </KobalteButton.Root>
  )
}
