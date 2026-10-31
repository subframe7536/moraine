import type { ClassValue } from 'cn'

import { getThemeRecipeLayers } from './create-theme'
import type { MoraineTheme } from './types'

export type RecipeSlot<S extends object> = Extract<keyof S, string>

type ComponentVariantKey<T> = T extends boolean
  ? 'true' | 'false'
  : Extract<NonNullable<T>, string | number>

export type RecipeContribution<S extends object> = Partial<Record<RecipeSlot<S>, ClassValue>> &
  Partial<Record<`--${string}`, string | number | null | undefined>>

export type RecipeBase<S extends object> = { [K in RecipeSlot<S>]-?: ClassValue } & Partial<
  Record<`--${string}`, string | number | null | undefined>
>

export type RecipeVariantsConfig<S extends object, V> = [V] extends [never]
  ? never
  : { [K in keyof V]?: { [Value in ComponentVariantKey<V[K]>]?: RecipeContribution<S> } }

export type RecipeVariantMatch<V> = { [K in keyof V]?: V[K] | readonly NonNullable<V[K]>[] }

export type RecipeCompoundVariant<S extends object, V> = [V] extends [never]
  ? never
  : RecipeContribution<S> & { variants: RecipeVariantMatch<V> }

export type RecipeVariantSelection<V> = [V] extends [never]
  ? object
  : { [K in keyof V]?: V[K] | null | undefined }

export type RecipeDefaultVariants<V> = [V] extends [never]
  ? never
  : { [K in keyof V]?: NonNullable<V[K]> | null }

/** Immutable declarative presentation owned by one component recipe. */
export interface RecipeConfig<S extends object, V> {
  readonly base: RecipeBase<S>
  readonly variants?: RecipeVariantsConfig<S, V>
  readonly compoundVariants?: readonly RecipeCompoundVariant<S, V>[]
  readonly defaultVariants?: RecipeDefaultVariants<V>
}

/** One Theme override layer; every field is optional. */
export interface RecipeLayerConfig<S extends object, V> {
  readonly base?: RecipeContribution<S>
  readonly variants?: RecipeVariantsConfig<S, V>
  readonly compoundVariants?: readonly RecipeCompoundVariant<S, V>[]
  readonly defaultVariants?: RecipeDefaultVariants<V>
}

declare const RECIPE_TYPES: unique symbol

/** Readonly component recipe definition. Construction is internal to Moraine. */
export interface RecipeDefinition<S extends object = any, V = any> {
  readonly key: string
  readonly config: RecipeConfig<S, V>
  readonly [RECIPE_TYPES]?: { slots: S; variants: V }
}

export type RecipeSlots<T> = T extends RecipeDefinition<infer S> ? S : never
export type RecipeVariants<T> = T extends RecipeDefinition<any, infer V> ? V : never

/** Internal builder for statically declared component recipes. Does no work at module load. */
export function defineRecipe<S extends object, V = never>(
  key: string,
  config: RecipeConfig<S, V>,
): RecipeDefinition<S, V> {
  return { key, config }
}

/** A contribution guarded by variant matches; `when` is absent for base contributions. */
export interface RecipeEntry<T> {
  readonly when?: Readonly<Record<string, readonly string[]>>
  readonly value: T
}

export type RecipeVars = Partial<Record<`--${string}`, string | number>>

/**
 * Theme-resolved recipe flattened into ordered contribution lists per slot and for CSS variables.
 * Readers match entries lazily, so each slot memo tracks only the variants its entries test.
 */
export interface CompiledRecipe {
  readonly slots: readonly string[]
  readonly defaults: Readonly<Record<string, unknown>>
  readonly keys: readonly string[]
  readonly bySlot: Readonly<Record<string, readonly RecipeEntry<ClassValue>[]>>
  readonly vars: readonly RecipeEntry<RecipeVars>[]
}

const isVar = (key: string) => key.startsWith('--')

function compile(layers: readonly RecipeLayerConfig<any, any>[]): CompiledRecipe {
  const slots = Object.keys(layers[0]!.base!).filter((key) => !isVar(key))
  const defaults: Record<string, unknown> = {}
  const keys = new Set<string>()
  const bySlot: Record<string, RecipeEntry<ClassValue>[]> = {}
  for (const slot of slots) {
    bySlot[slot] = []
  }
  const vars: RecipeEntry<RecipeVars>[] = []

  const add = (contribution: object | undefined, when?: Record<string, readonly string[]>) => {
    let style: RecipeVars | undefined
    for (const [key, value] of Object.entries(contribution ?? {})) {
      if (key === 'variants' || value === undefined) {
        continue
      }
      if (isVar(key)) {
        if (value !== null) {
          ;(style ??= {})[key as `--${string}`] = value as string | number
        }
      } else {
        bySlot[key]?.push({ when, value: value as ClassValue })
      }
    }
    if (style) {
      vars.push({ when, value: style })
    }
  }

  for (const layer of layers) {
    for (const [name, value] of Object.entries(layer.defaultVariants ?? {})) {
      keys.add(name)
      if (value !== undefined) {
        defaults[name] = value
      }
    }
    add(layer.base)
    for (const [name, values] of Object.entries(layer.variants ?? {})) {
      keys.add(name)
      for (const [value, contribution] of Object.entries(values ?? {})) {
        add(contribution, { [name]: [value] })
      }
    }
    for (const compound of layer.compoundVariants ?? []) {
      const when: Record<string, string[]> = {}
      let valid = false
      for (const [name, expected] of Object.entries(compound.variants as object)) {
        keys.add(name)
        valid = expected !== undefined && expected !== null
        if (!valid) {
          break
        }
        when[name] = (Array.isArray(expected) ? expected : [expected]).map(String)
      }
      if (valid) {
        add(compound, when)
      }
    }
  }

  return { slots, defaults, keys: [...keys], bySlot, vars }
}

const NO_THEME = {}
const compiled = new WeakMap<object, WeakMap<RecipeDefinition, CompiledRecipe>>()

/** Compiles a recipe with its Theme layers; results are cached per Theme and recipe. */
export function compileRecipe(
  recipe: RecipeDefinition,
  theme?: MoraineTheme | null,
): CompiledRecipe {
  const overrides = theme ? getThemeRecipeLayers(theme, recipe.key) : []
  const scope = overrides.length > 0 ? theme! : NO_THEME
  let cache = compiled.get(scope)
  if (!cache) {
    cache = new WeakMap()
    compiled.set(scope, cache)
  }
  let result = cache.get(recipe)
  if (!result) {
    result = compile([recipe.config, ...overrides])
    cache.set(recipe, result)
  }
  return result
}

/** Returns the values of entries whose `when` matches the variant reader, in declaration order. */
export function matchEntries<T>(
  entries: readonly RecipeEntry<T>[],
  read: (key: string) => unknown,
): T[] {
  const matched: T[] = []
  for (const entry of entries) {
    if (matches(entry.when, read)) {
      matched.push(entry.value)
    }
  }
  return matched
}

function matches(
  when: Readonly<Record<string, readonly string[]>> | undefined,
  read: (key: string) => unknown,
): boolean {
  for (const name in when) {
    const value = read(name)
    if (
      (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') ||
      !when[name]!.includes(String(value))
    ) {
      return false
    }
  }
  return true
}
