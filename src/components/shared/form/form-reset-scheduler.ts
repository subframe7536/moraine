import { flush } from 'solid-js'

const scheduled = new WeakMap<
  Event,
  { controls: Array<VoidFunction>; forms: Array<VoidFunction> }
>()

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
        // Writes stage outside a flush scope in Solid 2 — unflushed control resets would
        // drop `setFormValue` while direct DOM writes (such as `input.checked`) still land.
        flush(() => {
          for (const callback of pending.controls) {
            callback()
          }
          for (const callback of pending.forms) {
            callback()
          }
        })
      }
    })
  }
  callbacks[phase === 'control' ? 'controls' : 'forms'].push(reset)
}
