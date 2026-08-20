import type { JSX, ValidComponent } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps, useContext } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useLoadingAutoClick } from '../../shared/use-loading-auto.ts'
import { callHandler, cn } from '../../shared/utils.ts'
import { Icon } from '../icon/index.ts'
import type { IconT } from '../icon/index.ts'

import { ButtonGroupContext } from './button-group-context.ts'
import type { ButtonVariantProps } from './button.class.ts'
import { buttonVariants } from './button.class.ts'

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

    /** Native type attribute for supported native roots. */
    type?: T extends 'a'
      ? JSX.AnchorHTMLAttributes<HTMLAnchorElement>['type']
      : T extends 'button'
        ? JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
        : T extends 'input'
          ? JSX.InputHTMLAttributes<HTMLInputElement>['type']
          : never

    /**
     * Disabled state, including for non-button polymorphic roots.
     */
    disabled?: boolean

    onClick?: JSX.EventHandlerUnion<ElementFor<T>, MouseEvent>
    onKeyDown?: JSX.EventHandlerUnion<ElementFor<T>, KeyboardEvent>
    onKeyUp?: JSX.EventHandlerUnion<ElementFor<T>, KeyboardEvent>
    onBlur?: JSX.EventHandlerUnion<ElementFor<T>, FocusEvent>
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
  export type Props<T extends ValidComponent = 'button'> = BaseProps<
    T,
    Base<T>,
    Variant,
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
    'onKeyUp',
    'onBlur',
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

  const tag = createMemo(() => (local.as as ValidComponent) ?? 'button')
  const isNativeBtn = () => typeof tag() === 'string' && (tag() === 'button' || tag() === 'input')
  const isNativeLink = () =>
    !isNativeBtn() &&
    (typeof tag() !== 'string' || tag() === 'a') &&
    (rest as { href?: string }).href !== undefined
  const needsButtonRole = () => !isNativeBtn() && !isNativeLink()
  const isDisabledOrLoading = () => isLoading() || local.disabled
  const size = () => (local.size ?? group?.size ?? 'md') as NonNullable<ButtonVariantProps['size']>
  const variant = () =>
    (local.variant ?? group?.variant ?? 'default') as NonNullable<ButtonVariantProps['variant']>
  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)

  const iconSize = createMemo(() => {
    const currentSize = size()
    if (currentSize.startsWith('icon-')) {
      return currentSize.replace('icon-', '')
    }

    return currentSize === 'sm' ? '0.875rem' : '1rem'
  })

  const loadingIconName = createMemo<IconT.Name>(() => local.loadingIcon ?? 'icon-loading')

  const isLeadingLoading = createMemo(() => isLoading() && (leading() || !trailing()))
  const isTrailingLoading = createMemo(() => isLoading() && (!leading() || !trailing()))

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

  const iconPadding = createMemo(() => {
    if (size().startsWith('icon-')) {
      return undefined
    }

    const paddingStart = size() === 'sm' ? 'ps-1.5' : 'ps-2'
    const paddingEnd = size() === 'sm' ? 'pe-1.5' : 'pe-2'
    return [
      resolvedLeading() ? paddingStart : undefined,
      resolvedTrailing() ? paddingEnd : undefined,
    ]
  })

  let spaceKeyDownArmed = false

  const dispatchKeyboardClick = (target: HTMLElement, event: KeyboardEvent): void => {
    const MouseEventConstructor = target.ownerDocument.defaultView?.MouseEvent ?? MouseEvent
    target.dispatchEvent(
      new MouseEventConstructor('click', {
        altKey: event.altKey,
        bubbles: true,
        cancelable: true,
        composed: true,
        ctrlKey: event.ctrlKey,
        detail: 0,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      }),
    )
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const isActivationKey = event.key === 'Enter' || event.key === ' '
    if (isDisabledOrLoading()) {
      if (isActivationKey) {
        event.preventDefault()
      }
      spaceKeyDownArmed = false
      return
    }

    const isCurrentTarget = event.target === event.currentTarget
    if (isCurrentTarget && event.key === ' ') {
      spaceKeyDownArmed = false
    }

    const { defaultPrevented } = callHandler(event, local.onKeyDown)

    if (defaultPrevented || !isCurrentTarget || !needsButtonRole()) {
      return
    }

    if (event.key === ' ') {
      event.preventDefault()
      spaceKeyDownArmed = true
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      dispatchKeyboardClick(event.currentTarget as HTMLElement, event)
    }
  }

  const handleKeyUp = (event: KeyboardEvent) => {
    const shouldActivate =
      event.key === ' ' &&
      spaceKeyDownArmed &&
      event.target === event.currentTarget &&
      needsButtonRole()

    if (event.key === ' ') {
      spaceKeyDownArmed = false
    }

    if (isDisabledOrLoading()) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
      }
      return
    }

    const { defaultPrevented } = callHandler(event, local.onKeyUp)
    if (!shouldActivate || defaultPrevented) {
      return
    }

    event.preventDefault()
    dispatchKeyboardClick(event.currentTarget as HTMLElement, event)
  }

  const handleBlur = (event: FocusEvent) => {
    spaceKeyDownArmed = false
    callHandler(event, local.onBlur)
  }

  const handleClick = (event: MouseEvent) => {
    if (isDisabledOrLoading()) {
      event.preventDefault()
      return
    }

    callHandler(event, onClick)
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (isDisabledOrLoading()) {
      event.preventDefault()
      return
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
  const hasResolvedChildren = createMemo(() => {
    const value = resolvedChildren()
    return value === 0 || Boolean(value)
  })

  return (
    <Dynamic
      data-slot={local.slotName || 'root'}
      data-size={size()}
      data-variant={variant()}
      aria-busy={isLoading() ? true : undefined}
      data-loading={isLoading() ? '' : undefined}
      aria-disabled={!isNativeBtn() && isDisabledOrLoading() ? true : undefined}
      data-disabled={local.disabled ? '' : undefined}
      {...rest}
      component={tag()}
      style={{ ...local.styles?.root, ...local.style }}
      class={cn(
        buttonVariants({
          variant: variant(),
          size: size(),
        }),
        resolvedLeading() && iconPadding()?.[0],
        resolvedTrailing() && iconPadding()?.[1],
        local.classes?.root,
        local.class,
      )}
      type={
        isNativeBtn()
          ? (local.type ?? 'button')
          : typeof tag() === 'string' && tag() === 'a'
            ? local.type
            : undefined
      }
      role={
        (rest as { role?: JSX.HTMLAttributes<HTMLElement>['role'] }).role ??
        (needsButtonRole() ? 'button' : undefined)
      }
      tabIndex={
        needsButtonRole() && !isDisabledOrLoading()
          ? ((rest as { tabIndex?: number }).tabIndex ?? 0)
          : undefined
      }
      disabled={isNativeBtn() ? isDisabledOrLoading() : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={handleBlur}
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

      <Show when={hasResolvedChildren()}>
        <span
          data-slot="label"
          style={local.styles?.label}
          class={cn('min-w-0 truncate', local.classes?.label)}
        >
          {resolvedChildren()}
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
