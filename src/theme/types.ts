import type { MoraineStyleSchema, StyleContract } from './style-contract'
import type {
  RecipeCompoundVariant,
  RecipeContribution,
  RecipeDefaultVariants,
  RecipeVariants,
} from './style/recipe'

export type { MoraineStyleSchema } from './style-contract'

type ContractSlots<C extends StyleContract<object, any>> = C['slots']
type ContractVariants<C extends StyleContract<object, any>> = C['variants']

export type ThemeRecipeOverride<C extends StyleContract<object, any>> = {
  base?: RecipeContribution<ContractSlots<C>>
  variants?: RecipeVariants<ContractSlots<C>, ContractVariants<C>>
  compoundVariants?: readonly RecipeCompoundVariant<ContractSlots<C>, ContractVariants<C>>[]
  defaultVariants?: RecipeDefaultVariants<ContractVariants<C>>
}

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
