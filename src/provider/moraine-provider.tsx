import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'

import type { CnConfig } from '../theme/cn'
import { createCn } from '../theme/cn'
import { getThemeRecipeLayers } from '../theme/create-theme'
import type { RecipeDefinition, ResolvedRecipe } from '../theme/recipe'
import type { MoraineTheme } from '../theme/types'

import { MoraineCnProvider, useCnAccessor } from './cn-context'
import { MoraineLocaleProvider, resolveLocale, useLocaleAccessor } from './locale/locale-context'
import type { MoraineMessagesInput } from './locale/messages.types'
import { defaultRecipeResolver, MoraineThemeProvider, useThemeResolver } from './theme-context'
import type { ThemeResolver } from './theme-context'

export interface MoraineProviderProps {
  /** Undefined inherits the parent Theme; a Theme replaces it; null clears inherited overrides. */
  theme?: MoraineTheme | null
  /** Undefined inherits the parent merger; an object replaces it with Moraine defaults plus this config. */
  cnConfig?: CnConfig
  /** Undefined inherits the parent locale. Shared application locale as a BCP 47 tag such as `en-US` or `zh-CN`. Without a provider, uses the browser language; SSR fallback is `en-US`. */
  locale?: string
  /** Undefined inherits the parent direction; null clears it back to document / `<html dir>` detection; 'ltr' or 'rtl' replaces it. Controls Moraine component direction-sensitive behavior; does not set a dir attribute on arbitrary descendants. Set `dir` on `<html>` for layout. */
  dir?: 'ltr' | 'rtl' | null
  /** Undefined inherits parent messages; a partial pack deep-merges over them. */
  messages?: MoraineMessagesInput
  /** Components that receive the theme, class merging, and locale rules. */
  children?: JSX.Element
}

/** Provides theme overrides and class merging rules to descendant components. */
export function MoraineProvider(props: MoraineProviderProps): JSX.Element {
  const parentResolver = useThemeResolver()
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

  const currentResolver = createMemo<ThemeResolver>(() => {
    const theme = props.theme
    if (theme === undefined) {
      return parentResolver()
    }
    if (theme === null) {
      return defaultRecipeResolver
    }
    return resolverFor(theme)
  })

  const parentCn = useCnAccessor()
  const currentCn = createMemo(() => {
    const config = props.cnConfig
    return config === undefined ? parentCn() : createCn(config)
  })

  const parentLocale = useLocaleAccessor()
  const currentLocale = createMemo(() =>
    resolveLocale(parentLocale(), {
      locale: props.locale,
      dir: props.dir,
      messages: props.messages,
    }),
  )

  return (
    <MoraineThemeProvider value={currentResolver}>
      <MoraineCnProvider value={currentCn}>
        <MoraineLocaleProvider value={currentLocale}>{props.children}</MoraineLocaleProvider>
      </MoraineCnProvider>
    </MoraineThemeProvider>
  )
}
