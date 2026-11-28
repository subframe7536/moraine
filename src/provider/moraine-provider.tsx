import type { JSX } from '@solidjs/web'
import { createMemo } from 'solid-js'

import type { CnConfig } from '../theme/cn'
import { cn as defaultCn, createCn } from '../theme/cn'
import type { MoraineTheme } from '../theme/types'

import { createDetectedLocale } from './locale/default-locale'
import { resolveLocale } from './locale/locale-context'
import type { MoraineMessagesInput } from './locale/messages.types'
import { MoraineContextProvider, useMoraineContext } from './moraine-context'
export interface MoraineProviderProps {
  /**
   * Theme created with `defineTheme()` whose recipe overrides and default variants apply to every descendant component.
   * `undefined` inherits the parent provider's theme, a theme replaces it (it is not merged with the parent's), and `null` clears inherited overrides so only the built-in recipes apply.
   * Instance `classes`/`styles`/`class`/`style` props still win over the theme.
   */
  theme?: MoraineTheme | null
  /**
   * Configuration for the class merger that resolves conflicting utility classes (for example `p-2 p-4` becomes `p-4`) in every descendant component and in `useCn()`.
   * `undefined` inherits the parent's merger; an object replaces it with the Moraine defaults plus this config, never the parent's config, and `{}` restores the defaults.
   * Use it to teach the merger custom utility groups.
   * @example
   * ```tsx
   * import { MoraineProvider, Button } from 'moraine'
   *
   * <MoraineProvider cnConfig={{ extend: { classGroups: { density: ['density-roomy', 'density-compact'] } } }}>
   *   <Button class="density-roomy density-compact">Save</Button>
   * </MoraineProvider>
   * ```
   */
  cnConfig?: CnConfig
  /**
   * Application locale as a BCP 47 tag such as `en-US` or `zh-CN`, used by locale-aware components for number formatting and text collation (typeahead and search).
   * `undefined` inherits the parent locale. Without any provider the locale is `en-US`.
   * Setting it disables `detectLocale`.
   */
  locale?: string
  /**
   * After hydration, follow `navigator.language` and the `languagechange` event.
   * Defaults to `true` on the root provider; a nested provider inherits the parent locale unless this is set.
   * SSR and the first client render always use `en-US`, so detection never causes a hydration mismatch. Ignored when `locale` is set.
   * Prefer passing an explicit `locale` from a cookie or `Accept-Language` in production.
   * @default true
   */
  detectLocale?: boolean
  /**
   * Text direction for direction-sensitive behavior of Moraine components, such as keyboard navigation, popup placement, and slider or tab arrow keys.
   * `undefined` inherits the parent direction, `null` clears it back to detection from the document (`<html dir>`), and `'ltr'` or `'rtl'` replaces it.
   * It does not set a `dir` attribute on descendants; set `dir` on `<html>` for layout.
   */
  dir?: 'ltr' | 'rtl' | null
  /**
   * Partial pack of translated component strings (accessible labels, status text), keyed by component and then message name.
   * `undefined` inherits the parent messages; a partial pack is deep-merged over them, so you only list the messages you change. Message values are strings or functions receiving a context object, matching the defaults of that component.
   * @example
   * ```tsx
   * import { MoraineProvider, Pagination } from 'moraine'
   *
   * <MoraineProvider locale="zh-CN" messages={{ pagination: { label: '分页' } }}>
   *   <Pagination total={100} />
   * </MoraineProvider>
   * ```
   */
  messages?: MoraineMessagesInput
  /** Components that receive the theme, class merging, and locale rules. Rendered without adding any DOM element. */
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
