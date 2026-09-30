import type { Accessor } from 'solid-js'
import { createSignal, mergeProps, onCleanup, onMount, splitProps, untrack } from 'solid-js'
import { DelegatedEvents, delegateEvents } from 'solid-js/web'

import { attachEventListener } from './event-listener'
import type { ValidComponent } from './types'
import { callHandler, callRef } from './utils'

const DELEGATED_EVENTS = [
  'onClick',
  'onKeyDown',
  'onKeyUp',
  'onBlur',
  'onFocus',
  'onContextMenu',
  'onPointerDown',
  'onPointerMove',
  'onPointerUp',
  'onPointerCancel',
]
  .map((key) => key.slice(2).toLowerCase())
  .filter((name) => DelegatedEvents.has(name))

/** Tracks a Dynamic root and bridges events from custom and foreign-document roots. */
export function createPolymorphicRoot(options: {
  tag: Accessor<ValidComponent>
  /** Run custom trigger clicks after the target's own handler, allowing it to cancel activation. */
  bridgeClick?: boolean
  ref?: Accessor<unknown>
  registration?: {
    element: Accessor<HTMLElement | undefined>
    ref: (element: HTMLElement | undefined) => void
  }
}) {
  const [element, setElement] = createSignal<HTMLElement>()
  let current: HTMLElement | undefined
  let release: VoidFunction = () => {}

  function bind<T extends object>(
    props: T,
  ): Omit<T, 'ref'> & { ref: (element: HTMLElement | undefined) => void } {
    function ref(next: HTMLElement | undefined): void {
      if (next === current) {
        return
      }
      release()
      release = () => {}
      current = next
      setElement(next)
      const consumerRef = untrack(() => options.ref?.())
      if (!next) {
        return
      }
      options.registration?.ref(next)

      const bridgeCustomClick = untrack(
        () => options.bridgeClick && typeof options.tag() !== 'string',
      )
      let bridgeDocument: Document | undefined
      let releaseDocument: VoidFunction = () => {}
      const bridgeClick = (event: MouseEvent) => {
        if (current !== next || !event.composedPath().includes(next)) {
          return
        }
        const descriptor = Object.getOwnPropertyDescriptor(event, 'currentTarget')
        Object.defineProperty(event, 'currentTarget', { configurable: true, value: next })
        try {
          callHandler(event, (props as Record<string, unknown>).onClick)
        } finally {
          if (descriptor) {
            Object.defineProperty(event, 'currentTarget', descriptor)
          } else {
            delete (event as { currentTarget?: EventTarget | null }).currentTarget
          }
        }
      }
      const registerDocument = () => {
        if (current !== next || bridgeDocument === next.ownerDocument) {
          return
        }
        releaseDocument()
        bridgeDocument = next.ownerDocument
        // Let Solid dispatch the target's handlers before trigger behavior, including in iframes.
        delegateEvents(DELEGATED_EVENTS, bridgeDocument)
        releaseDocument = bridgeCustomClick
          ? attachEventListener(bridgeDocument, 'click', bridgeClick)
          : () => {}
      }
      registerDocument()
      onMount(registerDocument)
      // A root may be adopted after mounting. Register on its new document before bubbling.
      const releases = DELEGATED_EVENTS.map((name) =>
        attachEventListener(next, name as keyof HTMLElementEventMap, registerDocument, true),
      )
      release = () => {
        releases.forEach((dispose) => dispose())
        releaseDocument()
        if (untrack(() => options.registration?.element()) === next) {
          options.registration?.ref(undefined)
        }
        callRef(consumerRef, undefined)
      }
      onCleanup(() => {
        if (current === next) {
          ref(undefined)
        }
      })
      // Register inner trigger behavior before an enclosing root receives the same ref.
      callRef(consumerRef, next)
    }

    onCleanup(() => ref(undefined))
    const [, attributes] = splitProps(props, ['onClick' as keyof T])
    const binding = mergeProps(attributes, {
      get onClick() {
        return options.bridgeClick && typeof options.tag() !== 'string'
          ? undefined
          : (props as Record<string, unknown>).onClick
      },
      ref,
    }) as Omit<T, 'ref'> & { ref: (element: HTMLElement | undefined) => void }
    return binding
  }

  return { element, bind }
}
