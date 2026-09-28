import { onMount } from 'solid-js'

import { createEventListener } from '../../shared/event-listener'

import { scheduleFormReset } from './form-reset-scheduler.ts'

export function useFormReset(
  getForm: () => HTMLFormElement | null | undefined,
  onReset: () => void,
): void {
  onMount(() => {
    const form = getForm()
    if (form) {
      createEventListener(form, 'reset', (event) => {
        scheduleFormReset(event, onReset, 'control')
      })
    }
  })
}
