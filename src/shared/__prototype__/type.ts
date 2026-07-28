// ═══════════════════════════════════════════════════════════════════════════════
// PROTOTYPE — throwaway type module for root-props design validation.
// Question: Does BaseProps<Base, Variant, TSlot, TElement> + splitProps/rest
// correctly handle default common attrs, opt-in element-specific autocomplete,
// prop conflicts, and handler/ref composition?
// ═══════════════════════════════════════════════════════════════════════════════

import type { ClassValue } from 'cls-variant'
import type { Component, ComponentProps, JSX } from 'solid-js'

// ── Re-export existing helpers (mirrors real src/shared/types.ts) ──────────

export type SlotClassValue = ClassValue
export type SlotStyleValue = JSX.CSSProperties

export type ElementProps<T extends HTMLElement> = JSX.HTMLAttributes<T> & {
  [key: `data-${string}`]: string | number | boolean | undefined
}

export type SlotClasses<TSlot> = [TSlot] extends [string]
  ? Partial<Record<TSlot, ClassValue>>
  : {
      [K in Extract<keyof TSlot, string>]?: ClassValue
    }

export type SlotStyles<TSlot> = [TSlot] extends [string]
  ? Partial<Record<TSlot, JSX.CSSProperties>>
  : {
      [K in Extract<keyof TSlot, string>]?: JSX.CSSProperties
    }

// ── NEW: MoraineTypeConfig — declaration-merging interface (no runtime code) ──

export interface MoraineTypeConfig {
  /**
   * When `false`, root props are restricted to `{}` — no HTML attributes
   * on component roots (only business props + slot styling).
   * When absent/`true`, full `JSX.HTMLAttributes<TElement>` is used.
   *
   * @example
   * ```ts
   * // In your app's .d.ts file, to disable root HTML attrs:
   * declare module 'moraine' {
   *   interface MoraineTypeConfig {
   *     enableRootAutocomplete: false
   *   }
   * }
   * ```
   */
  enableRootAutocomplete?: boolean
}

// ── NEW: Root-props type helper ─────────────────────────────────────────────

type Tags = keyof JSX.HTMLElementTags

/** Lower-case event keys derived from their camelCase counterparts (pre-computed once). */
type _LowerCaseEvents = Exclude<
  {
    [K in keyof JSX.CustomEventHandlersCamelCase<HTMLElement>]: K extends string
      ? Lowercase<K>
      : never
  }[keyof JSX.CustomEventHandlersCamelCase<HTMLElement>],
  never | undefined
>

/** Keys stripped: lower-case events, Solid directive prefixes, namespaced events. */
type _StripKeys =
  | _LowerCaseEvents
  | `on:${string}`
  | `oncapture:${string}`
  | `use:${string}`
  | `prop:${string}`
  | `attr:${string}`
  | `bool:${string}`

/**
 * Full tag attributes, minus lower-case event handlers and Solid directive prefixes.
 * Element-specific attrs (href, type, value, etc.) are preserved.
 */
type StrictedAttributes<TElement extends Tags | Component<any>> = TElement extends Tags
  ? Omit<JSX.HTMLElementTags[TElement], _StripKeys>
  : never

/**
 * Resolves the root-props type based on MoraineTypeConfig.
 * - Default: `{ [key: string]: unknown }` — permissive catch-all.
 * - Opt-in: `MoraineTypeConfig.enableRootAutocomplete: true` → slim subset
 *   (`CustomAttributes` + `CustomEventHandlersCamelCase` + `AriaAttributes`).
 */
export type RootProps<TElement extends Tags | Component<any>> = MoraineTypeConfig extends {
  enableRootAutocomplete: true
}
  ? TElement extends Component<any>
    ? ComponentProps<TElement>
    : StrictedAttributes<TElement>
  : {
      ref?: StrictedAttributes<TElement> // todo)) correct type of ref
      [key: string]: unknown
    }

// ── NEW: BaseProps with 4th generic TElement ────────────────────────────────

/** `B` overrides `A` — keys in `B` win over matching keys in `A`. */
type Override<A, B> = Omit<A, keyof B> & B

export type BaseProps<TElement extends Tags | Component<any>, Base, Variant, TSlot> = Override<
  RootProps<TElement>,
  Base &
    ([Variant] extends [never] ? {} : Variant) & {
      class?: ClassValue
      style?: JSX.CSSProperties
      classes?: SlotClasses<TSlot>
      styles?: SlotStyles<TSlot>
    }
>

type Test = BaseProps<
  'button',
  { foo: string },
  { bar: number },
  { root: string; icon: string }
>[''] // todo)) make sure ref is correct index key

// ── Type-level test helpers ─────────────────────────────────────────────────

/**
 * Compile-time assertion: T should be assignable to U.
 * Usage: type _pass = AssertAssignable<MyType, ExpectedType>
 */
export type AssertAssignable<T, U> = T extends U ? true : false

/**
 * Compile-time assertion: T should NOT be assignable to U.
 * Usage: type _reject = AssertNotAssignable<MyType, RejectedType>
 */
export type AssertNotAssignable<T, U> = T extends U ? false : true
