import { onCleanup, onMount } from 'solid-js'

export function useFormReset(
  getForm: () => HTMLFormElement | null | undefined,
  onReset: () => void,
): void {
  onMount(() => {
    const form = getForm()
    if (!form) {
      return
    }

    const handler = (event: Event): void => {
      queueMicrotask(() => {
        if (!event.defaultPrevented) {
          onReset()
        }
      })
    }
    form.addEventListener('reset', handler)
    onCleanup(() => form.removeEventListener('reset', handler))
  })
}
