import type { Accessor } from 'solid-js'
import { createContext, useContext } from 'solid-js'

import type { RecipeDefinition, ResolvedRecipe } from '../theme/style/recipe'

export interface ThemeResolver {
  resolve: <S extends object, V>(
    recipe: RecipeDefinition<S, V>,
  ) => RecipeDefinition<S, V> | ResolvedRecipe<S, V>
}

export const defaultRecipeResolver: ThemeResolver = Object.freeze({
  resolve: <S extends object, V>(recipe: RecipeDefinition<S, V>) => recipe,
})

export const MoraineThemeContext = createContext<Accessor<ThemeResolver>>(
  () => defaultRecipeResolver,
)

export function useThemeResolver(): Accessor<ThemeResolver> {
  return useContext(MoraineThemeContext)
}
