import { onCleanup } from 'solid-js'

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

type EventListenerMap<TTarget extends EventTarget> = Partial<{
  [TType in EventTypeForTarget<TTarget>]: (event: EventMapForTarget<TTarget>[TType]) => void
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

  target.addEventListener(type, listener, options)

  return () => {
    target.removeEventListener(type, listener, options)
  }
}

export function attachEventListenerMap<TTarget extends EventTarget>(
  target: TTarget | null | undefined,
  listeners: EventListenerMap<TTarget>,
  options?: boolean | AddEventListenerOptions,
): VoidFunction
export function attachEventListenerMap(
  target: EventTarget | null | undefined,
  listeners: Record<string, ((event: Event) => void) | undefined>,
  options?: boolean | AddEventListenerOptions,
): VoidFunction {
  const cleanups: Array<VoidFunction> = []

  for (const [type, listener] of Object.entries(listeners)) {
    if (listener) {
      cleanups.push(attachEventListener(target, type, listener, options))
    }
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
): void {
  onCleanup(attachEventListener(target, type, listener, options))
}

export function createEventListenerMap<TTarget extends EventTarget>(
  target: TTarget | null | undefined,
  listeners: EventListenerMap<TTarget>,
  options?: boolean | AddEventListenerOptions,
): void {
  onCleanup(attachEventListenerMap(target, listeners, options))
}
