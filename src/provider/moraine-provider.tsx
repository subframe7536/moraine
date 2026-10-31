import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'

import type { CnConfig } from '../theme/cn'
import { cn as defaultCn, createCn } from '../theme/cn'
import type { MoraineTheme } from '../theme/types'

import { createDetectedLocale } from './locale/default-locale'
import { resolveLocale } from './locale/locale-context'
import type { MoraineMessagesInput } from './locale/messages.types'
import { MoraineContextProvider, useMoraineContext } from './moraine-context'

export interface MoraineProviderProps {
  /** `undefined` inherits the parent Theme; a Theme replaces it; null clears inherited overrides. */
  theme?: MoraineTheme | null
  /** `undefined` inherits the parent merger; an object replaces it with Moraine defaults plus this config. */
  cnConfig?: CnConfig
  /** `undefined` inherits the parent locale. Shared application locale as a BCP 47 tag such as `en-US` or `zh-CN`. Without a provider, locale is `en-US`. */
  locale?: string
  /**
   * After hydration, follow `navigator.language` and `languagechange`.
   * Defaults to true on the root provider. Nested providers inherit the parent tag unless this is set.
   * SSR and the first client render stay `en-US`. Ignored when `locale` is set.
   * Prefer passing an explicit `locale` from a cookie or `Accept-Language` in production.
   * @default true
   */
  detectLocale?: boolean
  /** `undefined` inherits the parent direction; `null` clears it back to document / `<html dir>` detection; 'ltr' or 'rtl' replaces it. Controls Moraine component direction-sensitive behavior; does not set a dir attribute on arbitrary descendants. Set `dir` on `<html>` for layout. */
  dir?: 'ltr' | 'rtl' | null
  /** `undefined` inherits parent messages; a partial pack deep-merges over them. */
  messages?: MoraineMessagesInput
  /** Components that receive the theme, class merging, and locale rules. */
  children?: JSX.Element
}

/** Provides theme overrides and class merging rules to descendant components. */
export function MoraineProvider(props: MoraineProviderProps): JSX.Element {
  const parent = useMoraineContext()

  const theme = createMemo<MoraineTheme | null>(() =>
    props.theme === undefined ? (parent?.theme ?? null) : props.theme,
  )

  const cn = createMemo(() => {
    const config = props.cnConfig
    return config === undefined ? (parent?.cn ?? defaultCn) : createCn(config)
  })

  const shouldDetectLocale = (): boolean =>
    props.locale === undefined && (props.detectLocale ?? !parent)

  const detectedLocale = createDetectedLocale(shouldDetectLocale)

  const locale = createMemo(() => {
    const should = shouldDetectLocale()
    return resolveLocale(parent, {
      locale: props.locale,
      dir: props.dir,
      messages: props.messages,
      detectLocale: should,
      detectedLocale: should ? detectedLocale() : undefined,
    })
  })

  return (
    <MoraineContextProvider
      value={{
        get theme() {
          return theme()
        },
        get cn() {
          return cn()
        },
        get locale() {
          return locale().locale
        },
        get dir() {
          return locale().dir
        },
        get messages() {
          return locale().messages
        },
      }}
    >
      {props.children}
    </MoraineContextProvider>
  )
}
