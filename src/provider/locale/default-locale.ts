import { createEffect, createSignal, on, onMount } from 'solid-js'
import type { Accessor } from 'solid-js'

import { createEventListener } from '../../shared/event-listener'

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
 * Starts at `en-US` through SSR and hydration. After `onMount` + `queueMicrotask`,
 * follows `navigator.language` and `languagechange` while `enabled` is true.
 */
export function createDetectedLocale(enabled: Accessor<boolean>): Accessor<string> {
  const [detected, setDetected] = createSignal(FALLBACK_LOCALE)
  const [ready, setReady] = createSignal(false)

  onMount(() => {
    queueMicrotask(() => {
      setReady(true)
    })
  })

  createEffect(
    on([enabled, ready], ([isEnabled, isReady]) => {
      if (!isEnabled) {
        setDetected(FALLBACK_LOCALE)
        return
      }
      if (!isReady || typeof window === 'undefined') {
        return
      }

      const apply = (): void => {
        setDetected(readBrowserLocale())
      }
      apply()
      createEventListener(window, 'languagechange', apply)
    }),
  )

  return detected
}
