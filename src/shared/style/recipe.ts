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

export type VariantSelection<T extends VariantSchema> = {
  [K in keyof T]?: VariantValue<keyof T[K]> | null | undefined
}

export type VariantMatch<T extends VariantSchema> = {
  [K in keyof T]?: VariantMatcher<keyof T[K]> | null | undefined
}

export type SlotClasses<S extends string> = Partial<Record<S, ClassValue>>
export type SlotVariantSchema<S extends string> = Record<string, Record<string, SlotClasses<S>>>

export type SlotCompoundVariant<S extends string, V extends VariantSchema> =
  | { variants: VariantMatch<V>; class: SlotClasses<S> }
  | (VariantMatch<V> & { class: SlotClasses<S>; variants?: never })

export interface SlotRecipeOptions<
  S extends string = string,
  V extends SlotVariantSchema<S> = SlotVariantSchema<S>,
> {
  base: SlotClasses<S>
  variants?: V
  compoundVariants?: readonly SlotCompoundVariant<S, V>[]
  defaultVariants?: VariantSelection<V>
}

export type SlotFn = (...extraClasses: ClassValue[]) => string | undefined

export type SlotFns<S extends string> = Record<S, SlotFn> & {
  classes: Record<S, string | undefined>
}

export interface SlotRecipeFn<S extends string, V extends VariantSchema> {
  (variants?: VariantSelection<V>): SlotFns<S>
  slots: readonly S[]
}

export type AtomicCompoundVariant<V extends VariantSchema> =
  | { variants: VariantMatch<V>; class: ClassValue }
  | (VariantMatch<V> & { class: ClassValue; variants?: never })

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

type CompoundVariant<V extends VariantSchema, C> =
  | { variants: VariantMatch<V>; class: C }
  | (VariantMatch<V> & { class: C; variants?: never })

function getActiveVariants<V extends VariantSchema>(
  options: RecipeOptions<V>,
  variants?: VariantSelection<V>,
): Record<string, unknown> {
  const activeVariants: Record<string, unknown> = { ...options.defaultVariants }

  for (const [key, value] of Object.entries(variants ?? {})) {
    if (value !== undefined && value !== null) {
      activeVariants[key] = value
    }
  }

  return activeVariants
}

function getCompoundVariantMatch<V extends VariantSchema, C>(
  compoundVariant: CompoundVariant<V, C>,
): Record<string, unknown> {
  if ('variants' in compoundVariant && compoundVariant.variants) {
    return compoundVariant.variants
  }

  const { class: _class, ...variants } = compoundVariant
  return variants
}

function toVariantString(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return typeof value === 'object' && value !== null ? JSON.stringify(value) : ''
}

function matchesVariants(
  activeVariants: Record<string, unknown>,
  expectedVariants: Record<string, unknown>,
): boolean {
  const entries = Object.entries(expectedVariants)
  return (
    entries.length > 0 &&
    entries.every(([name, expected]) => {
      const actual = activeVariants[name]
      if (actual === undefined || actual === null) {
        return false
      }

      return Array.isArray(expected)
        ? expected.some((value) => toVariantString(value) === toVariantString(actual))
        : toVariantString(expected) === toVariantString(actual)
    })
  )
}

function getSelectedVariantValues<V extends VariantSchema>(
  options: RecipeOptions<V>,
  activeVariants: Record<string, unknown>,
): unknown[] {
  return Object.entries(options.variants ?? {}).flatMap(([name, values]) => {
    const selected = activeVariants[name]
    return selected === undefined || selected === null ? [] : [values[toVariantString(selected)]]
  })
}

export function createSlotRecipe<S extends string, V extends SlotVariantSchema<S>>(
  options: SlotRecipeOptions<S, V>,
): SlotRecipeFn<S, V> {
  const slots = Object.keys(options.base) as S[]

  const recipeFn = ((variants?: VariantSelection<V>): SlotFns<S> => {
    const activeVariants = getActiveVariants(options, variants)
    const slotClassMap = Object.fromEntries(
      slots.map((slot) => [slot, [options.base[slot]]]),
    ) as Record<S, ClassValue[]>

    for (const selectedSlots of getSelectedVariantValues(options, activeVariants)) {
      if (!selectedSlots || typeof selectedSlots !== 'object' || Array.isArray(selectedSlots)) {
        continue
      }

      for (const slot of slots) {
        const classValue = (selectedSlots as SlotClasses<S>)[slot]
        if (classValue) {
          slotClassMap[slot].push(classValue)
        }
      }
    }

    for (const compoundVariant of options.compoundVariants ?? []) {
      if (!matchesVariants(activeVariants, getCompoundVariantMatch(compoundVariant))) {
        continue
      }

      for (const slot of slots) {
        const classValue = compoundVariant.class[slot]
        if (classValue) {
          slotClassMap[slot].push(classValue)
        }
      }
    }

    const classes = {} as Record<S, string | undefined>
    const result = { classes } as Record<string, unknown>
    for (const slot of slots) {
      const resolvedClass = cn(slotClassMap[slot]) || undefined
      classes[slot] = resolvedClass
      result[slot] = (...extraClasses: ClassValue[]) =>
        extraClasses.length === 0 ? resolvedClass : cn(resolvedClass, ...extraClasses) || undefined
    }

    return result as SlotFns<S>
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

    for (const selectedClass of getSelectedVariantValues(options, activeVariants)) {
      if (selectedClass) {
        classes.push(selectedClass as ClassValue)
      }
    }

    for (const compoundVariant of options.compoundVariants ?? []) {
      if (matchesVariants(activeVariants, getCompoundVariantMatch(compoundVariant))) {
        classes.push(compoundVariant.class)
      }
    }

    return cn(classes, ...extraClasses) || undefined
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
