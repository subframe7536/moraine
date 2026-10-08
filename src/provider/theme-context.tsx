import type { Accessor } from 'solid-js'

import { createContextProvider } from '../shared/create-context-provider'
import type { RecipeDefinition, ResolvedRecipe } from '../theme/recipe'

export interface ThemeResolver {
  resolve: <S extends object, V>(
    recipe: RecipeDefinition<S, V>,
  ) => RecipeDefinition<S, V> | ResolvedRecipe<S, V>
}

export const defaultRecipeResolver: ThemeResolver = /* @__PURE__ */ Object.freeze({
  resolve: <S extends object, V>(recipe: RecipeDefinition<S, V>) => recipe,
})

export const [MoraineThemeProvider, useThemeResolver] = /* @__PURE__ */ createContextProvider<
  Accessor<ThemeResolver>
>('MoraineTheme', () => defaultRecipeResolver)
