import type { Accessor } from 'solid-js'
import { createEffect, createSignal, on } from 'solid-js'

interface FormValidationState {
  isSubmitting: boolean
  isValidating: boolean
}

interface InvalidFocusEntry {
  element: HTMLElement | undefined
  invalid: Accessor<boolean>
  order: number
}

const DOCUMENT_POSITION_DISCONNECTED = 1
const DOCUMENT_POSITION_PRECEDING = 2
const DOCUMENT_POSITION_FOLLOWING = 4

export interface InvalidFocusRegistration {
  setControl: (element: HTMLElement | undefined) => void
  unregister: () => void
}

export interface InvalidFocusManager {
  attach: (form: FormValidationState) => void
  register: (invalid: Accessor<boolean>) => InvalidFocusRegistration
  requestFocus: () => void
}

function isUsableControl(element: HTMLElement | undefined): element is HTMLElement {
  return Boolean(
    element &&
    element.isConnected &&
    element.tabIndex >= 0 &&
    element.getAttribute('aria-hidden') !== 'true' &&
    !element.matches(':disabled') &&
    element.getAttribute('aria-disabled') !== 'true',
  )
}

function compareControls(first: InvalidFocusEntry, second: InvalidFocusEntry): number {
  const firstElement = first.element!
  const secondElement = second.element!
  const position = firstElement.compareDocumentPosition(secondElement)

  if (position & DOCUMENT_POSITION_DISCONNECTED) {
    return first.order - second.order
  }
  if (position & DOCUMENT_POSITION_FOLLOWING) {
    return -1
  }
  if (position & DOCUMENT_POSITION_PRECEDING) {
    return 1
  }

  return first.order - second.order
}

function focusControl(element: HTMLElement): boolean {
  element.focus()
  return (element.getRootNode() as { activeElement?: Element | null }).activeElement === element
}

/** Coordinates invalid focus without depending on Formisch's field-tree traversal order. */
export function createInvalidFocusManager(): InvalidFocusManager {
  const [entries, setEntries] = createSignal<InvalidFocusEntry[]>([])
  const [pending, setPending] = createSignal(false)
  let nextOrder = 0

  function register(invalid: Accessor<boolean>): InvalidFocusRegistration {
    const entry: InvalidFocusEntry = {
      element: undefined,
      invalid,
      order: nextOrder,
    }
    nextOrder += 1
    setEntries((previous) => [...previous, entry])

    return {
      setControl(element) {
        entry.element = element
        setEntries((previous) => [...previous])
      },
      unregister() {
        setEntries((previous) => previous.filter((candidate) => candidate !== entry))
      },
    }
  }

  function requestFocus(): void {
    queueMicrotask(() => setPending(true))
  }

  function attach(form: FormValidationState): void {
    createEffect(
      on(
        [pending, () => form.isValidating, () => form.isSubmitting, entries],
        ([shouldFocus, validating, submitting, registeredControls]) => {
          if (!shouldFocus || validating) {
            return
          }

          const controls = registeredControls
            .filter((entry) => entry.invalid() && isUsableControl(entry.element))
            .sort(compareControls)

          for (const control of controls) {
            if (focusControl(control.element!)) {
              setPending(false)
              return
            }
          }

          if (!submitting) {
            setPending(false)
          }
        },
      ),
    )
  }

  return { attach, register, requestFocus }
}
