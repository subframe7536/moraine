import { getOwner, onCleanup } from 'solid-js'

import { settle } from './utils'
type EventMapForTarget<TTarget extends EventTarget> = TTarget extends Window
  ? WindowEventMap
  : TTarget extends Document
    ? DocumentEventMap
    : TTarget extends MediaQueryList
      ? MediaQueryListEventMap
      : TTarget extends HTMLElement
        ? HTMLElementEventMap
        : TTarget extends SVGElement
          ? SVGElementEventMap
          : TTarget extends Element
            ? ElementEventMap
            : Record<string, Event>

type EventTypeForTarget<TTarget extends EventTarget> = Extract<
  keyof EventMapForTarget<TTarget>,
  string
>

export type EventListenerEntry<TEvent = Event> =
  | ((event: TEvent) => void)
  | readonly [listener: (event: TEvent) => void, options?: boolean | AddEventListenerOptions]

export type EventListenerMap<TTarget extends EventTarget> = Partial<{
  [TType in EventTypeForTarget<TTarget>]: EventListenerEntry<EventMapForTarget<TTarget>[TType]>
}>

export function attachEventListener<
  TTarget extends EventTarget,
  TType extends EventTypeForTarget<TTarget>,
>(
  target: TTarget | null | undefined,
  type: TType,
  listener: (event: EventMapForTarget<TTarget>[TType]) => void,
  options?: boolean | AddEventListenerOptions,
): VoidFunction
export function attachEventListener(
  target: EventTarget | null | undefined,
  type: string,
  listener: (event: Event) => void,
  options?: boolean | AddEventListenerOptions,
): VoidFunction {
  if (!target) {
    return () => {}
  }

  const settled = (event: Event) => {
    settle(() => listener(event))
  }

  target.addEventListener(type, settled, options)

  return () => {
    target.removeEventListener(type, settled, options)
  }
}

export function attachEventListenerMap<TTarget extends EventTarget>(
  target: TTarget | null | undefined,
  listeners: EventListenerMap<TTarget>,
  options?: boolean | AddEventListenerOptions,
): VoidFunction
export function attachEventListenerMap(
  target: EventTarget | null | undefined,
  listeners: Record<string, EventListenerEntry | undefined>,
  options?: boolean | AddEventListenerOptions,
): VoidFunction {
  if (!target) {
    return () => {}
  }

  const cleanups: Array<VoidFunction> = []

  for (const [type, entry] of Object.entries(listeners)) {
    if (!entry) {
      continue
    }
    const [listener, itemOptions] = Array.isArray(entry) ? entry : [entry, undefined]
    cleanups.push(
      attachEventListener(
        target,
        type,
        listener as (event: Event) => void,
        itemOptions !== undefined ? itemOptions : options,
      ),
    )
  }

  return () => {
    for (const cleanup of cleanups) {
      cleanup()
    }
  }
}

export function createEventListener<
  TTarget extends EventTarget,
  TType extends EventTypeForTarget<TTarget>,
>(
  target: TTarget | null | undefined,
  type: TType,
  listener: (event: EventMapForTarget<TTarget>[TType]) => void,
  options?: boolean | AddEventListenerOptions,
): VoidFunction {
  const detach = attachEventListener(target, type, listener, options)
  // Effect callbacks and element binds run ownerless in Solid 2; only scopes
  // with an owner get automatic cleanup — callers there return `detach`.
  if (getOwner() !== null) {
    onCleanup(detach)
  }
  return detach
}

export function createEventListenerMap<TTarget extends EventTarget>(
  target: TTarget | null | undefined,
  listeners: EventListenerMap<TTarget>,
  options?: boolean | AddEventListenerOptions,
): VoidFunction {
  const detach = attachEventListenerMap(target, listeners, options)
  if (getOwner() !== null) {
    onCleanup(detach)
  }
  return detach
}
