import type { JSX } from 'solid-js'
import { createMemo, useContext } from 'solid-js'

import { getThemeRecipeLayers } from '../theme/create-theme'
~import type { CnConfig } from '../theme/style/cn'
import { createCn } from '../theme/style/cn'
import type { RecipeDefinition, ResolvedRecipe } from '../theme/style/recipe'
import type { MoraineTheme } from '../theme/types'

import { MoraineCnContext } from './cn-context'
import { defaultRecipeResolver, MoraineThemeContext } from './theme-context'
import type { ThemeResolver } from './theme-context'

export interface MoraineProviderProps {
  /** Undefined inherits the parent Theme; a Theme replaces it; null clears inherited overrides. */
  theme?: MoraineTheme | null
  /** Undefined inherits the parent merger; an object replaces it with Moraine defaults plus this config. */
  cnConfig?: CnConfig
  /** Components that receive the theme and class merging rules. */
  children?: JSX.Element
}

/** Provides theme overrides and class merging rules to descendant components. */
export function MoraineProvider(props: MoraineProviderProps): JSX.Element {
  const parentResolver = useContext(MoraineThemeContext)
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

  const parentCn = useContext(MoraineCnContext)
  const currentCn = createMemo(() => {
    const config = props.cnConfig
    return config === undefined ? parentCn() : createCn(config)
  })

  return (
    <MoraineThemeContext.Provider value={currentResolver}>
      <MoraineCnContext.Provider value={currentCn}>{props.children}</MoraineCnContext.Provider>
    </MoraineThemeContext.Provider>
  )
}
