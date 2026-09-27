import { onMount } from 'solid-js'

import { useEventListener } from '../../shared/use-event-listener'

import { scheduleFormReset } from './form-reset-scheduler.ts'

export function useFormReset(
  getForm: () => HTMLFormElement | null | undefined,
  onReset: () => void,
): void {
  onMount(() => {
    const form = getForm()
    if (form) {
      useEventListener(form, 'reset', (event) => {
        scheduleFormReset(event, onReset, 'control')
      })
    }
  })
}
