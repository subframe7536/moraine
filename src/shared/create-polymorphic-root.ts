import type { Accessor } from 'solid-js'
import { createSignal, mergeProps, splitProps, untrack } from 'solid-js'
import { DelegatedEvents, delegateEvents } from 'solid-js/web'

import { bindElement, publishElement } from './element-binding'
import { attachEventListener } from './event-listener'
import type { ValidComponent } from './types'
import { callHandler, callRef } from './utils'

const DELEGATED_EVENTS = [
  'click',
  'keydown',
  'keyup',
  'blur',
  'focus',
  'contextmenu',
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
].filter((name) => DelegatedEvents.has(name))

/** Tracks a Dynamic root and bridges events from custom and foreign-document roots. */
export function createPolymorphicRoot(options: {
  tag: Accessor<ValidComponent>
  /** Run custom trigger clicks after the target's own handler, allowing it to cancel activation. */
  bridgeClick?: boolean
  ref?: Accessor<unknown>
  /** Publishes the root to a longer-lived signal, such as an overlay trigger in its context. */
  registration?: {
    element: Accessor<HTMLElement | undefined>
    setElement: (element: HTMLElement | undefined) => void
  }
}) {
  const [element, setElement] = createSignal<HTMLElement>()
  let boundProps: Record<string, unknown> | undefined

  if (options.registration) {
    bindElement(
      element,
      publishElement(options.registration.element, options.registration.setElement),
    )
  }

  bindElement(element, (root) => {
    const bridgeCustomClick = options.bridgeClick && typeof options.tag() !== 'string'
    let bridgeDocument: Document | undefined
    let releaseDocument: VoidFunction = () => {}
    const bridgeClick = (event: MouseEvent) => {
      // A custom root can unmount its element without telling this root; ignore it once detached.
      if (element() !== root || !root.isConnected || !event.composedPath().includes(root)) {
        return
      }
      const descriptor = Object.getOwnPropertyDescriptor(event, 'currentTarget')
      Object.defineProperty(event, 'currentTarget', { configurable: true, value: root })
      try {
        callHandler(event, boundProps?.onClick)
      } finally {
        if (descriptor) {
          Object.defineProperty(event, 'currentTarget', descriptor)
        } else {
          delete (event as { currentTarget?: EventTarget | null }).currentTarget
        }
      }
    }
    const registerDocument = () => {
      if (bridgeDocument === root.ownerDocument) {
        return
      }
      releaseDocument()
      bridgeDocument = root.ownerDocument
      // Let Solid dispatch the target's handlers before trigger behavior, including in iframes.
      delegateEvents(DELEGATED_EVENTS, bridgeDocument)
      releaseDocument = bridgeCustomClick
        ? attachEventListener(bridgeDocument, 'click', bridgeClick)
        : () => {}
    }
    registerDocument()
    // A root may be adopted after mounting. Register on its new document before bubbling.
    const releases = DELEGATED_EVENTS.map((name) =>
      attachEventListener(root, name as keyof HTMLElementEventMap, registerDocument, true),
    )
    return () => {
      releases.forEach((dispose) => dispose())
      releaseDocument()
    }
  })

  function bind<T extends object>(
    props: T,
  ): Omit<T, 'ref'> & { ref: (element: HTMLElement) => void } {
    boundProps = props as Record<string, unknown>
    const [, attributes] = splitProps(props, ['onClick' as keyof T])
    const binding = mergeProps(attributes, {
      get onClick() {
        return options.bridgeClick && typeof options.tag() !== 'string'
          ? undefined
          : (props as Record<string, unknown>).onClick
      },
      ref(next: HTMLElement) {
        setElement(next)
        callRef(
          untrack(() => options.ref?.()),
          next,
        )
      },
    }) as Omit<T, 'ref'> & { ref: (element: HTMLElement) => void }
    return binding
  }

  return { element, bind }
}
