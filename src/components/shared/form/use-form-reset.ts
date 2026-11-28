import { onSettled } from 'solid-js'

import { attachEventListener } from '../../../shared/event-listener'

import { scheduleFormReset } from './form-reset-scheduler'
export function useFormReset(
  getForm: () => HTMLFormElement | null | undefined,
  onReset: () => void,
): void {
  onSettled(() => {
    const form = getForm()
    if (form) {
      return attachEventListener(form, 'reset', (event) => {
        scheduleFormReset(event, onReset, 'control')
      })
    }
  })
}
