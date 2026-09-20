import type { Accessor, JSX } from 'solid-js'
import { mergeProps } from 'solid-js'

import type { ValidComponent } from './types.ts'
import { callHandler } from './utils'

const BUTTON_INPUT_TYPES = new Set(['button', 'color', 'file', 'image', 'reset', 'submit'])

export interface UseButtonInteractionOptions {
  disabled: Accessor<boolean>
  /** Resolved DOM root for polymorphic components when available. */
  element?: Accessor<HTMLElement | undefined>
  /** Whether disabled interaction should remain keyboard focusable. */
  focusableWhenDisabled?: Accessor<boolean>
  /** Whether custom component roots should receive disabled before their DOM root resolves. */
  disabledForComponent?: boolean
  /** Replaces the caller click handler while preserving Button interaction semantics. */
  onClickOverride?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
  /** Semantic action performed after an uncancelled click. */
  onPress?: () => void
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
  const isFocusableWhenDisabled = () =>
    options.disabled() && Boolean(options.focusableWhenDisabled?.())

  const isNativeButton = () => {
    const element = options.element?.()
    if (element) {
      const tagName = element.tagName.toLowerCase()
      if (tagName === 'button') {
        return true
      }
      if (tagName === 'input') {
        const type =
          typeof props.type === 'string' ? props.type : (element as HTMLInputElement).type
        return BUTTON_INPUT_TYPES.has(type.toLowerCase())
      }
      return false
    }

    const tag = options.tag()
    if (typeof tag !== 'string') {
      return false
    }

    const tagName = tag.toLowerCase()
    if (tagName === 'button') {
      return true
    }
    if (tagName === 'input') {
      const type = typeof props.type === 'string' ? props.type : 'button'
      return BUTTON_INPUT_TYPES.has(type.toLowerCase())
    }
    return false
  }

  const isNativeLink = () => {
    const hasHref = props.href !== undefined
    const element = options.element?.()
    if (element) {
      return element.tagName.toLowerCase() === 'a' && (hasHref || element.hasAttribute('href'))
    }

    const tag = options.tag()
    if (typeof tag === 'string') {
      return tag.toLowerCase() === 'a' && hasHref
    }

    return hasHref
  }

  const needsButtonRole = () => !isNativeButton() && !isNativeLink()
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
      if (!needsButtonRole()) {
        return props.tabIndex
      }

      if (props.tabIndex !== undefined) {
        return props.tabIndex
      }

      return !options.disabled() || isFocusableWhenDisabled() ? 0 : undefined
    },
    get 'aria-disabled'() {
      if (!options.disabled()) {
        return props['aria-disabled']
      }

      if (!isNativeButton() || isFocusableWhenDisabled()) {
        return true
      }

      return props['aria-disabled']
    },
    get disabled() {
      if (isNativeButton()) {
        return options.disabled() && !isFocusableWhenDisabled()
      }

      const tag = options.tag()
      if (!options.element?.() && typeof tag !== 'string' && options.disabledForComponent) {
        return options.disabled() && !isFocusableWhenDisabled()
      }

      return undefined
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
        options.onClickOverride ?? props.onClick,
      )
      if (!defaultPrevented) {
        options.onPress?.()
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
