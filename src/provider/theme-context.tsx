import type { Accessor } from 'solid-js'

import { createContextProvider } from '../shared/create-context-provider.tsx'
import type { RecipeDefinition, ResolvedRecipe } from '../theme/style/recipe'

export interface ThemeResolver {
  resolve: <S extends object, V>(
    recipe: RecipeDefinition<S, V>,
  ) => RecipeDefinition<S, V> | ResolvedRecipe<S, V>
}

export const defaultRecipeResolver: ThemeResolver = Object.freeze({
  resolve: <S extends object, V>(recipe: RecipeDefinition<S, V>) => recipe,
})

export const [MoraineThemeProvider, useThemeResolver] = createContextProvider<
  Accessor<ThemeResolver>
>('MoraineTheme', () => defaultRecipeResolver)
