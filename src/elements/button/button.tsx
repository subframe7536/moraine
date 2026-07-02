import type { ComponentProps, JSX, ValidComponent } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { MaybeRenderProp } from '../../shared/render-prop'
import { resolveRenderProp } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useLoadingAutoClick } from '../../shared/use-loading-auto'
import { callHandler, cn } from '../../shared/utils'
import { Icon } from '../icon'
import type { IconT } from '../icon'

import type { ButtonVariantProps } from './button.class'
import { buttonVariants } from './button.class'

export namespace ButtonT {
  export interface Slot<T = unknown> {
    /**
     * Interactive button element, or the polymorphic element provided through `as`.
     * @deprecated Use top-level `class` and `style` props for the component root.
     */

    root?: T

    /** Loading icon shown while the button is busy. */
    loading?: T

    /** Icon region before the button label. */
    leading?: T

    /** Button content region after render-prop resolution. */
    label?: T

    /** Icon region after the button label. */
    trailing?: T
  }
  export type Variant = ButtonVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Extend<T extends ValidComponent = 'button'> = ComponentProps<T> & { as?: T }

  export interface Item {}
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
  export type Props<T extends ValidComponent = 'button'> = BaseProps<
    Base,
    Variant,
    Extend<T>,
    Classes,
    Styles
  >
}

/**
 * Props for the Button component.
 */
export type ButtonProps<T extends ValidComponent = 'button'> = ButtonT.Props<T>

/**
 * Button component with polymorphic `as` support and loading state.
 */
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const [local, rest] = splitProps(props as ButtonProps, [
    'as',
    'variant',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'slotName',
    'disabled',
    'loading',
    'loadingAuto',
    'loadingIcon',
    'onClick',
    'onKeyDown',
    'onPointerDown',
    'leading',
    'trailing',
    'children',
  ])

  const { isLoading, onClick } = useLoadingAutoClick<any, MouseEvent>({
    loading: () => local.loading,
    loadingAuto: () => local.loadingAuto,
    onClick: () => local.onClick,
  })

  const tag = () => (local.as as ValidComponent) ?? 'button'
  const isNativeBtn = () => typeof tag() === 'string' && (tag() === 'button' || tag() === 'input')
  const isNativeLink = () =>
    !isNativeBtn() && typeof tag() === 'string' && tag() === 'a' && (rest as any).href !== undefined
  const needsButtonRole = () => typeof tag() === 'string' && !isNativeBtn() && !isNativeLink()
  const isDisabledOrLoading = () => isLoading() || local.disabled

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

  // Handle keyboard activation for non-native buttons
  const handleKeyDown = (event: KeyboardEvent) => {
    // Call user's onKeyDown handler first
    const { defaultPrevented } = callHandler(event, local.onKeyDown)

    if (defaultPrevented) {
      return
    }

    // Block keyboard activation when disabled or loading
    if (isDisabledOrLoading()) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
      }
      return
    }

    // For non-native buttons, activate on Enter or Space
    if (needsButtonRole() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      // Simulate a click by calling the click handler directly
      const target = event.target as HTMLElement
      target.click()
    }
  }

  // Handle click events with disabled/loading blocking
  const handleClick = (event: MouseEvent) => {
    // Block clicks when disabled or loading for non-native buttons
    if (!isNativeBtn() && isDisabledOrLoading()) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    // Call the onClick handler through useLoadingAutoClick
    callHandler(event, onClick)
  }

  // Handle pointer events to block interaction when disabled/loading
  const handlePointerDown = (event: PointerEvent) => {
    if (!isNativeBtn() && isDisabledOrLoading()) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Call user's onPointerDown handler after our handling
    callHandler(event, local.onPointerDown)
  }

  return (
    <Dynamic
      component={tag()}
      data-slot={local.slotName || 'root'}
      style={{ ...local.styles?.root, ...local.style }}
      class={buttonVariants(
        {
          variant: local.variant,
          size: local.size,
        },
        local.classes?.root,
        local.class,
      )}
      type={isNativeBtn() ? 'button' : undefined}
      role={needsButtonRole() ? 'button' : undefined}
      tabIndex={needsButtonRole() && !isDisabledOrLoading() ? 0 : undefined}
      aria-busy={isLoading() ? true : undefined}
      data-loading={isLoading() ? '' : undefined}
      disabled={isNativeBtn() ? isDisabledOrLoading() : undefined}
      aria-disabled={!isNativeBtn() && isDisabledOrLoading() ? true : undefined}
      data-disabled={local.disabled ? '' : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
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
          {resolveRenderProp(local.children, {
            get loading() {
              return isLoading()
            },
          })}
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
    </Dynamic>
  )
}
