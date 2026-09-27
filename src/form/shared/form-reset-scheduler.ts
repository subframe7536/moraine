const scheduled = new WeakMap<Event, { controls: VoidFunction[]; forms: VoidFunction[] }>()

export function scheduleFormReset(
  event: Event,
  reset: VoidFunction,
  phase: 'control' | 'form',
): void {
  let callbacks = scheduled.get(event)
  if (!callbacks) {
    callbacks = { controls: [], forms: [] }
    scheduled.set(event, callbacks)
    const pending = callbacks
    queueMicrotask(() => {
      scheduled.delete(event)
      if (!event.defaultPrevented) {
        for (const callback of pending.controls) {
          callback()
        }
        for (const callback of pending.forms) {
          callback()
        }
      }
    })
  }
  callbacks[phase === 'control' ? 'controls' : 'forms'].push(reset)
}
