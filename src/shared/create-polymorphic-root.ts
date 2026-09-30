import type { Accessor } from 'solid-js'
import { createSignal, mergeProps, onCleanup, onMount, splitProps, untrack } from 'solid-js'
import { delegateEvents } from 'solid-js/web'

import { attachEventListener } from './event-listener'
import type { ValidComponent } from './types'
import { callHandler, callRef } from './utils'

const EVENT_KEYS = [
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
] as const

/** Tracks a Dynamic root and bridges events from custom and foreign-document roots. */
export function createPolymorphicRoot(options: {
  tag: Accessor<ValidComponent>
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
    const handlers: Record<string, (event: Event) => void> = {}
    const handled = new WeakSet<Event>()
    for (const key of EVENT_KEYS) {
      handlers[key] = (event) => {
        if (!current || handled.has(event)) {
          return
        }
        handled.add(event)
        callHandler(event, (props as Record<string, unknown>)[key])
      }
    }

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
      callRef(consumerRef, next)

      const custom = untrack(() => typeof options.tag() !== 'string')
      let bridgeDocument: Document | undefined
      let releaseDocument: VoidFunction = () => {}
      const bridgeClick = (event: MouseEvent) => {
        const target = event.target as Node | null
        if (!target || !next.contains(target)) {
          return
        }
        const descriptor = Object.getOwnPropertyDescriptor(event, 'currentTarget')
        Object.defineProperty(event, 'currentTarget', { configurable: true, value: next })
        try {
          handlers.onClick!(event)
        } finally {
          if (descriptor) {
            Object.defineProperty(event, 'currentTarget', descriptor)
          } else {
            delete (event as { currentTarget?: EventTarget | null }).currentTarget
          }
        }
      }
      const registerDocument = () => {
        if (!custom || bridgeDocument === next.ownerDocument) {
          return
        }
        releaseDocument()
        bridgeDocument = next.ownerDocument
        delegateEvents(['click'], bridgeDocument)
        releaseDocument = attachEventListener(bridgeDocument, 'click', bridgeClick)
      }
      registerDocument()
      onMount(registerDocument)
      const releases = EVENT_KEYS.map((key) =>
        attachEventListener(
          next,
          key.slice(2).toLowerCase() as keyof HTMLElementEventMap,
          (event) => {
            registerDocument()
            if (next.ownerDocument !== document && (!custom || key !== 'onClick')) {
              handlers[key]!(event)
            }
          },
        ),
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
    }

    onCleanup(() => ref(undefined))
    const [, attributes] = splitProps(props, ['onClick' as keyof T])
    const { onClick: _click, ...forwardedHandlers } = handlers
    const binding = mergeProps(attributes, forwardedHandlers, {
      get onClick() {
        return typeof options.tag() === 'string' ? handlers.onClick : undefined
      },
      ref,
    }) as Omit<T, 'ref'> & { ref: (element: HTMLElement | undefined) => void }
    return binding
  }

  return { element, bind }
}
