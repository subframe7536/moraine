import type { ClassValue } from 'cn'
import type { Accessor, JSX, Owner } from 'solid-js'
import { getOwner } from 'solid-js'
import { isServer } from 'solid-js/web'

import { useMoraineContext } from '../provider/moraine-context'
import { createLazyMemo } from '../shared/create-lazy-memo'

import type { Cn } from './cn'
import { cn as defaultCn } from './cn'
import type {
  RecipeDefinition,
  RecipeSlots,
  RecipeVariants,
  RecipeVariantSelection,
} from './recipe'
import { compileRecipe, matchEntries } from './recipe'
import type { DataAttributeBag } from './style-contract'
import type { SlotClassValue } from './style-types'

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

/** Ancestor presentation: fallback variants plus slot overrides. */
export type RecipeContext<S extends string, V> = SlotOverrides<S> & {
  variants?: Partial<V> | VariantInput<V>
}

/** Per-slot accessors; each slot is memoized separately so slots do not invalidate each other. */
export type SlotLayer<S extends string> = { readonly [K in S]?: () => SlotValue | undefined }

type StyleProps<S extends string, V> = VariantInput<V> &
  SlotOverrides<S> & {
    class?: SlotClassValue
    style?: JSX.CSSProperties
  }

export interface UseRecipeOptions<S extends string, V> {
  /** Host slot that receives `class` / `style` props. Defaults to `root`. */
  slot?: S
  /** Receives recipe CSS variables. Defaults to `root`, or `slot` when the recipe has no root. */
  varsSlot?: S
  /** Ancestor Context presentation, below `own` and caller overrides. */
  context?: () => RecipeContext<S, V> | undefined
  /** Component-owned presentation the caller may still override. */
  own?: SlotLayer<S>
  /** Functional presentation that wins over caller overrides (layout, virtualization, a11y). */
  enforced?: SlotLayer<S>
  /**
   * Per-slot `data-*` getters from a `*DataAttributes.<slot>(() => state)` resolver. The binding
   * carries them, so the host spreads one object before `{...rest}`.
   */
  data?: SlotData<S>
}

/** Per-slot resolved `data-*` getters; the key set is fixed by the resolver. */
export type SlotData<S extends string> = { readonly [K in S]?: DataAttributeBag }

export interface SlotWithOptions {
  /** Item-owned presentation over the parent slot. */
  own?: () => SlotValue | undefined
  /** Item functional presentation that wins over `own`. */
  enforced?: () => SlotValue | undefined
  /** Item `data-*` getters, added after the parent slot's `data`. */
  data?: DataAttributeBag
}

type RequiredSlotOptions<S extends string, V> = 'root' extends S
  ? UseRecipeOptions<S, V>
  : UseRecipeOptions<S, V> & { slot: S }

export interface SlotBinding {
  readonly class: string | undefined
  readonly style: JSX.CSSProperties
}

type SlotBindings<S extends string> = { readonly [K in S]: SlotBinding }

export type UseRecipeResult<R extends RecipeDefinition> = {
  slots: SlotBindings<Extract<keyof RecipeSlots<R>, string>>
  variants: ResolvedVariantInput<RecipeVariants<R>>
  /** Per-item binding over a parent slot; call under the item owner. */
  slotWith: (slot: Extract<keyof RecipeSlots<R>, string>, options?: SlotWithOptions) => SlotBinding
  /** Forwards resolved slots to a sub-component as `{ classes, styles }`, keyed by target slot. */
  overrides: <T extends string>(
    mapping: Record<T, Extract<keyof RecipeSlots<R>, string>>,
  ) => SlotOverrides<T>
}

type Style = Record<string, unknown>

/** Picks `{ classes, styles }` from props as live getters for a Context `slotOverrides` value. */
export function pickSlotOverrides<S extends string>(props: SlotOverrides<S>): SlotOverrides<S> {
  return {
    get classes() {
      return props.classes
    },
    get styles() {
      return props.styles
    },
  }
}

/** Client: lazy memo under `owner`. Server: the plain computation, evaluated on every read. */
function memo<T>(
  fn: () => T,
  owner: Owner | null,
  equals?: (prev: T, next: T) => boolean,
): Accessor<T> {
  return isServer ? fn : createLazyMemo(fn, { owner, equals })
}

function sameStyle(prev: object | undefined, next: object | undefined): boolean {
  if (prev === next) {
    return true
  }
  if (!prev || !next) {
    return false
  }
  const keys = Object.keys(next)
  return (
    Object.keys(prev).length === keys.length &&
    keys.every((key) => (prev as Style)[key] === (next as Style)[key])
  )
}

function sameSlotValue(prev: SlotValue | undefined, next: SlotValue | undefined): boolean {
  return (
    prev === next ||
    (!!prev && !!next && prev.class === next.class && sameStyle(prev.style, next.style))
  )
}

/** Later sources win; `undefined` / `null` values never overwrite earlier ones. */
function mergeStyles(...sources: (object | undefined)[]): JSX.CSSProperties {
  const style: Style = {}
  for (const source of sources) {
    for (const key in source) {
      const value = (source as Style)[key]
      if (value !== undefined && value !== null) {
        style[key] = value
      }
    }
  }
  return style as JSX.CSSProperties
}

function isEmptyStyle(style: JSX.CSSProperties): boolean {
  for (const _key in style) {
    return false
  }
  return true
}

/**
 * Client: one object with fixed keys (`class`, `style`, then each `data-*`) as getters, so a
 * plain-object `mergeProps` keeps every key reactive.
 * Server: a view whose keys are computed when the element renders and omit an empty `class` /
 * `style`, because `ssrElement` prints `style=""` for any present `style` key.
 */
function binding(
  cls: Accessor<string | undefined>,
  style: Accessor<JSX.CSSProperties>,
  data: (DataAttributeBag | undefined)[],
): SlotBinding {
  const target = {
    get class() {
      return cls()
    },
    get style() {
      return style()
    },
  }
  for (const bag of data) {
    if (bag) {
      for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(bag))) {
        Object.defineProperty(target, key, { ...descriptor, configurable: true })
      }
    }
  }
  if (!isServer) {
    return target
  }
  const keys = () =>
    Reflect.ownKeys(target).filter(
      (key) => (key !== 'class' || !!cls()) && (key !== 'style' || !isEmptyStyle(style())),
    )
  return new Proxy(target, {
    ownKeys: keys,
    has: (_target, key) => keys().includes(key),
    getOwnPropertyDescriptor: (_target, key) =>
      keys().includes(key)
        ? { enumerable: true, configurable: true, value: Reflect.get(target, key) }
        : undefined,
  })
}

/** Resolves one component recipe into reactive per-slot bindings and variant selections. */
export function useRecipe<R extends RecipeDefinition>(
  recipe: R,
  props: StyleProps<Extract<keyof RecipeSlots<R>, string>, RecipeVariants<R>>,
  ...args: 'root' extends Extract<keyof RecipeSlots<R>, string>
    ? [options?: RequiredSlotOptions<Extract<keyof RecipeSlots<R>, string>, RecipeVariants<R>>]
    : [options: RequiredSlotOptions<Extract<keyof RecipeSlots<R>, string>, RecipeVariants<R>>]
): UseRecipeResult<R> {
  type Slots = Extract<keyof RecipeSlots<R>, string>
  const options: UseRecipeOptions<Slots, unknown> = args[0] ?? {}
  const { context, own, enforced, data } = options
  const moraine = useMoraineContext()
  const cn: Cn = moraine ? (...classes) => moraine.cn(...classes) : defaultCn
  const owner = getOwner()
  const definition = compileRecipe(recipe)
  const compiled = moraine
    ? memo(() => compileRecipe(recipe, moraine.theme), owner)
    : () => definition

  const variants = {} as ResolvedVariantInput<RecipeVariants<R>>
  const variantMemos = new Map<string, Accessor<unknown>>()
  const variantOf = (key: string) => {
    let read = variantMemos.get(key)
    if (!read) {
      read = memo(() => {
        const value = (props as Style)[key]
        if (value !== undefined) {
          return value
        }
        const inherited = (context?.()?.variants as Style | undefined)?.[key]
        return inherited === undefined ? compiled().defaults[key] : inherited
      }, owner)
      variantMemos.set(key, read)
      // Theme layers may add variant keys at runtime.
      Object.defineProperty(variants, key, { enumerable: true, get: read })
    }
    return read
  }
  const variant = (key: string) => variantOf(key)()
  for (const key of definition.keys) {
    variantOf(key)
  }

  const rootSlot = (options.slot ?? 'root') as Slots
  const varsSlot = options.varsSlot ?? ('root' in definition.bySlot ? 'root' : rootSlot)

  /** One equality-checked memo per slot; slots without an accessor create nothing. */
  const layer = (read: ((slot: Slots) => (() => SlotValue | undefined) | undefined) | false) => {
    const memos = new Map<Slots, Accessor<SlotValue | undefined>>()
    return (slot: Slots): SlotValue | undefined => {
      if (!read) {
        return undefined
      }
      let value = memos.get(slot)
      if (!value) {
        const accessor = read(slot)
        value = accessor ? memo(accessor, owner, sameSlotValue) : () => undefined
        memos.set(slot, value)
      }
      return value()
    }
  }
  const contextLayer = layer(
    !!context &&
      ((slot) => () => {
        const value = context()
        return value && { class: value.classes?.[slot], style: value.styles?.[slot] }
      }),
  )
  const ownLayer = layer(!!own && ((slot) => own[slot]))
  const enforcedLayer = layer(!!enforced && ((slot) => enforced[slot]))

  const recipeVars = memo(
    () => mergeStyles(...matchEntries(compiled().vars, variant)),
    owner,
    sameStyle,
  )

  const createSlot = (slot: Slots): SlotBinding => {
    const recipeClass = memo(() => {
      const classes = matchEntries<ClassValue>(compiled().bySlot[slot] ?? [], variant)
      return classes.length > 0 ? cn(classes) : undefined
    }, owner)
    const cls = memo(() => {
      const layers = [
        contextLayer(slot)?.class,
        ownLayer(slot)?.class,
        props.classes?.[slot],
        slot === rootSlot ? props.class : undefined,
        enforcedLayer(slot)?.class,
      ]
      const base = recipeClass()
      return layers.every((value) => value === undefined) ? base : cn(base, ...layers)
    }, owner)
    const style = memo(
      () =>
        mergeStyles(
          slot === varsSlot ? recipeVars() : undefined,
          contextLayer(slot)?.style,
          ownLayer(slot)?.style,
          props.styles?.[slot],
          slot === rootSlot ? props.style : undefined,
          enforcedLayer(slot)?.style,
        ),
      owner,
      sameStyle,
    )
    return binding(cls, style, [data?.[slot]])
  }

  const slots = {} as { [K in Slots]: SlotBinding }
  for (const slot of definition.slots as Slots[]) {
    slots[slot] = createSlot(slot)
  }

  const slotWith: UseRecipeResult<R>['slotWith'] = (slot, item) => {
    const parent = slots[slot]
    // Memos belong to the item owner so they are disposed with the item.
    const itemOwner = getOwner()
    const itemOwn = item?.own
    const itemEnforced = item?.enforced
    const itemData = [data?.[slot], item?.data]
    if (!itemOwn && !itemEnforced) {
      // Data-only items read the parent slot memos directly.
      return binding(
        () => parent.class,
        () => parent.style,
        itemData,
      )
    }
    return binding(
      memo(() => cn(parent.class, itemOwn?.()?.class, itemEnforced?.()?.class), itemOwner),
      memo(
        () => mergeStyles(parent.style, itemOwn?.()?.style, itemEnforced?.()?.style),
        itemOwner,
        sameStyle,
      ),
      itemData,
    )
  }

  const overrides: UseRecipeResult<R>['overrides'] = (mapping) => {
    const classes = {}
    const styles = {}
    for (const [target, source] of Object.entries(mapping) as [string, Slots][]) {
      Object.defineProperty(classes, target, { enumerable: true, get: () => slots[source].class })
      Object.defineProperty(styles, target, { enumerable: true, get: () => slots[source].style })
    }
    return { classes, styles }
  }

  return { slots, variants, slotWith, overrides }
}
