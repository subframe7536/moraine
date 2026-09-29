import type { RecipeLayerConfig } from './recipe'
import type { MoraineStyleSchema, StyleContract } from './style-contract'

export type { MoraineStyleSchema } from './style-contract'

export type ThemeRecipeOverride<C extends StyleContract<object, unknown>> = RecipeLayerConfig<
  C['slots'],
  C['variants']
>

type ThemeEntries = {
  [K in keyof MoraineStyleSchema]?: ThemeRecipeOverride<MoraineStyleSchema[K]>
}

declare const MORAINE_THEME: unique symbol

/** Immutable theme value produced by defineTheme(). */
export interface MoraineTheme {
  readonly [MORAINE_THEME]: true
}

/** Theme overrides plus optional explicit composition with a parent Theme. */
export type DefineThemeOptions = ThemeEntries & {
  extends?: MoraineTheme
}
