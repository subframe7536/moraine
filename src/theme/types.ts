import type {
  RecipeBase,
  RecipeCompoundVariant,
  RecipeContribution,
  RecipeDefaultVariants,
  RecipeVariants,
} from '../shared/style/recipe'

import type { MoraineStyleSchema, StyleContract } from './style-contract'

export type { MoraineStyleSchema } from './style-contract'

type ContractSlots<C extends StyleContract<string, any>> = Record<C['slots'], unknown>
type ContractVariants<C extends StyleContract<string, any>> = C['variants']

type AdditiveThemeOverride<C extends StyleContract<string, any>> = {
  replace?: false | undefined
  base?: RecipeContribution<ContractSlots<C>>
  variants?: RecipeVariants<ContractSlots<C>, ContractVariants<C>>
  compoundVariants?: readonly RecipeCompoundVariant<ContractSlots<C>, ContractVariants<C>>[]
  defaultVariants?: RecipeDefaultVariants<ContractVariants<C>>
}

type ReplacementThemeOverride<C extends StyleContract<string, any>> = {
  replace: true
  base: RecipeBase<ContractSlots<C>>
  variants?: RecipeVariants<ContractSlots<C>, ContractVariants<C>>
  compoundVariants?: readonly RecipeCompoundVariant<ContractSlots<C>, ContractVariants<C>>[]
  defaultVariants?: RecipeDefaultVariants<ContractVariants<C>>
}

export type ThemeRecipeOverride<C extends StyleContract<string, any>> =
  | AdditiveThemeOverride<C>
  | ReplacementThemeOverride<C>

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
