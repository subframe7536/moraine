import { createEffect, createMemo, createSignal, onFlush } from 'solid-js'
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
 * Starts at `en-US` through SSR and hydration. After hydration settles,
 * follows `navigator.language` and `languagechange` while `enabled` is true.
 */
export function createDetectedLocale(enabled: Accessor<boolean>): Accessor<string> {
  const [browserLocale, setBrowserLocale] = createSignal(FALLBACK_LOCALE)

  createEffect(enabled, (active) => {
    if (!active || typeof window === 'undefined') {
      return
    }

    let cancelled = false
    const apply = (): void => {
      if (!cancelled) {
        setBrowserLocale(readBrowserLocale())
      }
    }

    onFlush(apply)
    const detach = attachEventListener(window, 'languagechange', apply)
    return () => {
      cancelled = true
      detach()
    }
  })

  return createMemo(() => (enabled() ? browserLocale() : FALLBACK_LOCALE))
}
