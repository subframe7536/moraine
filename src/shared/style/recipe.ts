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

type AtomicBaseClassValue = Exclude<ClassValue, Record<string, unknown>>

export type VariantValue<T> = T extends 'true' | 'false' ? boolean | 'true' | 'false' : T
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
  base: SlotClasses<S>
  variants?: V
  compoundVariants?: readonly SlotCompoundVariant<S, V>[]
  defaultVariants?: VariantSelection<V>
}

export type ResolvedSlotClasses<S extends string> = Record<S, string | undefined>

export interface SlotRecipeFn<S extends string, V extends VariantSchema> {
  (variants?: VariantSelection<V>): ResolvedSlotClasses<S>
  slots: readonly S[]
}

export type AtomicCompoundVariant<V extends VariantSchema> = CompoundVariant<V, ClassValue>

export interface AtomicRecipeOptions<
  V extends Record<string, Record<string, ClassValue>> = Record<string, Record<string, ClassValue>>,
> {
  base?: AtomicBaseClassValue
  variants?: V
  compoundVariants?: readonly AtomicCompoundVariant<V>[]
  defaultVariants?: VariantSelection<V>
}

export interface AtomicRecipeFn<V extends VariantSchema> {
  (variants?: VariantSelection<V>, ...extraClasses: ClassValue[]): string | undefined
}

export type VariantProps<T> =
  T extends SlotRecipeFn<infer _S, infer V>
    ? VariantSelection<V>
    : T extends AtomicRecipeFn<infer V>
      ? VariantSelection<V>
      : never

type RecipeOptions<V extends VariantSchema> = {
  defaultVariants?: VariantSelection<V>
  variants?: V
}

function getActiveVariants<V extends VariantSchema>(
  options: RecipeOptions<V>,
  variants?: VariantSelection<V>,
): ActiveVariants {
  const activeVariants: ActiveVariants = {}

  for (const source of [options.defaultVariants, variants]) {
    for (const [key, value] of Object.entries(source ?? {})) {
      if (value !== undefined && value !== null) {
        activeVariants[key] = String(value)
      }
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

function appendSlotClasses<S extends string>(
  slotClasses: Record<S, ClassValue[]>,
  classes: SlotClasses<S>,
  slots: readonly S[],
): void {
  for (const slot of slots) {
    const classValue = classes[slot]
    if (classValue) {
      slotClasses[slot].push(classValue)
    }
  }
}

export function createSlotRecipe<S extends string, V extends SlotVariantSchema<S>>(
  options: SlotRecipeOptions<S, V>,
): SlotRecipeFn<S, V> {
  const slots = Object.keys(options.base) as S[]

  const recipeFn = ((variants?: VariantSelection<V>): ResolvedSlotClasses<S> => {
    const activeVariants = getActiveVariants(options, variants)
    const slotClasses = {} as Record<S, ClassValue[]>

    for (const slot of slots) {
      slotClasses[slot] = [options.base[slot]]
    }

    for (const classes of getSelectedVariantValues(options.variants, activeVariants)) {
      appendSlotClasses(slotClasses, classes, slots)
    }

    for (const compoundVariant of options.compoundVariants ?? []) {
      if (!matchesVariants(activeVariants, getCompoundVariantMatch(compoundVariant))) {
        continue
      }

      appendSlotClasses(slotClasses, compoundVariant.class, slots)
    }

    const classes = {} as ResolvedSlotClasses<S>
    for (const slot of slots) {
      classes[slot] = cn(slotClasses[slot])
    }
    return classes
  }) as SlotRecipeFn<S, V>

  recipeFn.slots = slots
  return recipeFn
}

export function createAtomicRecipe<V extends Record<string, Record<string, ClassValue>>>(
  options: AtomicRecipeOptions<V>,
): AtomicRecipeFn<V> {
  return (variants?: VariantSelection<V>, ...extraClasses: ClassValue[]) => {
    const activeVariants = getActiveVariants(options, variants)
    const classes: ClassValue[] = [options.base]

    for (const selectedClass of getSelectedVariantValues(options.variants, activeVariants)) {
      if (selectedClass) {
        classes.push(selectedClass)
      }
    }

    for (const compoundVariant of options.compoundVariants ?? []) {
      if (matchesVariants(activeVariants, getCompoundVariantMatch(compoundVariant))) {
        classes.push(compoundVariant.class)
      }
    }

    return cn(classes, ...extraClasses)
  }
}

export function recipe<
  B extends Record<string, ClassValue>,
  V extends SlotVariantSchema<NoInfer<keyof B & string>> = SlotVariantSchema<keyof B & string>,
>(
  options: SlotRecipeOptions<NoInfer<keyof B & string>, V> & { base: B },
): SlotRecipeFn<keyof B & string, V>
export function recipe<V extends Record<string, Record<string, ClassValue>>>(
  options: AtomicRecipeOptions<V>,
): AtomicRecipeFn<V>
export function recipe(
  options: SlotRecipeOptions<string, SlotVariantSchema<string>> | AtomicRecipeOptions,
): SlotRecipeFn<string, SlotVariantSchema<string>> | AtomicRecipeFn<VariantSchema> {
  if (options.base && typeof options.base === 'object' && !Array.isArray(options.base)) {
    return createSlotRecipe(options as SlotRecipeOptions<string, SlotVariantSchema<string>>)
  }

  return createAtomicRecipe(options as AtomicRecipeOptions)
}
