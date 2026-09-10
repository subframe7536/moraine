import { slotRecipe } from '../shared/style/recipe'
import type { ComponentRecipeConfig, SlotRecipeFn } from '../shared/style/recipe'

import type { ComponentThemeEntry, CreateThemeOptions, MoraineTheme, ThemeName } from './types'

export function toThemeEntry<S extends object, V>(
  recipe: SlotRecipeFn<S, V>,
  parent?: ComponentThemeEntry<S, V>,
): ComponentThemeEntry<S, V> {
  const defaults = { ...parent?.defaults } as NonNullable<ComponentRecipeConfig<S, V>['defaults']>
  const own = recipe.options.defaults
  for (const key of Object.keys(own ?? {}) as (keyof typeof defaults)[]) {
    const value = own?.[key]
    if (value !== undefined) {
      defaults[key] = value
    }
  }
  return Object.freeze({
    defaults:
      parent?.defaults || own
        ? (Object.freeze(defaults) as ComponentRecipeConfig<S, V>['defaults'])
        : undefined,
    recipes: Object.freeze([...(parent?.recipes ?? []), recipe]),
  })
}

/** Extends component defaults and appends recipes to the parent theme. */
export function createTheme(options: CreateThemeOptions = {}): MoraineTheme {
  const theme = { ...options.extends }
  for (const name of Object.keys(options) as (ThemeName | 'extends')[]) {
    if (name === 'extends') {
      continue
    }
    const config = options[name]
    if (config === undefined) {
      continue
    }
    // Each key pairs the config with its matching parent entry despite the widened types.
    const recipe = slotRecipe(
      config as ComponentRecipeConfig<Record<string, unknown>, Record<string, unknown>>,
    )
    const parent = theme[name]
    Object.assign(theme, { [name]: toThemeEntry(recipe, parent) })
  }
  return Object.freeze(theme)
}
