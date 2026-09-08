import { cn } from '../utils.ts'

export type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | undefined
  | null
  | ClassValue[]
  | Record<string, unknown>

type ComponentVariantKey<T> = T extends boolean
  ? 'true' | 'false'
  : Extract<NonNullable<T>, string | number>

type ComponentRecipeVariants<S extends string, V> = [V] extends [never]
  ? never
  : { [K in keyof V]?: { [Value in ComponentVariantKey<V[K]>]?: SlotClasses<S> } }

type ComponentVariantMatch<V> = { [K in keyof V]?: V[K] | readonly NonNullable<V[K]>[] }

type ComponentCompoundVariant<S extends string, V> = [V] extends [never]
  ? never
  :
      | { variants: ComponentVariantMatch<V>; class: SlotClasses<S> }
      | (ComponentVariantMatch<V> & { class: SlotClasses<S>; variants?: never })

/** Declarative presentation contributed by one component in one Theme layer. */
export interface ComponentRecipeConfig<S extends string, V> {
  base?: SlotClasses<S>
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

export type SlotClasses<S extends string> = Partial<Record<S, ClassValue>>
export type SlotVariantSchema<S extends string> = Record<string, Record<string, SlotClasses<S>>>

type CompoundVariant<V extends VariantSchema, C> =
  | { variants: VariantMatch<V>; class: C }
  | (VariantMatch<V> & { class: C; variants?: never })

export type SlotCompoundVariant<S extends string, V extends VariantSchema> = CompoundVariant<
  V,
  SlotClasses<S>
>

export interface SlotRecipeOptions<
  S extends string = string,
  V extends SlotVariantSchema<S> = SlotVariantSchema<S>,
> {
  base?: SlotClasses<S>
  variants?: V
  compoundVariants?: readonly SlotCompoundVariant<S, V>[]
  defaults?: VariantSelection<V>
}

export type ResolvedSlotClasses<S extends string> = Record<S, string | undefined>

export interface SlotRecipeFn<S extends string, V extends SlotVariantSchema<S>> {
  (variants?: VariantSelection<V>): ResolvedSlotClasses<S>
  readonly options: SlotRecipeOptions<S, V>
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
  readonly options: AtomicRecipeOptions<V>
}

type RecipeOptions<V extends VariantSchema> = {
  defaults?: VariantSelection<V>
  variants?: V
  compoundVariants?: readonly CompoundVariant<V, unknown>[]
}

function getActiveVariants<V extends VariantSchema>(
  options: RecipeOptions<V>,
  variants?: VariantSelection<V>,
): ActiveVariants {
  const activeVariants: ActiveVariants = {}

  const defaults = options.defaults
  const keys = new Set([
    ...Object.keys(options.variants ?? {}),
    ...Object.keys(defaults ?? {}),
    ...(options.compoundVariants ?? []).flatMap((compound) =>
      Object.keys(getCompoundVariantMatch(compound)),
    ),
  ])
  for (const key of keys) {
    const supplied = variants?.[key]
    const value = supplied === undefined ? defaults?.[key] : supplied
    if (value !== undefined && value !== null) {
      activeVariants[key] = String(value)
    }
  }

  return activeVariants
}

function getCompoundVariantMatch<V extends VariantSchema, C>(
  compoundVariant: CompoundVariant<V, C>,
): VariantMatch<V> {
  if (compoundVariant.variants) {
    return compoundVariant.variants
  }

  const { class: _class, ...variants } = compoundVariant
  return variants as VariantMatch<V>
}

function matchesVariants<V extends VariantSchema>(
  activeVariants: ActiveVariants,
  expectedVariants: VariantMatch<V>,
): boolean {
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

export function slotRecipe<S extends string, V extends SlotVariantSchema<S> = SlotVariantSchema<S>>(
  options: SlotRecipeOptions<S, V>,
): SlotRecipeFn<S, V> {
  const recipeFn = ((variants?: VariantSelection<V>): ResolvedSlotClasses<S> => {
    const activeVariants = getActiveVariants(options, variants)
    const contributions = [
      options.base,
      ...getSelectedVariantValues(options.variants, activeVariants),
      ...(options.compoundVariants ?? [])
        .filter((compound) => matchesVariants(activeVariants, getCompoundVariantMatch(compound)))
        .map((compound) => compound.class),
    ]
    const slotClasses: Partial<Record<S, ClassValue[]>> = {}
    for (const contribution of contributions) {
      for (const slot of Object.keys(contribution ?? {}) as S[]) {
        ;(slotClasses[slot] ??= []).push(contribution?.[slot])
      }
    }
    const classes = {} as ResolvedSlotClasses<S>
    for (const slot of Object.keys(slotClasses) as S[]) {
      classes[slot] = cn(slotClasses[slot])
    }
    return classes
  }) as SlotRecipeFn<S, V>

  Object.defineProperty(recipeFn, 'options', { value: options, enumerable: true })
  return recipeFn
}

export function atomicRecipe<V extends Record<string, Record<string, ClassValue>>>(
  options: AtomicRecipeOptions<V>,
): AtomicRecipeFn<V> {
  const recipeFn = (variants?: VariantSelection<V>, ...extraClasses: ClassValue[]) => {
    const activeVariants = getActiveVariants(options, variants)
    const classes: ClassValue[] = [options.base]

    for (const selectedClass of getSelectedVariantValues(options.variants, activeVariants)) {
      if (selectedClass) {
        classes.push(selectedClass)
      }
    }

    for (const compoundVariant of options.compoundVariants ?? []) {
      if (!matchesVariants(activeVariants, getCompoundVariantMatch(compoundVariant))) {
        continue
      }
      classes.push(compoundVariant.class)
    }

    return cn(classes, ...extraClasses)
  }
  Object.defineProperty(recipeFn, 'options', { value: options, enumerable: true })
  return recipeFn as AtomicRecipeFn<V>
}
