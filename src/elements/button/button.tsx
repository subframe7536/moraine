import type { JSX, ValidComponent } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps, useContext } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ComponentOrElement } from '../../shared/render-prop'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useLoadingAutoClick } from '../../shared/use-loading-auto'
import { callHandler, cn } from '../../shared/utils'
import { Icon } from '../icon'
import type { IconT } from '../icon'

import { ButtonGroupContext } from './button-group-context'
import type { ButtonVariantProps } from './button.class'
import { buttonVariants } from './button.class'

type IsUnion<T, U = T> = T extends unknown ? ([U] extends [T] ? false : true) : never

type ElementFor<T extends ValidComponent> =
  IsUnion<T> extends true
    ? HTMLElement
    : T extends keyof HTMLElementTagNameMap
      ? HTMLElementTagNameMap[T]
      : HTMLElement

export namespace ButtonT {
  export interface Slot<T = unknown> {
    /**
     * Interactive button element, or the polymorphic element provided through `as`.
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

  export interface Item {}
  /**
   * Base props for the Button component.
   */
  export type Base<T extends ValidComponent = 'button'> = {
    /**
     * Element or component to render as.
     * @default 'button'
     */
    as?: T

    /** Native button type when the root renders as a button. */
    type?: T extends 'a'
      ? JSX.AnchorHTMLAttributes<HTMLAnchorElement>['type']
      : JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']

    /**
     * Disabled state, including for non-button polymorphic roots.
     */
    disabled?: boolean

    onClick?: JSX.EventHandlerUnion<ElementFor<T>, MouseEvent>
    onKeyDown?: JSX.EventHandlerUnion<ElementFor<T>, KeyboardEvent>
    onPointerDown?: JSX.EventHandlerUnion<ElementFor<T>, PointerEvent>
    onPointerUp?: JSX.EventHandlerUnion<ElementFor<T>, PointerEvent>
    onPointerCancel?: JSX.EventHandlerUnion<ElementFor<T>, PointerEvent>
    onPointerLeave?: JSX.EventHandlerUnion<ElementFor<T>, PointerEvent>
    onContextMenu?: JSX.EventHandlerUnion<ElementFor<T>, MouseEvent>

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
    children?: ComponentOrElement<{
      /**
       * Whether the button is currently in loading state.
       */
      loading: boolean
    }>
  } & (T extends 'a'
    ? Pick<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'>
    : {})

  /**
   * Props for the Button component.
   */
  export type Props<T extends ValidComponent = 'button'> = BaseProps<T, Base<T>, Variant, Slot>
}

/**
 * Props for the Button component.
 */
export type ButtonProps<T extends ValidComponent = 'button'> = ButtonT.Props<T>

/**
 * Button component with polymorphic `as` support and loading state.
 */
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const group = useContext(ButtonGroupContext)
  const [local, rest] = splitProps(props as ButtonProps<T>, [
    'as',
    'type',
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

  const { isLoading, onClick } = useLoadingAutoClick<ElementFor<T>, MouseEvent>({
    loading: () => local.loading,
    loadingAuto: () => local.loadingAuto,
    get onClick() {
      return local.onClick
    },
  })

  const tag = () => (local.as as ValidComponent) ?? 'button'
  const isNativeBtn = () => typeof tag() === 'string' && (tag() === 'button' || tag() === 'input')
  const isNativeLink = () =>
    !isNativeBtn() &&
    typeof tag() === 'string' &&
    tag() === 'a' &&
    (rest as { href?: string }).href !== undefined
  const needsButtonRole = () => typeof tag() === 'string' && !isNativeBtn() && !isNativeLink()
  const isDisabledOrLoading = () => isLoading() || local.disabled
  const size = () => (local.size ?? group?.size ?? 'md') as NonNullable<ButtonVariantProps['size']>
  const variant = () =>
    (local.variant ?? group?.variant ?? 'default') as NonNullable<ButtonVariantProps['variant']>
  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)

  const iconSize = createMemo(() =>
    size().startsWith('icon-') ? size().replace('icon-', '') : undefined,
  )

  const loadingIconName = createMemo<IconT.Name>(() => local.loadingIcon ?? 'icon-loading')

  const isLeadingLoading = createMemo(() => isLoading() && (leading() || !trailing()))
  const isTrailingLoading = createMemo(() => isLoading() && !(leading() && trailing()))

  const resolvedLeading = createMemo(() => {
    if (!isLoading()) {
      return leading()
    }

    if (leading() || !trailing()) {
      return loadingIconName()
    }

    return undefined
  })

  const resolvedTrailing = createMemo(() => {
    if (!isLoading()) {
      return trailing()
    }

    if (!leading() && trailing()) {
      return loadingIconName()
    }

    return trailing()
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
    // Disabled/loading non-native buttons must cancel the gesture before invoking user code so
    // user handlers observe the same blocked event as native disabled controls.
    if (!isNativeBtn() && isDisabledOrLoading()) {
      event.preventDefault()
      event.stopPropagation()
    }

    callHandler(event, local.onPointerDown)
  }

  const child = resolveChildren(() => local.children as JSX.Element)
  const resolvedChildren = createMemo(() =>
    renderComponentOrElement(child() as ButtonT.Base['children'], {
      get loading() {
        return isLoading()
      },
    }),
  )

  return (
    <Dynamic
      component={tag()}
      style={{ ...local.styles?.root, ...local.style }}
      class={cn(
        buttonVariants({
          variant: variant(),
          size: size(),
        }),
        local.classes?.root,
        local.class,
      )}
      data-slot={local.slotName || 'root'}
      data-size={size()}
      data-variant={variant()}
      aria-busy={isLoading() ? true : undefined}
      data-loading={isLoading() ? '' : undefined}
      aria-disabled={!isNativeBtn() && isDisabledOrLoading() ? true : undefined}
      data-disabled={local.disabled ? '' : undefined}
      {...rest}
      type={
        isNativeBtn()
          ? (local.type ?? 'button')
          : typeof tag() === 'string' && tag() === 'a'
            ? local.type
            : undefined
      }
      role={needsButtonRole() ? 'button' : undefined}
      tabIndex={needsButtonRole() && !isDisabledOrLoading() ? 0 : undefined}
      disabled={isNativeBtn() ? isDisabledOrLoading() : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
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

      <Show when={resolvedChildren()}>
        {(body) => (
          <span
            data-slot="label"
            style={local.styles?.label}
            class={cn('min-w-0 truncate', local.classes?.label)}
          >
            {body()}
          </span>
        )}
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
