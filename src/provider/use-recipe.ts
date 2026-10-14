import type { ClassValue } from 'cn'
import type { JSX } from 'solid-js'
import { createMemo, getOwner } from 'solid-js'
import { isServer } from 'solid-js/web'

import { createLazyMemo } from '../shared/create-lazy-memo'
import type { Cn } from '../theme/cn'
import type {
  RecipeContribution,
  RecipeDefinition,
  RecipeLayerConfig,
  RecipeSlots,
  RecipeVariant,
  RecipeVariantSelection,
  ResolvedRecipe,
} from '../theme/recipe'
import { getRecipeDefaultVariants } from '../theme/recipe'
import type { SlotClassValue } from '../theme/style-types'

import { useMoraineContext } from './moraine-context'

const EMPTY = /* @__PURE__ */ Object.freeze({})

export type SlotValue = {
  class?: SlotClassValue
  style?: JSX.CSSProperties
}

/** Ancestor or caller slot class/style overrides passed through Context. */
export interface SlotOverrides<S extends string = string> {
  classes?: Partial<Record<S, SlotClassValue>>
  styles?: Partial<Record<S, JSX.CSSProperties>>
}

type VariantInput<V> = [V] extends [never] ? object : RecipeVariantSelection<V>
type ResolvedVariantInput<V> = [V] extends [never]
  ? object
  : { readonly [K in keyof V]-?: Exclude<V[K], undefined> }

type StyleProps<S extends string, V> = VariantInput<V> &
  SlotOverrides<S> & {
    class?: SlotClassValue
    style?: JSX.CSSProperties
  }

type CssVariables = Partial<Record<`--${string}`, string | number | null | undefined>>

export interface UseRecipeOptions<S extends string, V> {
  /** Root slot that receives `class` / `style` props. Defaults to `root`. */
  slot?: S
  /** Receives recipe and instance CSS variables. Defaults to `root`, or `slot` when no root exists. */
  varsSlot?: S
  /** Instance CSS variables for `varsSlot`. Applied after recipe keys and before context/caller styles. */
  vars?: () => CssVariables | undefined
  /** Fallback variant values from an ancestor Context when props omit them. */
  contextVariants?: () => Partial<V> | VariantInput<V> | undefined
  /** Slot class/style overrides from an ancestor Context. */
  contextSlots?: () => SlotOverrides<S> | undefined
  /** Component-owned presentation the user may still override. */
  own?: () => Partial<Record<S, SlotValue>> | undefined
  /** Functional styles that must win over user overrides (layout, virtualization, a11y). */
  enforced?: () => Partial<Record<S, SlotValue>> | undefined
}

export type CreateStylesOptions<S extends string, V> = UseRecipeOptions<S, V>

type RequiredSlotOptions<S extends string, V> = 'root' extends S
  ? UseRecipeOptions<S, V>
  : UseRecipeOptions<S, V> & { slot: S }

export interface SlotBinding {
  readonly class: string | undefined
  readonly style: JSX.CSSProperties
}

type SlotBindings<S extends string> = { readonly [K in S]: SlotBinding }

export type SlotStylesHelper<S extends string> = {
  (): { readonly [K in S]: JSX.CSSProperties }
  <T extends S>(slots: readonly T[]): { readonly [K in T]: JSX.CSSProperties }
  <TargetSlot extends string>(
    mapping: Record<TargetSlot, S>,
  ): {
    readonly [K in TargetSlot]: JSX.CSSProperties
  }
} & {
  readonly [K in S]: JSX.CSSProperties
}

export type SlotClassesHelper<S extends string> = {
  (): { readonly [K in S]: string | undefined }
  <T extends S>(slots: readonly T[]): { readonly [K in T]: string | undefined }
  <TargetSlot extends string>(
    mapping: Record<TargetSlot, S>,
  ): {
    readonly [K in TargetSlot]: string | undefined
  }
} & {
  readonly [K in S]: string | undefined
}

export type SlotOverridesHelper<S extends string> = {
  (): SlotOverrides<S>
  <T extends S>(slots: readonly T[]): SlotOverrides<T>
  <TargetSlot extends string>(mapping: Record<TargetSlot, S>): SlotOverrides<TargetSlot>
}

export type UseRecipeResult<R extends RecipeDefinition> = {
  slots: SlotBindings<Extract<keyof RecipeSlots<R>, string>>
  variants: ResolvedVariantInput<RecipeVariant<R>>
  slotWith: (
    slot: Extract<keyof RecipeSlots<R>, string>,
    extra?: () => SlotValue | undefined,
    enforcedExtra?: () => SlotValue | undefined,
  ) => SlotBinding
  styles: SlotStylesHelper<Extract<keyof RecipeSlots<R>, string>>
  classes: SlotClassesHelper<Extract<keyof RecipeSlots<R>, string>>
  overrides: SlotOverridesHelper<Extract<keyof RecipeSlots<R>, string>>
}

export type CreateStylesResult<R extends RecipeDefinition> = UseRecipeResult<R>

/** Picks `{ classes, styles }` from props for Context `slotOverrides`. */
export function pickSlotOverrides<S extends string>(props: {
  classes?: Partial<Record<S, SlotClassValue>>
  styles?: Partial<Record<S, JSX.CSSProperties>>
}): SlotOverrides<S> {
  return {
    get classes() {
      return props.classes
    },
    get styles() {
      return props.styles
    },
  }
}

function resolveCssVariables(
  values: CssVariables | undefined,
): Partial<Record<`--${string}`, string | number>> | undefined {
  if (values === undefined) {
    return undefined
  }
  const style: Partial<Record<`--${string}`, string | number>> = {}
  let hasValue = false
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) {
      continue
    }
    style[key as `--${string}`] = value
    hasValue = true
  }
  return hasValue ? style : undefined
}

function resolveRootSlot<S extends string>(slots: readonly string[], rootSlot: S | undefined): S {
  if (rootSlot !== undefined) {
    return rootSlot
  }
  const root = slots.find((name) => name === 'root')
  if (root === undefined) {
    throw new Error('useRecipe requires slot for recipes without a root slot')
  }
  return root as S
}

function shallowEqualStyle(prev: JSX.CSSProperties, next: JSX.CSSProperties): boolean {
  if (prev === next) {
    return true
  }
  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)
  if (prevKeys.length !== nextKeys.length) {
    return false
  }
  for (const key of nextKeys) {
    if ((prev as Record<string, unknown>)[key] !== (next as Record<string, unknown>)[key]) {
      return false
    }
  }
  return true
}

function assignDefinedStyle(
  target: Record<string, unknown>,
  source: Record<string, unknown> | undefined,
): void {
  if (!source) {
    return
  }
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || value === null) {
      continue
    }
    target[key] = value
  }
}

type ActiveVariants = Record<string, string>

function readActiveVariants(keys: readonly string[], variants: object): ActiveVariants {
  const active: ActiveVariants = {}
  for (const key of keys) {
    const value = (variants as Record<string, unknown>)[key]
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      active[key] = String(value)
    }
  }
  return active
}

function matchesVariants(activeVariants: ActiveVariants, expectedVariants: object): boolean {
  const entries = Object.entries(expectedVariants) as [
    string,
    string | number | boolean | readonly (string | number | boolean)[] | null | undefined,
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

interface CompiledRecipe {
  readonly slots: readonly string[]
  readonly layers: readonly RecipeLayerConfig<object, unknown>[]
  readonly slotClassVariantKeys: ReadonlyMap<string, readonly string[]>
  readonly varVariantKeys: readonly string[]
  readonly allVariantKeys: readonly string[]
}

const compileCache = new WeakMap<object, CompiledRecipe>()

function getLayers(
  recipe: RecipeDefinition | ResolvedRecipe,
): readonly RecipeLayerConfig<object, unknown>[] {
  return ('layers' in recipe ? recipe.layers : [recipe.config]) as readonly RecipeLayerConfig<
    object,
    unknown
  >[]
}

function compileRecipe(recipe: RecipeDefinition | ResolvedRecipe): CompiledRecipe {
  const cached = compileCache.get(recipe)
  if (cached) {
    return cached
  }

  const definition = 'layers' in recipe ? recipe.definition : recipe
  const layers = getLayers(recipe)
  const slots = definition.slots
  const slotClassKeys = new Map<string, Set<string>>()
  for (const slot of slots) {
    slotClassKeys.set(slot, new Set())
  }
  const varKeys = new Set<string>()
  const allVariantKeys = new Set<string>([
    ...Object.keys(definition.config.defaultVariants ?? {}),
    ...Object.keys(definition.config.variants ?? {}),
    ...(definition.config.compoundVariants ?? []).flatMap((compound) =>
      Object.keys(compound.variants),
    ),
  ])

  const noteContribution = (
    contribution: RecipeContribution<object> | undefined,
    variantNames: readonly string[],
  ) => {
    for (const key of Object.keys(contribution ?? {})) {
      if (key === 'variants') {
        continue
      }
      if (key.startsWith('--')) {
        for (const name of variantNames) {
          varKeys.add(name)
        }
      } else {
        const keys = slotClassKeys.get(key)
        if (!keys) {
          continue
        }
        for (const name of variantNames) {
          keys.add(name)
        }
      }
    }
  }

  for (const layer of layers) {
    for (const [name, value] of Object.entries(layer.defaultVariants ?? {})) {
      if (value !== undefined) {
        allVariantKeys.add(name)
      }
    }
    for (const name of Object.keys(layer.variants ?? {})) {
      allVariantKeys.add(name)
    }
    noteContribution(layer.base, [])
    for (const [variantName, values] of Object.entries(layer.variants ?? {})) {
      for (const contribution of Object.values(values ?? {})) {
        noteContribution(contribution as RecipeContribution<object>, [variantName])
      }
    }
    for (const compound of layer.compoundVariants ?? []) {
      const matchKeys = Object.keys(compound.variants)
      for (const name of matchKeys) {
        allVariantKeys.add(name)
      }
      const { variants: _variants, ...contribution } = compound
      noteContribution(contribution, matchKeys)
    }
  }

  const compiled: CompiledRecipe = {
    slots,
    layers,
    slotClassVariantKeys: new Map(
      [...slotClassKeys.entries()].map(([slot, keys]) => [slot, Object.freeze([...keys])]),
    ),
    varVariantKeys: Object.freeze([...varKeys]),
    allVariantKeys: Object.freeze([...allVariantKeys]),
  }
  compileCache.set(recipe, compiled)
  return compiled
}

function resolveSlotClasses(
  compiled: CompiledRecipe,
  slot: string,
  activeVariants: ActiveVariants,
  merge: Cn,
): string | undefined {
  const parts: ClassValue[] = []
  for (const layer of compiled.layers) {
    const base = layer.base as Record<string, unknown> | undefined
    const baseClass = base?.[slot]
    if (baseClass !== undefined) {
      parts.push(baseClass)
    }
    for (const [name, values] of Object.entries(layer.variants ?? {})) {
      const selected = activeVariants[name]
      if (selected === undefined) {
        continue
      }
      const contribution = (values as Record<string, Record<string, unknown>>)?.[selected]
      const slotClass = contribution?.[slot]
      if (slotClass !== undefined) {
        parts.push(slotClass)
      }
    }
    for (const compound of layer.compoundVariants ?? []) {
      if (!matchesVariants(activeVariants, compound.variants)) {
        continue
      }
      const slotClass = (compound as Record<string, unknown>)[slot]
      if (slotClass !== undefined) {
        parts.push(slotClass)
      }
    }
  }
  return parts.length > 0 ? merge(parts) : undefined
}

function resolveRecipeVars(
  compiled: CompiledRecipe,
  activeVariants: ActiveVariants,
): Partial<Record<`--${string}`, string | number>> | undefined {
  const style: Partial<Record<`--${string}`, string | number>> = {}
  let hasValue = false
  const apply = (contribution: Record<string, unknown> | undefined) => {
    for (const [key, value] of Object.entries(contribution ?? {})) {
      if (!key.startsWith('--') || value === undefined || value === null || key === 'variants') {
        continue
      }
      style[key as `--${string}`] = value as string | number
      hasValue = true
    }
  }
  for (const layer of compiled.layers) {
    apply(layer.base)
    for (const [name, values] of Object.entries(layer.variants ?? {})) {
      const selected = activeVariants[name]
      if (selected === undefined) {
        continue
      }
      apply((values as Record<string, Record<string, unknown>>)?.[selected])
    }
    for (const compound of layer.compoundVariants ?? []) {
      if (!matchesVariants(activeVariants, compound.variants)) {
        continue
      }
      const { variants: _variants, ...contribution } = compound
      apply(contribution)
    }
  }
  return hasValue ? style : undefined
}

/** Resolves one component recipe into reactive, stable slot bindings and variant selections. */
export function useRecipe<R extends RecipeDefinition>(
  recipe: R,
  props: StyleProps<Extract<keyof RecipeSlots<R>, string>, RecipeVariant<R>>,
  ...args: 'root' extends Extract<keyof RecipeSlots<R>, string>
    ? [options?: RequiredSlotOptions<Extract<keyof RecipeSlots<R>, string>, RecipeVariant<R>>]
    : [options: RequiredSlotOptions<Extract<keyof RecipeSlots<R>, string>, RecipeVariant<R>>]
): UseRecipeResult<R> {
  type Slots = Extract<keyof RecipeSlots<R>, string>
  type Variants = RecipeVariant<R>
  const options = (args[0] ?? {}) as RequiredSlotOptions<Slots, Variants>
  const context = useMoraineContext()
  const cn: Cn = (...classes) => context.cn(...classes)
  const resolvedRecipe = createMemo(() => context.resolver.resolve(recipe))
  const compiled = createMemo(() => compileRecipe(resolvedRecipe()))
  const defaultVariants = createMemo(() => getRecipeDefaultVariants(resolvedRecipe()) ?? EMPTY)

  const owner = getOwner()
  const seedVariantKeys = new Set<string>([
    ...Object.keys(recipe.config.defaultVariants ?? {}),
    ...Object.keys(recipe.config.variants ?? {}),
    ...(recipe.config.compoundVariants ?? []).flatMap((compound) => Object.keys(compound.variants)),
  ])
  const variants = {} as ResolvedVariantInput<Variants>
  const ensureVariant = (key: string) => {
    if (Object.prototype.hasOwnProperty.call(variants, key)) {
      return
    }
    const selection = createLazyMemo(
      () => {
        const supplied = (props as Record<string, unknown>)[key]
        if (supplied !== undefined) {
          return supplied
        }
        const contextVal = (options.contextVariants?.() as Record<string, unknown> | undefined)?.[
          key
        ]
        return contextVal === undefined
          ? (defaultVariants() as Record<string, unknown>)[key]
          : contextVal
      },
      { owner },
    )
    Object.defineProperty(variants, key, {
      enumerable: true,
      configurable: true,
      get: selection,
    })
  }
  for (const key of seedVariantKeys) {
    ensureVariant(key)
  }

  const rootSlot = resolveRootSlot(recipe.slots, options.slot)
  const recipeStyleSlot =
    options.varsSlot ?? (recipe.slots.includes('root') ? ('root' as Slots) : rootSlot)

  const slots = {} as { [Slot in Slots]: SlotBinding }
  const ssrCache = isServer
    ? new Map<string, { class?: string | undefined; style?: JSX.CSSProperties }>()
    : undefined

  // Fine-grained per-slot recipe class memoization
  const recipeClassMemos = !isServer ? new Map<Slots, () => string | undefined>() : undefined
  function getRecipeSlotClassMemo(slot: Slots): () => string | undefined {
    let memo = recipeClassMemos!.get(slot)
    if (!memo) {
      memo = createLazyMemo(
        () => {
          const current = compiled()
          const variantKeys = current.slotClassVariantKeys.get(slot) ?? []
          for (const key of variantKeys) {
            ensureVariant(key)
          }
          const active = readActiveVariants(variantKeys, variants)
          return resolveSlotClasses(current, slot, active, cn)
        },
        { owner },
      )
      recipeClassMemos!.set(slot, memo)
    }
    return memo
  }

  // Fine-grained recipe CSS variables memoization
  const recipeVarsMemo = !isServer
    ? createLazyMemo(
        () => {
          const current = compiled()
          for (const key of current.varVariantKeys) {
            ensureVariant(key)
          }
          const active = readActiveVariants(current.varVariantKeys, variants)
          return resolveRecipeVars(current, active)
        },
        {
          owner,
          equals: (prev, next) => {
            if (prev === next) {
              return true
            }
            if (!prev || !next) {
              return false
            }
            return shallowEqualStyle(prev, next)
          },
        },
      )
    : undefined

  // Fine-grained instance CSS variables memoization
  const instanceVarsMemo = !isServer
    ? createLazyMemo(() => resolveCssVariables(options.vars?.()), {
        owner,
        equals: (prev, next) => {
          if (prev === next) {
            return true
          }
          if (!prev || !next) {
            return false
          }
          return shallowEqualStyle(prev, next)
        },
      })
    : undefined

  // Fine-grained per-slot own / context / enforced layer readers with memo equality isolation
  const ownClassMemos = !isServer ? new Map<Slots, () => ClassValue>() : undefined
  function getOwnClass(slot: Slots): () => ClassValue {
    let memo = ownClassMemos!.get(slot)
    if (!memo) {
      memo = createLazyMemo(() => options.own?.()?.[slot]?.class, { owner })
      ownClassMemos!.set(slot, memo)
    }
    return memo
  }

  const ownStyleMemos = !isServer
    ? new Map<Slots, () => JSX.CSSProperties | undefined>()
    : undefined
  function getOwnStyle(slot: Slots): () => JSX.CSSProperties | undefined {
    let memo = ownStyleMemos!.get(slot)
    if (!memo) {
      memo = createLazyMemo(() => options.own?.()?.[slot]?.style, {
        owner,
        equals: (prev, next) => {
          if (prev === next) {
            return true
          }
          if (!prev || !next) {
            return false
          }
          return shallowEqualStyle(prev, next)
        },
      })
      ownStyleMemos!.set(slot, memo)
    }
    return memo
  }

  const enforcedClassMemos = !isServer ? new Map<Slots, () => ClassValue>() : undefined
  function getEnforcedClass(slot: Slots): () => ClassValue {
    let memo = enforcedClassMemos!.get(slot)
    if (!memo) {
      memo = createLazyMemo(() => options.enforced?.()?.[slot]?.class, { owner })
      enforcedClassMemos!.set(slot, memo)
    }
    return memo
  }

  const enforcedStyleMemos = !isServer
    ? new Map<Slots, () => JSX.CSSProperties | undefined>()
    : undefined
  function getEnforcedStyle(slot: Slots): () => JSX.CSSProperties | undefined {
    let memo = enforcedStyleMemos!.get(slot)
    if (!memo) {
      memo = createLazyMemo(() => options.enforced?.()?.[slot]?.style, {
        owner,
        equals: (prev, next) => {
          if (prev === next) {
            return true
          }
          if (!prev || !next) {
            return false
          }
          return shallowEqualStyle(prev, next)
        },
      })
      enforcedStyleMemos!.set(slot, memo)
    }
    return memo
  }

  const contextClassMemos = !isServer ? new Map<Slots, () => ClassValue>() : undefined
  function getContextClass(slot: Slots): () => ClassValue {
    let memo = contextClassMemos!.get(slot)
    if (!memo) {
      memo = createLazyMemo(() => options.contextSlots?.()?.classes?.[slot], { owner })
      contextClassMemos!.set(slot, memo)
    }
    return memo
  }

  const contextStyleMemos = !isServer
    ? new Map<Slots, () => JSX.CSSProperties | undefined>()
    : undefined
  function getContextStyle(slot: Slots): () => JSX.CSSProperties | undefined {
    let memo = contextStyleMemos!.get(slot)
    if (!memo) {
      memo = createLazyMemo(() => options.contextSlots?.()?.styles?.[slot], {
        owner,
        equals: (prev, next) => {
          if (prev === next) {
            return true
          }
          if (!prev || !next) {
            return false
          }
          return shallowEqualStyle(prev, next)
        },
      })
      contextStyleMemos!.set(slot, memo)
    }
    return memo
  }

  function computeSlotClass(slot: Slots): string | undefined {
    if (isServer) {
      const current = compiled()
      const variantKeys = current.slotClassVariantKeys.get(slot) ?? []
      for (const key of variantKeys) {
        ensureVariant(key)
      }
      const active = readActiveVariants(variantKeys, variants)
      const recipeClass = resolveSlotClasses(current, slot, active, cn)
      const contextSlot = options.contextSlots?.()
      const ownSlot = options.own?.()?.[slot]
      const enforcedSlot = options.enforced?.()?.[slot]
      return cn(
        recipeClass,
        contextSlot?.classes?.[slot],
        ownSlot?.class,
        props.classes?.[slot],
        slot === rootSlot ? props.class : undefined,
        enforcedSlot?.class,
      )
    }

    const recipeClass = getRecipeSlotClassMemo(slot)()
    const contextClass = getContextClass(slot)()
    const ownClass = getOwnClass(slot)()
    const enforcedClass = getEnforcedClass(slot)()
    return cn(
      recipeClass,
      contextClass,
      ownClass,
      props.classes?.[slot],
      slot === rootSlot ? props.class : undefined,
      enforcedClass,
    )
  }

  function computeSlotStyle(slot: Slots): JSX.CSSProperties {
    if (isServer) {
      const current = compiled()
      const isVarsSlot = slot === recipeStyleSlot
      if (isVarsSlot) {
        for (const key of current.varVariantKeys) {
          ensureVariant(key)
        }
      }
      const active = isVarsSlot
        ? readActiveVariants(current.varVariantKeys, variants)
        : (EMPTY as ActiveVariants)
      const merged: Record<string, unknown> = {}
      if (isVarsSlot) {
        assignDefinedStyle(merged, resolveRecipeVars(current, active))
        assignDefinedStyle(merged, resolveCssVariables(options.vars?.()))
      }
      const contextSlot = options.contextSlots?.()
      const ownSlot = options.own?.()?.[slot]
      const enforcedSlot = options.enforced?.()?.[slot]
      assignDefinedStyle(merged, contextSlot?.styles?.[slot] as Record<string, unknown> | undefined)
      assignDefinedStyle(merged, ownSlot?.style as Record<string, unknown> | undefined)
      assignDefinedStyle(merged, props.styles?.[slot] as Record<string, unknown> | undefined)
      if (slot === rootSlot) {
        assignDefinedStyle(merged, props.style as Record<string, unknown> | undefined)
      }
      assignDefinedStyle(merged, enforcedSlot?.style as Record<string, unknown> | undefined)
      return merged as JSX.CSSProperties
    }

    const isVarsSlot = slot === recipeStyleSlot
    const merged: Record<string, unknown> = {}
    if (isVarsSlot) {
      assignDefinedStyle(merged, recipeVarsMemo!())
      assignDefinedStyle(merged, instanceVarsMemo!())
    }
    assignDefinedStyle(merged, getContextStyle(slot)() as Record<string, unknown> | undefined)
    assignDefinedStyle(merged, getOwnStyle(slot)() as Record<string, unknown> | undefined)
    assignDefinedStyle(merged, props.styles?.[slot] as Record<string, unknown> | undefined)
    if (slot === rootSlot) {
      assignDefinedStyle(merged, props.style as Record<string, unknown> | undefined)
    }
    assignDefinedStyle(merged, getEnforcedStyle(slot)() as Record<string, unknown> | undefined)
    return merged as JSX.CSSProperties
  }

  function createSlotBinding(slot: Slots): SlotBinding {
    if (isServer) {
      return {
        get class() {
          const cached = ssrCache!.get(slot)
          if (cached && 'class' in cached) {
            return cached.class
          }
          const value = computeSlotClass(slot)
          const entry = ssrCache!.get(slot) ?? {}
          entry.class = value
          ssrCache!.set(slot, entry)
          return value
        },
        get style() {
          const cached = ssrCache!.get(slot)
          if (cached && 'style' in cached) {
            return cached.style!
          }
          const value = computeSlotStyle(slot)
          const entry = ssrCache!.get(slot) ?? {}
          entry.style = value
          ssrCache!.set(slot, entry)
          return value
        },
      }
    }

    const classMemo = createLazyMemo(computeSlotClass.bind(null, slot), { owner })
    const styleMemo = createLazyMemo(computeSlotStyle.bind(null, slot), {
      owner,
      equals: shallowEqualStyle,
    })
    return {
      get class() {
        return classMemo()
      },
      get style() {
        return styleMemo()
      },
    }
  }

  for (const slot of recipe.slots as readonly Slots[]) {
    slots[slot] = createSlotBinding(slot)
  }

  function slotWith(
    slot: Slots,
    extra?: () => SlotValue | undefined,
    enforcedExtra?: () => SlotValue | undefined,
  ): SlotBinding {
    const parent = slots[slot]
    if (isServer) {
      return {
        get class() {
          return cn(parent.class, extra?.()?.class, enforcedExtra?.()?.class)
        },
        get style() {
          const merged: Record<string, unknown> = { ...(parent.style as Record<string, unknown>) }
          assignDefinedStyle(merged, extra?.()?.style as Record<string, unknown> | undefined)
          assignDefinedStyle(
            merged,
            enforcedExtra?.()?.style as Record<string, unknown> | undefined,
          )
          return merged as JSX.CSSProperties
        },
      }
    }

    // createLazyMemo captures the For-item owner at call time.
    const classMemo = createLazyMemo(() =>
      cn(parent.class, extra?.()?.class, enforcedExtra?.()?.class),
    )
    const styleMemo = createLazyMemo(
      () => {
        const merged: Record<string, unknown> = { ...(parent.style as Record<string, unknown>) }
        assignDefinedStyle(merged, extra?.()?.style as Record<string, unknown> | undefined)
        assignDefinedStyle(merged, enforcedExtra?.()?.style as Record<string, unknown> | undefined)
        return merged as JSX.CSSProperties
      },
      { equals: shallowEqualStyle },
    )
    return {
      get class() {
        return classMemo()
      },
      get style() {
        return styleMemo()
      },
    }
  }

  function createStyleMapping<TargetSlot extends string>(
    mapping?: readonly Slots[] | Record<TargetSlot, Slots>,
  ): Record<string, JSX.CSSProperties> {
    const result = {} as Record<string, JSX.CSSProperties>
    if (mapping === undefined) {
      for (const slot of recipe.slots as readonly Slots[]) {
        Object.defineProperty(result, slot, {
          enumerable: true,
          configurable: true,
          get: () => slots[slot].style,
        })
      }
    } else if (Array.isArray(mapping)) {
      for (const slot of mapping) {
        Object.defineProperty(result, slot, {
          enumerable: true,
          configurable: true,
          get: () => slots[slot as Slots].style,
        })
      }
    } else {
      for (const [targetSlot, sourceSlot] of Object.entries(mapping)) {
        Object.defineProperty(result, targetSlot, {
          enumerable: true,
          configurable: true,
          get: () => slots[sourceSlot].style,
        })
      }
    }
    return result
  }

  function createClassMapping<TargetSlot extends string>(
    mapping?: readonly Slots[] | Record<TargetSlot, Slots>,
  ): Record<string, string | undefined> {
    const result = {} as Record<string, string | undefined>
    if (mapping === undefined) {
      for (const slot of recipe.slots as readonly Slots[]) {
        Object.defineProperty(result, slot, {
          enumerable: true,
          configurable: true,
          get: () => slots[slot].class,
        })
      }
    } else if (Array.isArray(mapping)) {
      for (const slot of mapping) {
        Object.defineProperty(result, slot, {
          enumerable: true,
          configurable: true,
          get: () => slots[slot as Slots].class,
        })
      }
    } else {
      for (const [targetSlot, sourceSlot] of Object.entries(mapping)) {
        Object.defineProperty(result, targetSlot, {
          enumerable: true,
          configurable: true,
          get: () => slots[sourceSlot].class,
        })
      }
    }
    return result
  }

  const styles = function styles<TargetSlot extends string>(
    mapping?: readonly Slots[] | Record<TargetSlot, Slots>,
  ) {
    return createStyleMapping(mapping)
  } as unknown as SlotStylesHelper<Slots>

  for (const slot of recipe.slots as readonly Slots[]) {
    Object.defineProperty(styles, slot, {
      enumerable: true,
      configurable: true,
      get: () => slots[slot].style,
    })
  }

  const classes = function classes<TargetSlot extends string>(
    mapping?: readonly Slots[] | Record<TargetSlot, Slots>,
  ) {
    return createClassMapping(mapping)
  } as unknown as SlotClassesHelper<Slots>

  for (const slot of recipe.slots as readonly Slots[]) {
    Object.defineProperty(classes, slot, {
      enumerable: true,
      configurable: true,
      get: () => slots[slot].class,
    })
  }

  const overrides = function overrides<TargetSlot extends string>(
    mapping?: readonly Slots[] | Record<TargetSlot, Slots>,
  ) {
    return {
      classes: createClassMapping(mapping),
      styles: createStyleMapping(mapping),
    }
  } as unknown as SlotOverridesHelper<Slots>

  return { slots, variants, slotWith, styles, classes, overrides }
}

export { useRecipe as createStyles }
