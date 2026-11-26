import { createEffect, createSignal, onSettled } from 'solid-js'
import type { Accessor } from 'solid-js'

import { attachEventListener } from '../../shared/event-listener'
/** Default locale when nothing else is set. SSR and the first client render use this tag. */
export const FALLBACK_LOCALE = 'en-US'

function readBrowserLocale(): string {
  const language =
    typeof navigator === 'undefined'
      ? undefined
      : navigator.language || (navigator as { userLanguage?: string }).userLanguage
  let locale = language || FALLBACK_LOCALE
  try {
    Intl.DateTimeFormat.supportedLocalesOf([locale])
  } catch {
    locale = FALLBACK_LOCALE
  }
  return locale
}

/**
 * Starts at `en-US` through SSR and hydration. After `onSettled` + `queueMicrotask`,
 * follows `navigator.language` and `languagechange` while `enabled` is true.
 */
export function createDetectedLocale(enabled: Accessor<boolean>): Accessor<string> {
  const [detected, setDetected] = createSignal(FALLBACK_LOCALE)
  const [ready, setReady] = createSignal(false)

  onSettled(() => {
    let active = true
    queueMicrotask(() => {
      if (active) {
        setReady(true)
      }
    })
    return () => {
      active = false
    }
  })

  const apply = (): void => {
    setDetected(readBrowserLocale())
  }

  createEffect(
    () => (enabled() ? (ready() ? 2 : 1) : 0),
    (state) => {
      if (state === 0) {
        setDetected(FALLBACK_LOCALE)
        return
      }
      if (state === 1 || typeof window === 'undefined') {
        return
      }

      apply()
      return attachEventListener(window, 'languagechange', apply)
    },
  )

  return detected
}
