import type { Accessor, JSX } from 'solid-js'
import { createSignal, mergeProps, onCleanup } from 'solid-js'
import { delegateEvents } from 'solid-js/web'

import { attachEventListener } from '../../shared/event-listener'
import type { BaseProps, ElementProps, SlotStyleValue, ValidComponent } from '../../shared/types'
import { callHandler, callRef } from '../../shared/utils'

import { isHTMLElement, isNativeButtonElement } from './dom'

export interface OverlayTriggerBase<T extends ValidComponent = 'button'> {
  /** Element or component to render as. */
  as?: T
  /** Whether this trigger is disabled. */
  disabled?: boolean
  /** Trigger label and visual content. */
  children?: JSX.Element
}

export type OverlayTriggerComponentProps<T extends ValidComponent = 'button'> = BaseProps<
  T,
  OverlayTriggerBase<T>,
  never,
  never,
  never,
  'button'
>

/** Props that an overlay render prop must forward to its trigger root. */
export type OverlayTriggerBinding = Omit<
  ElementProps,
  'children' | 'class' | 'disabled' | 'onContextMenu' | 'ref' | 'style'
> & {
  /** Class applied to the trigger root. */
  class?: string

  /** Whether the trigger is disabled. */
  disabled?: boolean

  /** Context menu handler forwarded to the trigger root. */
  onContextMenu?: (event: MouseEvent) => void

  /** Registers the trigger root used for positioning and focus restoration. */
  ref: (element: HTMLElement | undefined) => void

  /** Style applied to the trigger root. */
  style?: SlotStyleValue
}

/** Compose consumer events before menu behavior, retaining canceled pointer-up cleanup. */
export function mergeMenuTriggerProps<T extends object>(
  user: T,
  internal: OverlayTriggerBinding,
  customTrigger: Accessor<boolean> = () => false,
): OverlayTriggerBinding & T {
  const userHandlers = user as Record<string, unknown>
  const handlers: Record<string, unknown> = {}
  const handledEvents = new WeakSet<Event>()
  for (const key of [
    'onClick',
    'onKeyDown',
    'onContextMenu',
    'onPointerDown',
    'onPointerMove',
    'onPointerUp',
    'onPointerCancel',
  ] as const) {
    handlers[key] = (event: Event) => {
      if (handledEvents.has(event)) {
        return
      }
      handledEvents.add(event)
      callHandler(event, userHandlers[key])
      if (userHandlers.disabled) {
        event.preventDefault()
      }
      callHandler(event, internal[key])
    }
  }
  const triggerProps = mergeProps(internal, user, handlers, {
    ref: (element: HTMLElement | undefined) => {
      internal.ref(element)
      callRef(userHandlers.ref, element)
      if (element) {
        // A custom root may cancel a click after spreading trigger props.
        if (customTrigger()) {
          delegateEvents(['click'], document)
        }
        const releases = Object.entries(handlers).map(([key, handler]) =>
          attachEventListener(
            element,
            key.slice(2).toLowerCase() as keyof HTMLElementEventMap,
            (event) => {
              if (element.ownerDocument !== document) {
                ;(handler as EventListener)(event)
              }
            },
          ),
        )
        if (customTrigger()) {
          releases.push(
            attachEventListener(document, 'click', (event) => {
              if (event.target instanceof Node && element.contains(event.target)) {
                ;(handlers.onClick as EventListener)(event)
              }
            }),
          )
        }
        onCleanup(() => {
          releases.forEach((release) => release())
          callRef(userHandlers.ref, undefined)
        })
      }
    },
  }) as OverlayTriggerBinding & T
  return triggerProps
}

export function createOverlayTriggerRef(): {
  element: Accessor<HTMLElement | undefined>
  ref: (element: HTMLElement | undefined) => void
} {
  const [element, setElement] = createSignal<HTMLElement | undefined>(undefined)

  const ref = (nextElement: HTMLElement | undefined): void => {
    setElement(nextElement)

    if (!nextElement) {
      return
    }

    onCleanup(() => {
      if (element() === nextElement) {
        setElement(undefined)
      }
    })
  }

  return { element, ref }
}

export function getOverlayTriggerAccessibility(
  element: HTMLElement | undefined,
  disabled: boolean,
): {
  ariaDisabled: 'true' | undefined
  disabled: boolean | undefined
  tabIndex: number | undefined
} {
  if (isNativeButtonElement(element)) {
    return { ariaDisabled: undefined, disabled, tabIndex: undefined }
  }

  return {
    ariaDisabled: disabled ? 'true' : undefined,
    disabled: undefined,
    tabIndex: disabled ? -1 : 0,
  }
}

export function validateOverlayTrigger(
  element: HTMLElement | undefined,
  overlayName: string,
): void {
  if (isHTMLElement(element)) {
    return
  }

  throw new Error(
    `${overlayName} trigger render prop must forward the provided props to a single HTMLElement root.`,
  )
}
