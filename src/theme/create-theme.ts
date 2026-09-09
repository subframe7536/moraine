import { slotRecipe } from '../shared/style/recipe.ts'
import type { ComponentRecipeConfig } from '../shared/style/recipe.ts'

import { THEME_LAYERS } from './types.ts'
import type {
  CompiledComponentRecipe,
  CreateThemeOptions,
  MoraineTheme,
  ThemeName,
} from './types.ts'

/** Compiles supplied component entries and appends them to the parent layers. */
export function createTheme(options: CreateThemeOptions = {}): MoraineTheme {
  const own: Partial<Record<ThemeName, CompiledComponentRecipe>> = {}
  for (const name of Object.keys(options) as (ThemeName | 'extends')[]) {
    if (name === 'extends') {
      continue
    }
    const config = options[name]
    if (config === undefined) {
      continue
    }
    own[name] = Object.freeze({
      recipe: slotRecipe(
        config as unknown as ComponentRecipeConfig<
          Record<string, unknown>,
          Record<string, unknown>
        >,
      ),
      defaults: config.defaults,
    })
  }
  const layers = [...(options.extends?.[THEME_LAYERS] ?? [])]
  if (Object.keys(own).length > 0) {
    layers.push(Object.freeze(own))
  }
  return Object.freeze({ [THEME_LAYERS]: Object.freeze(layers) })
}
