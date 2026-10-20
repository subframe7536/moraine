import type { ClassValue } from 'cn'
import type { JSX, Owner } from 'solid-js'
import { createMemo, getOwner } from 'solid-js'
import { isServer } from 'solid-js/web'

import { useMoraineContext } from '../provider/moraine-context'
import { createLazyMemo } from '../shared/create-lazy-memo'

import type { Cn } from './cn'
import { cn as defaultCn } from './cn'
import type {
  RecipeContribution,
  RecipeDefinition,
  RecipeLayerConfig,
  RecipeSlots,
  RecipeVariant,
  RecipeVariantSelection,
  ResolvedRecipe,
} from './recipe'
import { getRecipeDefaultVariants } from './recipe'
import type { SlotClassValue } from './style-types'

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

export type SlotLayerItem = SlotValue | (() => SlotValue | undefined)
export type SlotLayerAccessor<S extends string> =
  | Partial<{ [K in S]: SlotLayerItem }>
  | (() => Partial<Record<S, SlotValue>> | undefined)

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
  /** Component-owned presentation the user may still override. Supports per-slot accessor map for fine-grained reactivity. */
  own?: SlotLayerAccessor<S>
  /** Functional styles that must win over user overrides (layout, virtualization, a11y). Supports per-slot accessor map. */
  enforced?: SlotLayerAccessor<S>
}

type RequiredSlotOptions<S extends string, V> = 'root' extends S
  ? UseRecipeOptions<S, V>
  : UseRecipeOptions<S, V> & { slot: S }

export interface SlotBinding {
  readonly class: string | undefined
  readonly style: JSX.CSSProperties
}

type SlotBindings<S extends string> = { readonly [K in S]: SlotBinding }

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
  overrides: SlotOverridesHelper<Extract<keyof RecipeSlots<R>, string>>
}

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
  if (!values) {
    return undefined
  }
  const style: Partial<Record<`--${string}`, string | number>> = {}
  let hasValue = false
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) {
      style[key as `--${string}`] = value
      hasValue = true
    }
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

function shallowEqualStyle(
  prev: JSX.CSSProperties | undefined,
  next: JSX.CSSProperties | undefined,
): boolean {
  if (prev === next) {
    return true
  }
  if (!prev || !next) {
    return false
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
    if (value !== undefined && value !== null) {
      target[key] = value
    }
  }
}

function readLayerSlot<S extends string>(
  layer: SlotLayerAccessor<S> | undefined,
  slot: S,
): SlotValue | undefined {
  if (!layer) {
    return undefined
  }
  if (typeof layer === 'function') {
    return layer()?.[slot]
  }
  const entry = layer[slot]
  return typeof entry === 'function' ? entry() : entry
}

function createSlotMemos<S extends string>(
  readClass: (slot: S) => ClassValue,
  readStyle: (slot: S) => JSX.CSSProperties | undefined,
  owner: Owner | null,
) {
  const classMemos = new Map<S, () => ClassValue>()
  const styleMemos = new Map<S, () => JSX.CSSProperties | undefined>()
  return {
    getClass(slot: S): ClassValue {
      let memo = classMemos.get(slot)
      if (!memo) {
        memo = createLazyMemo(() => readClass(slot), { owner })
        classMemos.set(slot, memo)
      }
      return memo()
    },
    getStyle(slot: S): JSX.CSSProperties | undefined {
      let memo = styleMemos.get(slot)
      if (!memo) {
        memo = createLazyMemo(() => readStyle(slot), { owner, equals: shallowEqualStyle })
        styleMemos.set(slot, memo)
      }
      return memo()
    },
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
    if (!contribution) {
      return
    }
    for (const key of Object.keys(contribution)) {
      if (key === 'variants') {
        continue
      }
      if (key.startsWith('--')) {
        for (const name of variantNames) {
          varKeys.add(name)
        }
      } else {
        const keys = slotClassKeys.get(key)
        if (keys) {
          for (const name of variantNames) {
            keys.add(name)
          }
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
    const baseClass = (layer.base as Record<string, unknown> | undefined)?.[slot]
    if (baseClass !== undefined) {
      parts.push(baseClass)
    }
    for (const [name, values] of Object.entries(layer.variants ?? {})) {
      const selected = activeVariants[name]
      if (selected === undefined) {
        continue
      }
      const slotClass = (values as Record<string, Record<string, unknown>>)?.[selected]?.[slot]
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
    if (!contribution) {
      return
    }
    for (const [key, value] of Object.entries(contribution)) {
      if (key.startsWith('--') && value !== undefined && value !== null && key !== 'variants') {
        style[key as `--${string}`] = value as string | number
        hasValue = true
      }
    }
  }
  for (const layer of compiled.layers) {
    apply(layer.base)
    for (const [name, values] of Object.entries(layer.variants ?? {})) {
      const selected = activeVariants[name]
      if (selected !== undefined) {
        apply((values as Record<string, Record<string, unknown>>)?.[selected])
      }
    }
    for (const compound of layer.compoundVariants ?? []) {
      if (matchesVariants(activeVariants, compound.variants)) {
        const { variants: _variants, ...contribution } = compound
        apply(contribution)
      }
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
  const cn: Cn = context ? (...classes) => context.cn(...classes) : defaultCn
  const resolvedRecipe = createMemo(() => (context ? context.resolver.resolve(recipe) : recipe))
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
        equals: shallowEqualStyle,
      })
    : undefined

  const ownLayer =
    !isServer && options.own
      ? createSlotMemos<Slots>(
          (slot) => readLayerSlot(options.own, slot)?.class,
          (slot) => readLayerSlot(options.own, slot)?.style,
          owner,
        )
      : undefined
  const enforcedLayer =
    !isServer && options.enforced
      ? createSlotMemos<Slots>(
          (slot) => readLayerSlot(options.enforced, slot)?.class,
          (slot) => readLayerSlot(options.enforced, slot)?.style,
          owner,
        )
      : undefined
  const contextLayer =
    !isServer && options.contextSlots
      ? createSlotMemos<Slots>(
          (slot) => options.contextSlots?.()?.classes?.[slot],
          (slot) => options.contextSlots?.()?.styles?.[slot],
          owner,
        )
      : undefined

  function computeSlotClass(slot: Slots): string | undefined {
    if (isServer) {
      const current = compiled()
      const variantKeys = current.slotClassVariantKeys.get(slot) ?? []
      for (const key of variantKeys) {
        ensureVariant(key)
      }
      const active = readActiveVariants(variantKeys, variants)
      const recipeClass = resolveSlotClasses(current, slot, active, cn)
      return cn(
        recipeClass,
        options.contextSlots?.()?.classes?.[slot],
        readLayerSlot(options.own, slot)?.class,
        props.classes?.[slot],
        slot === rootSlot ? props.class : undefined,
        readLayerSlot(options.enforced, slot)?.class,
      )
    }

    const recipeClass = getRecipeSlotClassMemo(slot)()
    return cn(
      recipeClass,
      contextLayer?.getClass(slot),
      ownLayer?.getClass(slot),
      props.classes?.[slot],
      slot === rootSlot ? props.class : undefined,
      enforcedLayer?.getClass(slot),
    )
  }

  function computeSlotStyle(slot: Slots): JSX.CSSProperties {
    const isVarsSlot = slot === recipeStyleSlot
    const merged: Record<string, unknown> = {}

    if (isServer) {
      if (isVarsSlot) {
        const current = compiled()
        for (const key of current.varVariantKeys) {
          ensureVariant(key)
        }
        const active = readActiveVariants(current.varVariantKeys, variants)
        assignDefinedStyle(merged, resolveRecipeVars(current, active))
        assignDefinedStyle(merged, resolveCssVariables(options.vars?.()))
      }
      assignDefinedStyle(
        merged,
        options.contextSlots?.()?.styles?.[slot] as Record<string, unknown> | undefined,
      )
      assignDefinedStyle(
        merged,
        readLayerSlot(options.own, slot)?.style as Record<string, unknown> | undefined,
      )
      assignDefinedStyle(merged, props.styles?.[slot] as Record<string, unknown> | undefined)
      if (slot === rootSlot) {
        assignDefinedStyle(merged, props.style as Record<string, unknown> | undefined)
      }
      assignDefinedStyle(
        merged,
        readLayerSlot(options.enforced, slot)?.style as Record<string, unknown> | undefined,
      )
      return merged as JSX.CSSProperties
    }

    if (isVarsSlot) {
      assignDefinedStyle(merged, recipeVarsMemo!())
      assignDefinedStyle(merged, instanceVarsMemo!())
    }
    assignDefinedStyle(merged, contextLayer?.getStyle(slot) as Record<string, unknown> | undefined)
    assignDefinedStyle(merged, ownLayer?.getStyle(slot) as Record<string, unknown> | undefined)
    assignDefinedStyle(merged, props.styles?.[slot] as Record<string, unknown> | undefined)
    if (slot === rootSlot) {
      assignDefinedStyle(merged, props.style as Record<string, unknown> | undefined)
    }
    assignDefinedStyle(merged, enforcedLayer?.getStyle(slot) as Record<string, unknown> | undefined)
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

  function overrides<TargetSlot extends string>(
    mapping?: readonly Slots[] | Record<TargetSlot, Slots>,
  ): SlotOverrides<TargetSlot> {
    const classes = {} as Record<string, string | undefined>
    const styles = {} as Record<string, JSX.CSSProperties>
    const entries: [string, Slots][] =
      mapping === undefined
        ? (recipe.slots as readonly Slots[]).map((slot) => [slot, slot])
        : Array.isArray(mapping)
          ? mapping.map((slot) => [slot, slot as Slots])
          : Object.entries(mapping)

    for (const [target, source] of entries) {
      Object.defineProperty(classes, target, {
        enumerable: true,
        configurable: true,
        get: () => slots[source].class,
      })
      Object.defineProperty(styles, target, {
        enumerable: true,
        configurable: true,
        get: () => slots[source].style,
      })
    }
    return { classes, styles } as SlotOverrides<TargetSlot>
  }

  return { slots, variants, slotWith, overrides }
}
