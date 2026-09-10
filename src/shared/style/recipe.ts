import type { ClassValue, Cn } from './cn'
import { cn } from './cn'

export type { ClassValue } from './cn'

type SlotKey<S extends object> = Extract<keyof S, string>

type ComponentVariantKey<T> = T extends boolean
  ? 'true' | 'false'
  : Extract<NonNullable<T>, string | number>

type ComponentRecipeVariants<S extends object, V> = [V] extends [never]
  ? never
  : { [K in keyof V]?: { [Value in ComponentVariantKey<V[K]>]?: RecipeContribution<S> } }

type ComponentVariantMatch<V> = { [K in keyof V]?: V[K] | readonly NonNullable<V[K]>[] }

type ComponentCompoundVariant<S extends object, V> = [V] extends [never]
  ? never
  : RecipeContribution<S> & { variants: ComponentVariantMatch<V> }

type ComponentVariantSelection<V> = [V] extends [never]
  ? object
  : { [K in keyof V]?: V[K] | null | undefined }

/** Declarative presentation contributed by one component recipe. */
export interface ComponentRecipeConfig<S extends object, V> {
  base?: RecipeContribution<S>
  variants?: ComponentRecipeVariants<S, V>
  compoundVariants?: readonly ComponentCompoundVariant<S, V>[]
  defaults?: [V] extends [never] ? never : { [K in keyof V]?: NonNullable<V[K]> }
}

type AtomicBaseClassValue = Exclude<ClassValue, Record<string, unknown>>

export type VariantValue<T> = string extends T
  ? string | number | boolean
  : T extends 'true' | 'false'
    ? boolean | 'true' | 'false'
    : T
export type VariantMatcher<T> = VariantValue<T> | readonly VariantValue<T>[]
export type VariantSchema = Record<string, Record<string, unknown>>

type VariantKey = string | number | boolean
type ActiveVariants = Record<string, string>

export type VariantSelection<T extends VariantSchema> = {
  [K in keyof T]?: VariantValue<keyof T[K]> | null | undefined
}

export type VariantMatch<T extends VariantSchema> = {
  [K in keyof T]?: VariantMatcher<keyof T[K]> | null | undefined
}

export type SlotClasses<S extends object> = Partial<Record<SlotKey<S>, ClassValue>>

type CompoundVariant<V extends VariantSchema, C> =
  | { variants: VariantMatch<V>; class: C }
  | (VariantMatch<V> & { class: C; variants?: never })

/** Presentation contributed by a base, variant, or compound branch. */
export type RecipeContribution<S extends object> = SlotClasses<S> &
  Partial<Record<`--${string}`, string | number | null | undefined>>

export interface SlotRecipeResult<S extends object> {
  classes: Record<SlotKey<S>, string | undefined>
  style: Partial<Record<`--${string}`, string | number>>
}

export interface SlotRecipeFn<S extends object, V> {
  (variants?: ComponentVariantSelection<V>): SlotRecipeResult<S>
  /** Resolves all contributions with the supplied merger. */
  resolve: (variants: ComponentVariantSelection<V> | undefined, cn: Cn) => SlotRecipeResult<S>
  readonly options: ComponentRecipeConfig<S, V>
}

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
  /** Resolves all contributions and extra classes with the supplied merger. */
  resolve: (
    variants: VariantSelection<V> | undefined,
    cn: Cn,
    ...extraClasses: ClassValue[]
  ) => string | undefined
  readonly options: AtomicRecipeOptions<V>
}

interface RecipeOptions {
  defaults?: object
  variants?: object
  compoundVariants?: readonly { class?: unknown; variants?: object }[]
}

function getActiveVariants(options: RecipeOptions, variants?: object): ActiveVariants {
  const activeVariants: ActiveVariants = {}

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
      activeVariants[key] = String(value)
    }
  }

  return activeVariants
}

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
    const classValue = selected === undefined ? undefined : values[selected]
    return classValue === undefined ? [] : [classValue]
  })
}

export function slotRecipe<S extends object, V>(
  options: ComponentRecipeConfig<S, V>,
): SlotRecipeFn<S, V> {
  const resolve = (
    variants: ComponentVariantSelection<V> | undefined,
    cn: Cn,
  ): SlotRecipeResult<S> => {
    const activeVariants = getActiveVariants(options, variants)
    const contributions = [
      options.base,
      ...getSelectedVariantValues<RecipeContribution<S>>(
        options.variants as Record<string, Record<string, RecipeContribution<S>>> | undefined,
        activeVariants,
      ),
      ...(options.compoundVariants ?? [])
        .filter((compound) => matchesVariants(activeVariants, compound.variants))
        .map(({ variants: _variants, ...contribution }) => contribution),
    ]
    const style: SlotRecipeResult<S>['style'] = {}
    const slotClasses: Partial<Record<SlotKey<S>, ClassValue[]>> = {}
    for (const contribution of contributions) {
      for (const key of Object.keys(contribution ?? {})) {
        if (key.startsWith('--')) {
          const name = key as `--${string}`
          const value = (contribution as RecipeContribution<S>)[name]
          if (value !== undefined && value !== null) {
            style[name] = value
          }
        } else {
          const slot = key as SlotKey<S>
          ;(slotClasses[slot] ??= []).push((contribution as RecipeContribution<S>)[slot])
        }
      }
    }
    const classes = {} as SlotRecipeResult<S>['classes']
    for (const slot of Object.keys(slotClasses) as SlotKey<S>[]) {
      classes[slot] = cn(slotClasses[slot])
    }
    return { classes, style }
  }
  const recipeFn = Object.assign(
    (variants?: ComponentVariantSelection<V>) => resolve(variants, cn),
    { resolve },
  ) as SlotRecipeFn<S, V>

  Object.defineProperty(recipeFn, 'options', { value: options, enumerable: true })
  return recipeFn
}

export function atomicRecipe<V extends Record<string, Record<string, ClassValue>>>(
  options: AtomicRecipeOptions<V>,
): AtomicRecipeFn<V> {
  const resolve = (
    variants: VariantSelection<V> | undefined,
    cn: Cn,
    ...extraClasses: ClassValue[]
  ) => {
    const activeVariants = getActiveVariants(options, variants)
    const classes: ClassValue[] = [options.base]

    for (const selectedClass of getSelectedVariantValues(options.variants, activeVariants)) {
      if (selectedClass) {
        classes.push(selectedClass)
      }
    }

    for (const compoundVariant of options.compoundVariants ?? []) {
      if (!matchesVariants(activeVariants, getVariantMatch(compoundVariant))) {
        continue
      }
      classes.push(compoundVariant.class)
    }

    return cn(classes, ...extraClasses)
  }
  const recipeFn = Object.assign(
    (variants?: VariantSelection<V>, ...extraClasses: ClassValue[]) =>
      resolve(variants, cn, ...extraClasses),
    { resolve },
  )
  Object.defineProperty(recipeFn, 'options', { value: options, enumerable: true })
  return recipeFn as AtomicRecipeFn<V>
}
