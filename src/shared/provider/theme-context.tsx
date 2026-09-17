import type { Accessor } from 'solid-js'
import { createContext, useContext } from 'solid-js'

import type { RecipeDefinition, ResolvedRecipe } from '../style/recipe'

export interface ThemeResolver {
  resolve: <Key extends string, S extends object, V>(
    recipe: RecipeDefinition<Key, S, V>,
  ) => RecipeDefinition<Key, S, V> | ResolvedRecipe<Key, S, V>
}

export const defaultRecipeResolver: ThemeResolver = Object.freeze({
  resolve: <Key extends string, S extends object, V>(recipe: RecipeDefinition<Key, S, V>) => recipe,
})

export const MoraineThemeContext = createContext<Accessor<ThemeResolver>>(
  () => defaultRecipeResolver,
)

export function useThemeResolver(): Accessor<ThemeResolver> {
  return useContext(MoraineThemeContext)
}
