import type { Accessor, JSX } from 'solid-js'
import { mergeProps } from 'solid-js'

import type { ValidComponent } from './types.ts'
import { callHandler } from './utils'

export interface UseButtonInteractionOptions {
  disabled: Accessor<boolean>
  /** Whether custom component roots should receive the disabled prop. */
  disabledForComponent?: boolean
  onClick?: Accessor<JSX.EventHandlerUnion<HTMLElement, MouseEvent> | undefined>
  onPress?: Accessor<(() => void) | undefined>
  tag: Accessor<ValidComponent>
}

function dispatchKeyboardClick(target: HTMLElement, event: KeyboardEvent): void {
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

/** Shared native and non-native button activation behavior. */
export function useButtonInteraction(
  options: UseButtonInteractionOptions,
  props: Record<string, unknown>,
): JSX.HTMLAttributes<HTMLElement> {
  const isNativeButton = () => {
    const tag = options.tag()
    return typeof tag === 'string' && (tag === 'button' || tag === 'input')
  }
  const needsButtonRole = () => {
    if (isNativeButton()) {
      return false
    }
    if (props.href === undefined) {
      return true
    }

    const tag = options.tag()
    return typeof tag === 'string' && tag !== 'a'
  }
  let spaceKeyDownArmed = false

  const onKeyDown = (event: KeyboardEvent): void => {
    const isActivationKey = event.key === 'Enter' || event.key === ' '
    if (options.disabled()) {
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

    const { defaultPrevented } = callHandler<HTMLElement, KeyboardEvent>(event, props.onKeyDown)
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

  const onKeyUp = (event: KeyboardEvent): void => {
    const shouldActivate =
      event.key === ' ' &&
      spaceKeyDownArmed &&
      event.target === event.currentTarget &&
      needsButtonRole()

    if (event.key === ' ') {
      spaceKeyDownArmed = false
    }

    if (options.disabled()) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
      }
      return
    }

    const { defaultPrevented } = callHandler<HTMLElement, KeyboardEvent>(event, props.onKeyUp)
    if (!shouldActivate || defaultPrevented) {
      return
    }

    event.preventDefault()
    dispatchKeyboardClick(event.currentTarget as HTMLElement, event)
  }

  const interactionProps = mergeProps(props, {
    get type() {
      if (isNativeButton()) {
        return props.type ?? 'button'
      }
      return props.type
    },
    get role() {
      return props.role ?? (needsButtonRole() ? 'button' : undefined)
    },
    get tabIndex() {
      return needsButtonRole() && !options.disabled() ? (props.tabIndex ?? 0) : undefined
    },
    get 'aria-disabled'() {
      return !isNativeButton() && options.disabled() ? true : undefined
    },
    get disabled() {
      const tag = options.tag()
      return isNativeButton() || (typeof tag !== 'string' && options.disabledForComponent)
        ? options.disabled()
        : undefined
    },
    onBlur(event: FocusEvent): void {
      spaceKeyDownArmed = false
      callHandler<HTMLElement, FocusEvent>(event, props.onBlur)
    },
    onClick(event: MouseEvent): void {
      if (options.disabled()) {
        event.preventDefault()
        return
      }

      const { defaultPrevented } = callHandler<HTMLElement, MouseEvent>(
        event,
        options.onClick?.() ?? props.onClick,
      )
      if (!defaultPrevented) {
        options.onPress?.()?.()
      }
    },
    onKeyDown,
    onKeyUp,
    onPointerDown(event: PointerEvent): void {
      if (options.disabled()) {
        event.preventDefault()
        return
      }

      callHandler<HTMLElement, PointerEvent>(event, props.onPointerDown)
    },
  })

  return interactionProps as JSX.HTMLAttributes<HTMLElement>
}
