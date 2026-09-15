import { onMount } from 'solid-js'

import { useEventListener } from '../../shared/use-event-listener'

export function useFormReset(
  getForm: () => HTMLFormElement | null | undefined,
  onReset: () => void,
): void {
  onMount(() => {
    const form = getForm()
    if (form) {
      useEventListener(form, 'reset', (event) => {
        queueMicrotask(() => {
          if (!event.defaultPrevented) {
            onReset()
          }
        })
      })
    }
  })
}
