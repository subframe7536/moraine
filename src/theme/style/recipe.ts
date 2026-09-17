import type { ClassValue, Cn } from './cn'
import { cn } from './cn'

export type { ClassValue } from './cn'

export type RecipeSlot<S extends object> = Extract<keyof S, string>

type ComponentVariantKey<T> = T extends boolean
  ? 'true' | 'false'
  : Extract<NonNullable<T>, string | number>

export type RecipeContribution<S extends object> = Partial<Record<RecipeSlot<S>, ClassValue>> &
  Partial<Record<`--${string}`, string | number | null | undefined>>

export type RecipeBase<S extends object> = { [K in RecipeSlot<S>]-?: ClassValue } & Partial<
  Record<`--${string}`, string | number | null | undefined>
>

export type RecipeVariants<S extends object, V> = [V] extends [never]
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
  readonly variants?: RecipeVariants<S, V>
  readonly compoundVariants?: readonly RecipeCompoundVariant<S, V>[]
  readonly defaultVariants?: RecipeDefaultVariants<V>
}

export interface RecipeLayerConfig<S extends object, V> {
  readonly base?: RecipeContribution<S>
  readonly variants?: RecipeVariants<S, V>
  readonly compoundVariants?: readonly RecipeCompoundVariant<S, V>[]
  readonly defaultVariants?: RecipeDefaultVariants<V>
}

declare const RECIPE_TYPES: unique symbol

/** Readonly component recipe definition. Construction is internal to Moraine. */
export interface RecipeDefinition<Key extends string = string, S extends object = any, V = any> {
  readonly key: Key
  readonly slots: readonly RecipeSlot<S>[]
  readonly config: RecipeConfig<S, V>
  readonly [RECIPE_TYPES]?: { slots: S; variants: V }
}

export interface ResolvedRecipe<Key extends string = string, S extends object = any, V = any> {
  readonly definition: RecipeDefinition<Key, S, V>
  readonly layers: readonly RecipeLayerConfig<S, V>[]
}

export type RecipeSlots<T> = T extends RecipeDefinition<string, infer S> ? S : never
export type RecipeVariant<T> = T extends RecipeDefinition<string, any, infer V> ? V : never
export type RecipeKey<T> = T extends RecipeDefinition<infer Key> ? Key : never

export interface RecipeResult<S extends object> {
  classes: Record<RecipeSlot<S>, string | undefined>
  style: Partial<Record<`--${string}`, string | number>>
}

/** Internal builder for statically declared component recipes. */
export function defineRecipe<Key extends string, S extends object, V = never>(
  key: Key,
  config: RecipeConfig<S, V>,
): RecipeDefinition<Key, S, V> {
  const slots = Object.freeze(
    Object.keys(config.base).filter((slot) => !slot.startsWith('--')) as RecipeSlot<S>[],
  )
  return Object.freeze({ key, slots, config: freezeRecipeConfig(config) })
}

function freezeRecipeConfig<S extends object, V>(config: RecipeConfig<S, V>): RecipeConfig<S, V> {
  return Object.freeze({
    ...config,
    base: Object.freeze({ ...config.base }),
    variants: freezeVariants(config.variants),
    compoundVariants: config.compoundVariants?.map((item) => Object.freeze({ ...item })),
    defaultVariants: config.defaultVariants
      ? Object.freeze({ ...config.defaultVariants })
      : undefined,
  }) as unknown as RecipeConfig<S, V>
}

function freezeVariants<S extends object, V>(
  variants: RecipeVariants<S, V> | undefined,
): RecipeVariants<S, V> | undefined {
  if (!variants) {
    return undefined
  }
  const result: Record<string, Record<string, unknown>> = {}
  for (const [name, values] of Object.entries(variants)) {
    result[name] = Object.fromEntries(
      Object.entries(values ?? {}).map(([value, contribution]) => [
        value,
        Object.freeze({ ...(contribution as object) }),
      ]),
    )
    Object.freeze(result[name])
  }
  return Object.freeze(result) as RecipeVariants<S, V>
}

type VariantKey = string | number | boolean
type ActiveVariants = Record<string, string>

function getVariantMatch(compoundVariant: { class?: unknown; variants?: object }): object {
  if (compoundVariant.variants) {
    return compoundVariant.variants
  }
  const { class: _class, ...variants } = compoundVariant
  return variants
}

function matchesVariants(activeVariants: ActiveVariants, expectedVariants: object): boolean {
  const entries = Object.entries(expectedVariants) as [
    string,
    VariantMatcher<VariantKey> | null | undefined,
  ][]
  return (
    entries.length > 0 &&
    entries.every(([name, expected]) => {
      const active = activeVariants[name]
      if (active === undefined || expected === undefined || expected === null) {
        return false
      }
      return (Array.isArray(expected) ? expected : [expected]).some(
        (value) => active === String(value),
      )
    })
  )
}

function getSelectedVariantValues<C>(
  variants: Record<string, Record<string, C>> | undefined,
  activeVariants: ActiveVariants,
): C[] {
  return Object.entries(variants ?? {}).flatMap(([name, values]) => {
    const selected = activeVariants[name]
    const value = selected === undefined ? undefined : values[selected]
    return value === undefined ? [] : [value]
  })
}

export function getRecipeDefaultVariants<S extends object, V>(
  recipe: RecipeDefinition<string, S, V> | ResolvedRecipe<string, S, V>,
): RecipeVariantSelection<V> {
  const layers = 'layers' in recipe ? recipe.layers : [recipe.config]
  const defaultVariants: Record<string, unknown> = {}
  for (const layer of layers) {
    for (const [name, value] of Object.entries(layer.defaultVariants ?? {})) {
      if (value !== undefined) {
        defaultVariants[name] = value
      }
    }
  }
  return defaultVariants as RecipeVariantSelection<V>
}

export function resolveRecipe<S extends object, V>(
  recipe: RecipeDefinition<string, S, V> | ResolvedRecipe<string, S, V>,
  variants: RecipeVariantSelection<V> | undefined,
  merge: Cn,
): RecipeResult<S> {
  const layers = 'layers' in recipe ? recipe.layers : [recipe.config]
  const defaults = getRecipeDefaultVariants(recipe) as Record<string, unknown>
  const supplied = variants as Record<string, unknown> | undefined
  const suppliedValues: Record<string, unknown> = {}
  for (const key of Object.keys(supplied ?? {})) {
    suppliedValues[key] = supplied?.[key]
  }
  const keys = new Set<string>([
    ...Object.keys(defaults),
    ...Object.keys(suppliedValues),
    ...layers.flatMap((layer) => Object.keys(layer.variants ?? {})),
    ...layers.flatMap((layer) =>
      (layer.compoundVariants ?? []).flatMap((compound) => Object.keys(compound.variants)),
    ),
  ])
  const activeVariants: ActiveVariants = {}
  for (const key of keys) {
    const value = suppliedValues[key] === undefined ? defaults[key] : suppliedValues[key]
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      activeVariants[key] = String(value)
    }
  }

  const style: RecipeResult<S>['style'] = {}
  const classes = {} as Record<RecipeSlot<S>, ClassValue[]>
  const apply = (contribution: RecipeContribution<S> | undefined) => {
    for (const [key, value] of Object.entries(contribution ?? {})) {
      if (key.startsWith('--')) {
        if (value === undefined || value === null) {
          continue
        }
        style[key as `--${string}`] = value
      } else {
        const slot = key as RecipeSlot<S>
        ;(classes[slot] ??= []).push(value)
      }
    }
  }

  for (const layer of layers) {
    apply(layer.base)
    for (const contribution of getSelectedVariantValues(
      layer.variants as Record<string, Record<string, RecipeContribution<S>>> | undefined,
      activeVariants,
    )) {
      apply(contribution)
    }
    for (const compound of layer.compoundVariants ?? []) {
      if (!matchesVariants(activeVariants, compound.variants)) {
        continue
      }
      const { variants: _variants, ...contribution } = compound
      apply(contribution as unknown as RecipeContribution<S>)
    }
  }

  const resolvedClasses = {} as RecipeResult<S>['classes']
  for (const slot of Object.keys(classes) as RecipeSlot<S>[]) {
    resolvedClasses[slot] = merge(classes[slot])
  }
  return { classes: resolvedClasses, style }
}

type AtomicBaseClassValue = Exclude<ClassValue, Record<string, unknown>>
export type VariantValue<T> = string extends T
  ? string | number | boolean
  : T extends 'true' | 'false'
    ? boolean | 'true' | 'false'
    : T
export type VariantMatcher<T> = VariantValue<T> | readonly VariantValue<T>[]
export type VariantSchema = Record<string, Record<string, unknown>>
export type VariantSelection<T extends VariantSchema> = {
  [K in keyof T]?: VariantValue<keyof T[K]> | null | undefined
}
export type VariantMatch<T extends VariantSchema> = {
  [K in keyof T]?: VariantMatcher<keyof T[K]> | null | undefined
}
type CompoundVariant<V extends VariantSchema, C> =
  | { variants: VariantMatch<V>; class: C }
  | (VariantMatch<V> & { class: C; variants?: never })
export type AtomicCompoundVariant<V extends VariantSchema> = CompoundVariant<V, ClassValue>
export interface AtomicRecipeOptions<
  V extends Record<string, Record<string, ClassValue>> = Record<string, Record<string, ClassValue>>,
> {
  base?: AtomicBaseClassValue
  variants?: V
  compoundVariants?: readonly AtomicCompoundVariant<V>[]
  defaults?: VariantSelection<V>
}
export interface AtomicRecipeFn<V extends Record<string, Record<string, ClassValue>>> {
  (variants?: VariantSelection<V>, ...extraClasses: ClassValue[]): string | undefined
  resolve: (
    variants: VariantSelection<V> | undefined,
    cn: Cn,
    ...extraClasses: ClassValue[]
  ) => string | undefined
  readonly options: AtomicRecipeOptions<V>
}

function getAtomicActiveVariants(
  options: AtomicRecipeOptions<any>,
  variants?: object,
): ActiveVariants {
  const active: ActiveVariants = {}
  const defaults = options.defaults as Record<string, unknown> | undefined
  const keys = new Set([
    ...Object.keys(options.variants ?? {}),
    ...Object.keys(defaults ?? {}),
    ...(options.compoundVariants ?? []).flatMap((compound) =>
      Object.keys(getVariantMatch(compound)),
    ),
  ])
  for (const key of keys) {
    const supplied = (variants as Record<string, unknown> | undefined)?.[key]
    const value = supplied === undefined ? defaults?.[key] : supplied
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      active[key] = String(value)
    }
  }
  return active
}

export function atomicRecipe<V extends Record<string, Record<string, ClassValue>>>(
  options: AtomicRecipeOptions<V>,
): AtomicRecipeFn<V> {
  const resolve = (
    variants: VariantSelection<V> | undefined,
    merge: Cn,
    ...extraClasses: ClassValue[]
  ) => {
    const activeVariants = getAtomicActiveVariants(options, variants)
    const classes: ClassValue[] = [options.base]
    for (const selectedClass of getSelectedVariantValues(options.variants, activeVariants)) {
      if (selectedClass) {
        classes.push(selectedClass)
      }
    }
    for (const compound of options.compoundVariants ?? []) {
      if (matchesVariants(activeVariants, getVariantMatch(compound))) {
        classes.push(compound.class)
      }
    }
    return merge(classes, ...extraClasses)
  }
  const recipeFn = Object.assign(
    (variants?: VariantSelection<V>, ...extraClasses: ClassValue[]) =>
      resolve(variants, cn, ...extraClasses),
    { resolve },
  )
  Object.defineProperty(recipeFn, 'options', { value: options, enumerable: true })
  return recipeFn as AtomicRecipeFn<V>
}
