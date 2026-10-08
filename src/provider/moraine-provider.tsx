import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'

import type { CnConfig } from '../theme/cn'
import { createCn } from '../theme/cn'
import { getThemeRecipeLayers } from '../theme/create-theme'
import type { RecipeDefinition, ResolvedRecipe } from '../theme/recipe'
import type { MoraineTheme } from '../theme/types'

import { createDetectedLocale } from './locale/default-locale'
import { resolveLocale } from './locale/locale-context'
import type { MoraineMessagesInput } from './locale/messages.types'
import { MoraineContextProvider, useMoraineParent } from './moraine-context'
import { defaultRecipeResolver } from './theme-context'
import type { ThemeResolver } from './theme-context'

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
  const { parent, provided } = useMoraineParent()
  const cache = new WeakMap<MoraineTheme, WeakMap<RecipeDefinition, ResolvedRecipe>>()

  const resolverFor = (theme: MoraineTheme): ThemeResolver => ({
    resolve<S extends object, V>(recipe: RecipeDefinition<S, V>) {
      let themeCache = cache.get(theme)
      if (!themeCache) {
        themeCache = new WeakMap()
        cache.set(theme, themeCache)
      }
      const cached = themeCache.get(recipe) as ResolvedRecipe<S, V> | undefined
      if (cached) {
        return cached
      }

      const overrides = getThemeRecipeLayers<S, V>(theme, recipe.key)
      if (overrides.length === 0) {
        return recipe
      }

      const resolved = Object.freeze({
        definition: recipe,
        layers: Object.freeze([recipe.config, ...overrides]),
      }) as ResolvedRecipe<S, V>
      themeCache.set(recipe, resolved)
      return resolved
    },
  })

  const resolver = createMemo<ThemeResolver>(() => {
    const theme = props.theme
    if (theme === undefined) {
      return parent.resolver
    }
    if (theme === null) {
      return defaultRecipeResolver
    }
    return resolverFor(theme)
  })

  const cn = createMemo(() => {
    const config = props.cnConfig
    return config === undefined ? parent.cn : createCn(config)
  })

  const shouldDetectLocale = (): boolean =>
    props.locale === undefined && (props.detectLocale ?? !provided)

  const detectedLocale = createDetectedLocale(shouldDetectLocale)

  const locale = createMemo(() => {
    const should = shouldDetectLocale()
    return resolveLocale(parent.locale, {
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
        get resolver() {
          return resolver()
        },
        get cn() {
          return cn()
        },
        get locale() {
          return locale()
        },
      }}
    >
      {props.children}
    </MoraineContextProvider>
  )
}
