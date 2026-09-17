import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'

import type { SlotClassValue } from '../shared/types'
import type {
  RecipeDefinition,
  RecipeSlots,
  RecipeVariant,
  RecipeVariantSelection,
} from '../theme/style/recipe'
import { getRecipeDefaultVariants, resolveRecipe } from '../theme/style/recipe'

import { useCn } from './cn-context'
import { useThemeResolver } from './theme-context'

const EMPTY = Object.freeze({})

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

interface CreateStylesOptions<S extends string, V> {
  rootSlot?: S
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
  const cn = useCn()
  const resolver = useThemeResolver()
  const resolvedRecipe = createMemo(() => resolver().resolve(recipe))
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
  const cache: Partial<Record<Slots, SlotBinding>> = {}
  const styles = {} as SlotBindings<Slots>

  const binding = (slot: Slots): SlotBinding => {
    const cached = cache[slot]
    if (cached) {
      return cached
    }
    const created: SlotBinding = {
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
          ...(slot === rootSlot ? output().style : undefined),
          ...options.inheritedStyles?.()?.styles?.[slot],
          ...props.styles?.[slot],
          ...(slot === rootSlot ? props.style : undefined),
        }
      },
    }
    cache[slot] = created
    return created
  }

  for (const slot of recipe.slots as readonly Slots[]) {
    Object.defineProperty(styles, slot, {
      enumerable: true,
      get: () => binding(slot),
    })
  }

  return { styles, variants }
}
