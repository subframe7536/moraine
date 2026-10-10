import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'

import type { Cn } from '../theme/cn'
import type {
  RecipeDefinition,
  RecipeSlots,
  RecipeVariant,
  RecipeVariantSelection,
} from '../theme/recipe'
import { getRecipeDefaultVariants, resolveRecipe } from '../theme/recipe'
import type { SlotClassValue } from '../theme/style-types'

import { useMoraineContext } from './moraine-context'

const EMPTY = /* @__PURE__ */ Object.freeze({})

export interface InheritedStyles<S extends string> {
  classes?: Partial<Record<S, SlotClassValue>>
  styles?: Partial<Record<S, JSX.CSSProperties>>
}

type VariantInput<V> = [V] extends [never] ? object : RecipeVariantSelection<V>
type ResolvedVariantInput<V> = [V] extends [never]
  ? object
  : { readonly [K in keyof V]-?: Exclude<V[K], undefined> }

type StyleProps<S extends string, V> = VariantInput<V> &
  InheritedStyles<S> & {
    class?: SlotClassValue
    style?: JSX.CSSProperties
  }

type CssVariables = Partial<Record<`--${string}`, string | number | null | undefined>>

interface CreateStylesOptions<S extends string, V> {
  rootSlot?: S
  /** Receives recipe and instance CSS variables. Defaults to `root`, or `rootSlot` when no root slot exists. */
  variablesSlot?: S
  /** Instance CSS variables for `variablesSlot`. Applied after recipe keys and before inherited/caller styles. */
  variables?: () => CssVariables | undefined
  inheritedVariants?: () => VariantInput<V> | undefined
  inheritedStyles?: () => InheritedStyles<S> | undefined
}

type RequiredRootSlotOptions<S extends string, V> = 'root' extends S
  ? CreateStylesOptions<S, V>
  : CreateStylesOptions<S, V> & { rootSlot: S }

export interface SlotBinding {
  readonly class: string | undefined
  readonly style: JSX.CSSProperties
}

type SlotBindings<S extends string> = { readonly [K in S]: SlotBinding }

export type CreateStylesResult<R extends RecipeDefinition> = {
  styles: SlotBindings<Extract<keyof RecipeSlots<R>, string>>
  variants: ResolvedVariantInput<RecipeVariant<R>>
}

function resolveCssVariables(
  values: CssVariables | undefined,
): Partial<Record<`--${string}`, string | number>> | undefined {
  if (values === undefined) {
    return undefined
  }
  const style: Partial<Record<`--${string}`, string | number>> = {}
  let hasValue = false
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) {
      continue
    }
    style[key as `--${string}`] = value
    hasValue = true
  }
  return hasValue ? style : undefined
}

function resolveRootSlot<S extends string>(slots: readonly string[], rootSlot: S | undefined): S {
  if (rootSlot !== undefined) {
    return rootSlot
  }
  const root = slots.find((slot) => slot === 'root')
  if (root === undefined) {
    throw new Error('createStyles requires rootSlot for recipes without a root slot')
  }
  return root as S
}

/** Resolves one component recipe into reactive, stable slot bindings and variant selections. */
export function createStyles<R extends RecipeDefinition>(
  recipe: R,
  props: StyleProps<Extract<keyof RecipeSlots<R>, string>, RecipeVariant<R>>,
  ...args: 'root' extends Extract<keyof RecipeSlots<R>, string>
    ? [options?: RequiredRootSlotOptions<Extract<keyof RecipeSlots<R>, string>, RecipeVariant<R>>]
    : [options: RequiredRootSlotOptions<Extract<keyof RecipeSlots<R>, string>, RecipeVariant<R>>]
): CreateStylesResult<R> {
  type Slots = Extract<keyof RecipeSlots<R>, string>
  type Variants = RecipeVariant<R>
  const options = (args[0] ?? {}) as RequiredRootSlotOptions<Slots, Variants>
  const context = useMoraineContext()
  const cn: Cn = (...classes) => context.cn(...classes)
  const resolvedRecipe = createMemo(() => context.resolver.resolve(recipe))
  const defaultVariants = createMemo(() => getRecipeDefaultVariants(resolvedRecipe()) ?? EMPTY)
  const inheritedVariants = createMemo(() => options.inheritedVariants?.() ?? EMPTY)
  const variantKeys = new Set<string>([
    ...Object.keys(recipe.config.defaultVariants ?? {}),
    ...Object.keys(recipe.config.variants ?? {}),
    ...(recipe.config.compoundVariants ?? []).flatMap((compound) => Object.keys(compound.variants)),
  ])
  const variants = {} as ResolvedVariantInput<Variants>
  for (const key of variantKeys) {
    const selection = createMemo(() => {
      const supplied = (props as Record<string, unknown>)[key]
      if (supplied !== undefined) {
        return supplied
      }
      const inherited = (inheritedVariants() as Record<string, unknown>)[key]
      return inherited === undefined
        ? (defaultVariants() as Record<string, unknown>)[key]
        : inherited
    })
    Object.defineProperty(variants, key, {
      enumerable: true,
      get: selection,
    })
  }
  const output = createMemo(() => resolveRecipe(resolvedRecipe(), variants, cn), undefined, {
    equals: false,
  })
  const rootSlot = resolveRootSlot(recipe.slots, options.rootSlot)
  const recipeStyleSlot =
    options.variablesSlot ?? (recipe.slots.includes('root') ? 'root' : rootSlot)
  const styles = {} as { [Slot in Slots]: SlotBinding }

  for (const slot of recipe.slots as readonly Slots[]) {
    styles[slot] = {
      get class() {
        return cn(
          output().classes[slot],
          options.inheritedStyles?.()?.classes?.[slot],
          props.classes?.[slot],
          slot === rootSlot ? props.class : undefined,
        )
      },
      get style() {
        return {
          ...(slot === recipeStyleSlot ? output().style : undefined),
          ...(slot === recipeStyleSlot ? resolveCssVariables(options.variables?.()) : undefined),
          ...options.inheritedStyles?.()?.styles?.[slot],
          ...props.styles?.[slot],
          ...(slot === rootSlot ? props.style : undefined),
        }
      },
    }
  }

  return { styles, variants }
}
