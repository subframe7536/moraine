import { DelegatedEvents, delegateEvents, registerDelegatedContainer } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { createSignal, merge, omit, createRenderEffect } from 'solid-js'

import { attachEventListener } from './event-listener'
import type { ValidComponent } from './types'
import { callHandler, callRef, publishElement } from './utils'
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

interface ClickBridge {
  seq: number
  handler: (event: MouseEvent) => void
}

// One document-level dispatcher per owner document invokes click bridges in
// descending creation order: nested trigger components are created after their
// ancestors, so the innermost trigger's handler runs first and can preventDefault
// before an outer trigger toggles, regardless of reactive apply order.
const clickBridgeRegistries = new WeakMap<
  Document,
  { bridges: Array<ClickBridge>; release: VoidFunction }
>()
let clickBridgeSeq = 0

function attachClickBridge(document: Document, seq: number, handler: (event: MouseEvent) => void) {
  let registry = clickBridgeRegistries.get(document)
  if (!registry) {
    const bridges: Array<ClickBridge> = []
    registry = {
      bridges,
      release: attachEventListener(document, 'click', (event) => {
        const ordered = [...bridges].sort((a, b) => b.seq - a.seq)
        for (const bridge of ordered) {
          bridge.handler(event)
        }
      }),
    }
    clickBridgeRegistries.set(document, registry)
  }
  const bridge: ClickBridge = { seq, handler }
  registry.bridges.push(bridge)
  const active = registry
  return () => {
    const index = active.bridges.indexOf(bridge)
    if (index !== -1) {
      active.bridges.splice(index, 1)
    }
    if (active.bridges.length === 0) {
      active.release()
      clickBridgeRegistries.delete(document)
    }
  }
}

/** Tracks a polymorphic dynamic root and bridges events from custom and foreign-document roots. */
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
  const seq = ++clickBridgeSeq
  let boundProps: Record<string, unknown> | undefined

  if (options.registration) {
    const publish = publishElement(options.registration.element, options.registration.setElement)
    createRenderEffect(element, (node) => {
      if (!node) {
        return
      }
      return publish(node)
    })
  }

  createRenderEffect(
    () => {
      const root = element()
      if (!root) {
        return undefined
      }
      return {
        root,
        bridgeCustomClick: Boolean(options.bridgeClick && typeof options.tag() !== 'string'),
      }
    },
    (binding) => {
      if (!binding) {
        return
      }
      const { root, bridgeCustomClick } = binding
      let bridgeDocument: Document | undefined
      let releaseDocument: VoidFunction | undefined
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
        releaseDocument?.()
        bridgeDocument = root.ownerDocument
        // Let Solid dispatch the target's handlers before trigger behavior, including in iframes.
        delegateEvents(DELEGATED_EVENTS)
        registerDelegatedContainer(bridgeDocument)
        releaseDocument = bridgeCustomClick
          ? attachClickBridge(bridgeDocument, seq, bridgeClick)
          : undefined
      }
      registerDocument()
      // A root may be adopted after mounting. Register on its new document before bubbling.
      const releases = DELEGATED_EVENTS.map((name) =>
        attachEventListener(root, name as keyof HTMLElementEventMap, registerDocument, true),
      )
      return () => {
        releases.forEach((dispose) => dispose())
        releaseDocument?.()
      }
    },
  )

  function bind<T extends object>(
    props: T,
  ): Omit<T, 'ref'> & { ref: (element: HTMLElement) => void } {
    boundProps = props as Record<string, unknown>
    const attributes = omit(props, 'onClick' as keyof T)
    const binding = merge(attributes, {
      get onClick() {
        return options.bridgeClick && typeof options.tag() !== 'string'
          ? undefined
          : (props as Record<string, unknown>).onClick
      },
      ref(next: HTMLElement) {
        setElement(next)
        callRef(() => options.ref?.(), next)
      },
    }) as Omit<T, 'ref'> & { ref: (element: HTMLElement) => void }
    return binding
  }

  return { element, bind }
}
