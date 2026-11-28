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

export type RecipeVariantMatch<V> = { [K in keyof V]?: V[K] | ReadonlyArray<NonNullable<V[K]>> }

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
  readonly compoundVariants?: ReadonlyArray<RecipeCompoundVariant<S, V>>
  readonly defaultVariants?: RecipeDefaultVariants<V>
}

/** One Theme override layer; every field is optional. */
export interface RecipeLayerConfig<S extends object, V> {
  readonly base?: RecipeContribution<S>
  readonly variants?: RecipeVariantsConfig<S, V>
  readonly compoundVariants?: ReadonlyArray<RecipeCompoundVariant<S, V>>
  readonly defaultVariants?: RecipeDefaultVariants<V>
}

declare const RECIPE_TYPES: unique symbol

/** Readonly component recipe definition. Construction is internal to Moraine. */
export interface RecipeDefinition<S extends object = object, V = unknown> {
  readonly key: string
  readonly config: RecipeConfig<S, V>
  readonly [RECIPE_TYPES]?: { slots: S; variants: V }
}

export type RecipeSlots<T> = T extends RecipeDefinition<infer S> ? S : never
export type RecipeVariants<T> = T extends RecipeDefinition<object, infer V> ? V : never

/** Internal builder for statically declared component recipes. Does no work at module load. */
export function defineRecipe<S extends object, V = never>(
  key: string,
  config: RecipeConfig<S, V>,
): RecipeDefinition<S, V> {
  return { key, config }
}

/** A contribution guarded by variant matches; `when` is absent for base contributions. */
export interface RecipeEntry<T> {
  readonly when?: Readonly<Record<string, ReadonlyArray<string>>>
  readonly value: T
}

export type RecipeVars = Partial<Record<`--${string}`, string | number>>

/**
 * Theme-resolved recipe flattened into ordered contribution lists per slot and for CSS variables.
 * Readers match entries lazily, so each slot memo tracks only the variants its entries test.
 */
export interface CompiledRecipe {
  readonly slots: ReadonlyArray<string>
  readonly defaults: Readonly<Record<string, unknown>>
  readonly keys: ReadonlyArray<string>
  readonly bySlot: Readonly<Record<string, ReadonlyArray<RecipeEntry<ClassValue>>>>
  readonly vars: ReadonlyArray<RecipeEntry<RecipeVars>>
}

const isVar = (key: string) => key.startsWith('--')

function compile(layers: ReadonlyArray<RecipeLayerConfig<object, unknown>>): CompiledRecipe {
  const slots = Object.keys(layers[0]?.base ?? {}).filter((key) => !isVar(key))
  const defaults: Record<string, unknown> = {}
  const keys = new Set<string>()
  const bySlot: Record<string, Array<RecipeEntry<ClassValue>>> = {}
  for (const slot of slots) {
    bySlot[slot] = []
  }
  const vars: Array<RecipeEntry<RecipeVars>> = []

  const add = (contribution: object | undefined, when?: Record<string, ReadonlyArray<string>>) => {
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
      const when: Record<string, Array<string>> = {}
      let valid = false
      for (const [name, expected] of Object.entries(compound.variants)) {
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
  const scope = theme && overrides.length > 0 ? theme : NO_THEME
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
  entries: ReadonlyArray<RecipeEntry<T>>,
  read: (key: string) => unknown,
): Array<T> {
  const matched: Array<T> = []
  for (const entry of entries) {
    if (matches(entry.when, read)) {
      matched.push(entry.value)
    }
  }
  return matched
}

function matches(
  when: Readonly<Record<string, ReadonlyArray<string>>> | undefined,
  read: (key: string) => unknown,
): boolean {
  for (const name in when) {
    const expected = when[name]
    const value = read(name)
    if (
      !expected ||
      (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') ||
      !expected.includes(String(value))
    ) {
      return false
    }
  }
  return true
}
