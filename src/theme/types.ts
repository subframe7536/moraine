import type {
  RecipeBase,
  RecipeCompoundVariant,
  RecipeContribution,
  RecipeDefinition,
  RecipeDefaultVariants,
  RecipeKey,
  RecipeSlots,
  RecipeVariant,
  RecipeVariants,
} from '../shared/style/recipe'
import type * as styles from '../styles'

type RecipeExport = {
  [K in keyof typeof styles]: (typeof styles)[K] extends RecipeDefinition<any>
    ? (typeof styles)[K]
    : never
}[keyof typeof styles]

export type MoraineStyleSchema = {
  [R in RecipeExport as RecipeKey<R>]: R
}

type AdditiveThemeOverride<R extends RecipeDefinition<any>> = {
  replace?: false | undefined
  base?: RecipeContribution<RecipeSlots<R>>
  variants?: RecipeVariants<RecipeSlots<R>, RecipeVariant<R>>
  compoundVariants?: readonly RecipeCompoundVariant<RecipeSlots<R>, RecipeVariant<R>>[]
  defaultVariants?: RecipeDefaultVariants<RecipeVariant<R>>
}

type ReplacementThemeOverride<R extends RecipeDefinition<any>> = {
  replace: true
  base: RecipeBase<RecipeSlots<R>>
  variants?: RecipeVariants<RecipeSlots<R>, RecipeVariant<R>>
  compoundVariants?: readonly RecipeCompoundVariant<RecipeSlots<R>, RecipeVariant<R>>[]
  defaultVariants?: RecipeDefaultVariants<RecipeVariant<R>>
}

export type ThemeRecipeOverride<R extends RecipeDefinition<any>> =
  | AdditiveThemeOverride<R>
  | ReplacementThemeOverride<R>

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

export type ThemeName = keyof MoraineStyleSchema
