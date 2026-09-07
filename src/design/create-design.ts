import type { ClassValue, SlotRecipeFn, SlotVariantSchema } from '../shared/style/recipe.ts'
import { createSlotRecipe } from '../shared/style/recipe.ts'
import { cn } from '../shared/utils.ts'

import { getOfficialDesignOptions } from './official-design.ts'
import { SLOT_SKELETONS } from './slots.ts'
import type {
  CompiledComponentDesign,
  ComponentDesignInput,
  CreateDesignOptions,
  MoraineDesign,
} from './types.ts'
import { DESIGN_OPTIONS } from './types.ts'

function cloneDeep<T>(val: T): T {
  if (val === null || typeof val !== 'object') {
    return val
  }
  if (Array.isArray(val)) {
    return val.map((item) => cloneDeep(item)) as unknown as T
  }
  const copy = {} as Record<string, unknown>
  for (const [k, v] of Object.entries(val)) {
    copy[k] = cloneDeep(v)
  }
  return copy as T
}

function mergeComponentOptions(
  slots: readonly string[],
  parent: ComponentDesignInput<string, any> | undefined,
  user: ComponentDesignInput<string, any> | undefined,
): ComponentDesignInput<string, any> {
  const allSlots = new Set<string>(slots)
  if (parent?.base) {
    for (const slot of Object.keys(parent.base)) {
      allSlots.add(slot)
    }
  }
  if (user?.base) {
    for (const slot of Object.keys(user.base)) {
      allSlots.add(slot)
    }
  }

  const mergedBase: Record<string, ClassValue> = {}
  for (const slot of allSlots) {
    const parentClass = parent?.base?.[slot]
    const userClass = user?.base?.[slot]
    mergedBase[slot] = cn(parentClass, userClass) ?? ''
  }

  const mergedVariants: Record<string, Record<string, Record<string, ClassValue>>> = {}
  if (parent?.variants) {
    for (const [variantName, values] of Object.entries(parent.variants)) {
      mergedVariants[variantName] = {}
      for (const [valKey, slotClasses] of Object.entries(
        values as Record<string, Record<string, ClassValue>>,
      )) {
        mergedVariants[variantName][valKey] = { ...slotClasses }
      }
    }
  }

  if (user?.variants) {
    for (const [variantName, values] of Object.entries(user.variants)) {
      if (!mergedVariants[variantName]) {
        mergedVariants[variantName] = {}
      }
      for (const [valKey, slotClasses] of Object.entries(
        values as Record<string, Record<string, ClassValue>>,
      )) {
        if (!mergedVariants[variantName][valKey]) {
          mergedVariants[variantName][valKey] = {}
        }
        for (const slot of allSlots) {
          const p = mergedVariants[variantName][valKey][slot]
          const u = slotClasses?.[slot]
          if (u !== undefined || p !== undefined) {
            mergedVariants[variantName][valKey][slot] = cn(p, u) ?? ''
          }
        }
      }
    }
  }

  const mergedCompoundVariants = [
    ...(parent?.compoundVariants ? cloneDeep(parent.compoundVariants) : []),
    ...(user?.compoundVariants ? cloneDeep(user.compoundVariants) : []),
  ]

  const mergedDefaultVariants = { ...parent?.defaultVariants }
  for (const [key, val] of Object.entries(user?.defaultVariants ?? {})) {
    if (val !== undefined) {
      mergedDefaultVariants[key] = val
    }
  }

  return {
    base: mergedBase,
    variants: Object.keys(mergedVariants).length > 0 ? mergedVariants : undefined,
    compoundVariants: mergedCompoundVariants.length > 0 ? mergedCompoundVariants : undefined,
    defaultVariants:
      Object.keys(mergedDefaultVariants).length > 0 ? mergedDefaultVariants : undefined,
  }
}

export function createDesign(options?: CreateDesignOptions): MoraineDesign {
  const isExtending = Boolean(options?.extends)
  const baseOptions = isExtending
    ? (options!.extends![DESIGN_OPTIONS] ?? {})
    : options?.preset !== false
      ? getOfficialDesignOptions()
      : {}

  const normalizedStore: Record<string, ComponentDesignInput<string, any>> = {}
  const compiled = {} as Record<string, CompiledComponentDesign<string, any>>

  for (const [componentKey, slots] of Object.entries(SLOT_SKELETONS)) {
    const parent = baseOptions[componentKey]
    const user = (options as Record<string, any> | undefined)?.[componentKey]
    const merged = mergeComponentOptions(slots, parent, user)

    normalizedStore[componentKey] = merged

    const recipe = createSlotRecipe({
      base: merged.base ?? {},
      variants: merged.variants as SlotVariantSchema<string> | undefined,
      compoundVariants: merged.compoundVariants,
      defaultVariants: merged.defaultVariants,
    }) as SlotRecipeFn<string, any>

    compiled[componentKey] = {
      recipe,
      defaultVariants: merged.defaultVariants,
    }
  }

  Object.defineProperty(compiled, DESIGN_OPTIONS, {
    value: normalizedStore,
    enumerable: false,
    writable: false,
    configurable: false,
  })

  return Object.freeze(compiled) as unknown as MoraineDesign
}
