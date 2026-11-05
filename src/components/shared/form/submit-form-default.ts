/**
 * The button a browser uses for implicit form submission: the first `button` or
 * `input` with `type="submit"` in `form.elements` (which includes controls associated
 * through the `form` attribute).
 */
export function getDefaultFormSubmitter(
  form: HTMLFormElement,
): HTMLButtonElement | HTMLInputElement | undefined {
  for (const candidate of form.elements) {
    const tagName = candidate.tagName
    if (tagName === 'BUTTON' || tagName === 'INPUT') {
      const button = candidate as HTMLButtonElement | HTMLInputElement
      if (button.type === 'submit') {
        return button
      }
    }
  }
  return undefined
}

/**
 * Performs implicit form submission for a non-native control: clicks the form's
 * default submitter, or calls `requestSubmit()` when the form has none. `formOwner`
 * may be a form-associated element (such as a hidden input) whose `.form` also honors
 * an owner supplied through the `form` attribute.
 */
export function submitFormDefault(
  control: HTMLElement,
  formOwner?: { form: HTMLFormElement | null },
): void {
  const form = formOwner?.form ?? (control as HTMLButtonElement).form ?? control.closest('form')
  if (!form) {
    return
  }

  const submitter = getDefaultFormSubmitter(form)
  if (submitter) {
    submitter.click()
  } else {
    form.requestSubmit()
  }
}
