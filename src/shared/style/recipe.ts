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

export type VariantValue<T> = T extends 'true' | 'false' ? boolean | 'true' | 'false' : T
export type VariantMatcher<T> = VariantValue<T> | readonly VariantValue<T>[]

export type VariantSchema = Record<string, Record<string, unknown>>

export type VariantSelection<T extends VariantSchema> = {
  [K in keyof T]?: VariantValue<keyof T[K]> | null | undefined
}

export type VariantMatch<T extends VariantSchema> = {
  [K in keyof T]?: VariantMatcher<keyof T[K]> | null | undefined
}

// ---------------------------------------------------------------------------
// 1. Multi-Slot Recipe Schema
// ---------------------------------------------------------------------------

export type SlotClasses<S extends string> = Partial<Record<S, ClassValue>>

export type SlotCompoundVariant<S extends string, V extends VariantSchema> =
  | { variants: VariantMatch<V>; class: SlotClasses<S> }
  | (VariantMatch<V> & { class: SlotClasses<S>; variants?: never })

export interface SlotRecipeOptions<
  S extends string,
  V extends Record<string, Record<string, SlotClasses<S>>> = Record<
    string,
    Record<string, SlotClasses<S>>
  >,
> {
  slots: readonly S[] | S[]
  base?: SlotClasses<S>
  variants?: V
  compoundVariants?: Array<SlotCompoundVariant<S, V>>
  defaultVariants?: VariantSelection<V>
}

export type SlotFn = (...extraClasses: ClassValue[]) => string | undefined

export type SlotFns<S extends string> = Record<S, SlotFn> & {
  /** Pre-resolved dictionary of slot classes for bulk consumption */
  classes: Record<S, string | undefined>
}

export interface SlotRecipeFn<S extends string, V extends VariantSchema> {
  (variants?: VariantSelection<V>): SlotFns<S>
  slots: readonly S[]
}

// ---------------------------------------------------------------------------
// 2. Atomic Single-Element Recipe Schema
// ---------------------------------------------------------------------------

export type AtomicCompoundVariant<V extends VariantSchema> =
  | { variants: VariantMatch<V>; class: ClassValue }
  | (VariantMatch<V> & { class: ClassValue; variants?: never })

export interface AtomicRecipeOptions<
  V extends Record<string, Record<string, ClassValue>> = Record<string, Record<string, ClassValue>>,
> {
  base?: ClassValue
  variants?: V
  compoundVariants?: Array<AtomicCompoundVariant<V>>
  defaultVariants?: VariantSelection<V>
}

export interface AtomicRecipeFn<V extends VariantSchema> {
  (variants?: VariantSelection<V>, ...extraClasses: ClassValue[]): string | undefined
}

// ---------------------------------------------------------------------------
// 3. VariantProps Extractor
// ---------------------------------------------------------------------------

export type VariantProps<T> =
  T extends SlotRecipeFn<infer _S, infer V>
    ? VariantSelection<V>
    : T extends AtomicRecipeFn<infer V>
      ? VariantSelection<V>
      : never

// ---------------------------------------------------------------------------
// 4. Shared Runtime Resolution
// ---------------------------------------------------------------------------

function getCompoundVariantsRecord(cv: any): Record<string, unknown> {
  if (cv && typeof cv.variants === 'object' && cv.variants !== null) {
    return cv.variants
  }
  if (cv && typeof cv === 'object') {
    const { class: _, className: __, ...rest } = cv
    return rest
  }
  return {}
}

function toVariantString(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`
  }
  return typeof value === 'object' && value !== null ? JSON.stringify(value) : ''
}

function matchesVariants(
  activeVariants: Record<string, unknown>,
  expectedVariants: Record<string, unknown> | undefined,
): boolean {
  if (!expectedVariants) {
    return false
  }
  const entries = Object.entries(expectedVariants)
  if (entries.length === 0) {
    return false
  }
  return entries.every(([name, expected]) => {
    const actual = activeVariants[name]
    if (actual === undefined || actual === null) {
      return false
    }
    return Array.isArray(expected)
      ? expected.some((value) => toVariantString(value) === toVariantString(actual))
      : toVariantString(expected) === toVariantString(actual)
  })
}

export function createSlotRecipe<S extends string, V extends VariantSchema = VariantSchema>(
  options: SlotRecipeOptions<S, any>,
): SlotRecipeFn<S, V> {
  const slots = options.slots

  const recipeFn = ((variants?: VariantSelection<V>): SlotFns<S> => {
    const activeVariants: Record<string, unknown> = { ...options.defaultVariants }
    if (variants) {
      for (const [key, value] of Object.entries(variants)) {
        if (value !== undefined && value !== null) {
          activeVariants[key] = value
        }
      }
    }
    const slotClassMap = {} as Record<S, ClassValue[]>
    for (const slot of slots) {
      slotClassMap[slot] = options.base?.[slot] ? [options.base[slot]] : []
    }

    if (options.variants) {
      for (const [variantName, variantMap] of Object.entries(options.variants)) {
        const selectedValue = activeVariants[variantName]
        if (selectedValue !== undefined && selectedValue !== null) {
          const selectedSlots = (variantMap as Record<string, SlotClasses<S>>)[
            toVariantString(selectedValue)
          ]
          if (selectedSlots) {
            for (const [slot, classValue] of Object.entries(selectedSlots)) {
              if (classValue) {
                slotClassMap[slot as S]?.push(classValue as ClassValue)
              }
            }
          }
        }
      }
    }

    for (const compoundVariant of options.compoundVariants ?? []) {
      if (matchesVariants(activeVariants, getCompoundVariantsRecord(compoundVariant))) {
        for (const [slot, classValue] of Object.entries(compoundVariant.class)) {
          if (classValue) {
            slotClassMap[slot as S]?.push(classValue as ClassValue)
          }
        }
      }
    }

    const resolvedClasses = {} as Record<S, string | undefined>
    const result = { classes: resolvedClasses } as Record<string, unknown>
    for (const slot of slots) {
      const resolvedClass = cn(slotClassMap[slot]) || undefined
      resolvedClasses[slot] = resolvedClass
      result[slot] = (...extraClasses: ClassValue[]) => {
        if (extraClasses.length === 0) {
          return resolvedClass
        }
        return cn(resolvedClass, ...extraClasses) || undefined
      }
    }

    return result as unknown as SlotFns<S>
  }) as SlotRecipeFn<S, V>

  recipeFn.slots = slots
  return recipeFn
}

export function createAtomicRecipe<V extends VariantSchema = VariantSchema>(
  options: AtomicRecipeOptions<any>,
): AtomicRecipeFn<V> {
  return (variants?: VariantSelection<V>, ...extraClasses: ClassValue[]) => {
    const activeVariants: Record<string, unknown> = { ...options.defaultVariants }
    if (variants) {
      for (const [key, value] of Object.entries(variants)) {
        if (value !== undefined && value !== null) {
          activeVariants[key] = value
        }
      }
    }
    const classes: ClassValue[] = options.base ? [options.base] : []

    if (options.variants) {
      for (const [variantName, variantMap] of Object.entries(options.variants)) {
        const selectedValue = activeVariants[variantName]
        if (selectedValue !== undefined && selectedValue !== null) {
          const selectedClass = (variantMap as Record<string, ClassValue>)[
            toVariantString(selectedValue)
          ]
          if (selectedClass) {
            classes.push(selectedClass)
          }
        }
      }
    }

    for (const compoundVariant of options.compoundVariants ?? []) {
      if (
        matchesVariants(activeVariants, getCompoundVariantsRecord(compoundVariant)) &&
        compoundVariant.class
      ) {
        classes.push(compoundVariant.class)
      }
    }

    return cn(classes, ...extraClasses) || undefined
  }
}

export function recipe<S extends string, V extends Record<string, Record<string, SlotClasses<S>>>>(
  options: SlotRecipeOptions<S, V>,
): SlotRecipeFn<S, V>
export function recipe<V extends Record<string, Record<string, ClassValue>>>(
  options: AtomicRecipeOptions<V>,
): AtomicRecipeFn<V>
export function recipe(
  options: SlotRecipeOptions<string, any> | AtomicRecipeOptions<any>,
): SlotRecipeFn<string, any> | AtomicRecipeFn<any> {
  if ('slots' in options) {
    return createSlotRecipe(options)
  }
  return createAtomicRecipe(options)
}
