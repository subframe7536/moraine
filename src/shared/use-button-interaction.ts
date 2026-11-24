import type { JSX } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { createEffect, createSignal, merge, untrack } from 'solid-js'

import { isNativeButtonElement, isNativeButtonTag } from './native-button'
import type { ValidComponent } from './types'
import { callHandler } from './utils'
export interface UseButtonInteractionOptions {
  disabled: Accessor<boolean>
  /** Resolved DOM root for polymorphic components when available. */
  element?: Accessor<HTMLElement | undefined>
  /** Whether disabled interaction should remain keyboard focusable. */
  focusableWhenDisabled?: Accessor<boolean>
  /** Whether custom component roots should receive disabled before their DOM root resolves. */
  disabledForComponent?: boolean
  /** Uses the shared keyboard click path for native roots as well. */
  manualKeyboardActivation?: boolean
  /** Replaces the caller click handler while preserving Button interaction semantics. */
  onClickOverride?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
  /** Semantic action performed after an uncancelled click. */
  onPress?: (event: MouseEvent) => void
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

  // For component tags `props.type` flows through `props` untouched: emitting an
  // explicit `undefined` under Solid 2 spread semantics would clear a `type` the
  // custom component rendered itself. Native-string tags keep the prop-based
  // default so SSR emits it; component-rendered native buttons get the same
  // default injected post-mount below.
  const hasStaticTag = typeof untrack(options.tag) === 'string'

  // A string tag already names its element, so only custom component roots resolve semantics
  // from the DOM. Their element is known only after the spread that renders it assigns the ref,
  // so it is republished from an effect: the attribute getters below then re-run in the
  // flush continuation instead of feeding the ref write back into the spread that made it.
  const [componentElement, setComponentElement] = createSignal<HTMLElement | undefined>()
  if (!hasStaticTag) {
    createEffect(
      () => [options.element?.(), props.type as string | undefined] as const,
      ([element, type]) => {
        setComponentElement(element)
        if (element && isNativeButtonElement(element, type)) {
          element.setAttribute(
            'type',
            type ?? (element.localName === 'input' ? (element as HTMLInputElement).type : 'button'),
          )
        }
      },
    )
  }
  const resolvedElement = () => (typeof options.tag() === 'string' ? undefined : componentElement())

  const isNativeButton = () => {
    const element = resolvedElement()
    if (element) {
      return isNativeButtonElement(element, typeof props.type === 'string' ? props.type : undefined)
    }

    const tag = options.tag()
    if (typeof tag !== 'string') {
      return false
    }

    return isNativeButtonTag(tag, typeof props.type === 'string' ? props.type : undefined)
  }

  const isNativeLink = () => {
    const hasHref = props.href !== undefined
    const element = resolvedElement()
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
  const handlesKeyboardActivation = () => needsButtonRole() || options.manualKeyboardActivation
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

    const { defaultPrevented } = callHandler<KeyboardEvent>(event, props.onKeyDown)
    if (defaultPrevented || !isCurrentTarget || !handlesKeyboardActivation()) {
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
      handlesKeyboardActivation()

    if (event.key === ' ') {
      spaceKeyDownArmed = false
    }

    if (options.disabled()) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
      }
      return
    }

    const { defaultPrevented } = callHandler<KeyboardEvent>(event, props.onKeyUp)
    if (!shouldActivate || defaultPrevented) {
      return
    }

    event.preventDefault()
    dispatchKeyboardClick(event.currentTarget as HTMLElement, event)
  }

  const interactionProps = merge(
    props,
    hasStaticTag
      ? {
          get type() {
            return props.type ?? (isNativeButton() ? 'button' : undefined)
          },
        }
      : {},
    {
      get role() {
        return props.role ?? (needsButtonRole() ? 'button' : undefined)
      },
      get tabIndex() {
        if (props.tabindex !== undefined) {
          return props.tabindex
        }

        if (options.disabled() && !isNativeButton() && !isFocusableWhenDisabled()) {
          return -1
        }

        if (!needsButtonRole()) {
          return undefined
        }

        return 0
      },
      get 'aria-disabled'() {
        if (!options.disabled()) {
          return props['aria-disabled']
        }

        if (!isNativeButton() || isFocusableWhenDisabled()) {
          return props['aria-disabled'] ?? 'true'
        }

        return props['aria-disabled']
      },
      get disabled() {
        if (isNativeButton()) {
          return options.disabled() && !isFocusableWhenDisabled()
        }

        const tag = options.tag()
        if (!componentElement() && typeof tag !== 'string' && options.disabledForComponent) {
          return options.disabled() && !isFocusableWhenDisabled()
        }

        return undefined
      },
      onBlur(event: FocusEvent): void {
        spaceKeyDownArmed = false
        callHandler<FocusEvent>(event, props.onBlur)
      },
      onClick(event: MouseEvent): void {
        if (options.disabled()) {
          event.preventDefault()
          return
        }

        const { defaultPrevented } = callHandler<MouseEvent>(
          event,
          options.onClickOverride ?? props.onClick,
        )
        if (!defaultPrevented) {
          options.onPress?.(event)
        }
      },
      onKeyDown,
      onKeyUp,
      onPointerDown(event: PointerEvent): void {
        if (options.disabled()) {
          event.preventDefault()
          return
        }

        callHandler<PointerEvent>(event, props.onPointerDown)
      },
    },
  )

  return interactionProps as JSX.HTMLAttributes<HTMLElement>
}
