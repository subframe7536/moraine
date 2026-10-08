import { createSignal } from 'solid-js'
import { isServer } from 'solid-js/web'

/** SSR and invalid-tag fallback. Matches Kobalte's server locale. */
export const FALLBACK_LOCALE = 'en-US'

const [localeEpoch, setLocaleEpoch] = createSignal(0)

let languageChangeBound = false

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

function bindLanguageChange(): void {
  if (languageChangeBound || isServer || typeof window === 'undefined') {
    return
  }
  languageChangeBound = true
  window.addEventListener('languagechange', () => {
    setLocaleEpoch((epoch) => epoch + 1)
  })
}

/** Browser language on the client; `en-US` during SSR. */
export function getDefaultLocaleTag(): string {
  if (isServer) {
    return FALLBACK_LOCALE
  }
  bindLanguageChange()
  localeEpoch()
  return readBrowserLocale()
}
