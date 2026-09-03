# PRD: Moraine Styling System Architecture Refactor

- **Project:** Moraine (SolidJS Component Library)
- **Status:** Implementation Specification (Revision 4)
- **Target Stage:** Pre-Alpha (Breaking Changes Allowed)
- **Supported Engines:** Tailwind CSS v4 and UnoCSS (**Tailwind CSS v3 is explicitly dropped**)
- **Scope:** Complete overhaul of Moraine's component styling system: consumer CSS-engine integration, runtime class resolution via `cn`, an in-house multi-slot `recipe`, selector-scoped runtime class presets, object-only runtime styles and CSS variables, `MoraineProvider` adoption across every public component, and prop bifurcation across all 36 `.class.ts` files and all component `.tsx` files in `src/` (**preserving `transformerVariantGroup` and UnoCSS-specific syntax in `docs/`**).

---

## 1. Executive Summary & Problem Statement

Moraine is designed to provide comprehensive, headless-yet-styled SolidJS components inspired by Nuxt UI and Shadcn. The current styling pipeline has several structural friction points:

1. **Class Name Collisions:** Moraine relies on `cls-variant` (`cls`), which performs simple string concatenation. Overriding `px-3` with `px-5` results in `px-3 px-5` on the element, creating stylesheet order dependencies and forcing `!important` overrides.
2. **Brittle Build-time Shortcut Extractions:** UnoCSS shortcuts (`effect-fv`, `effect-dis`, `surface-overlay`, etc.) are opaque to Tailwind CSS and conflict resolution engines. To support Tailwind, Moraine ran build-time extractors producing separate `tw3.css` and `tw4.css` bundles.
3. **Syntactic Drift & Non-Standard Utilities:** Specificity injectors (`transformerInjectPrefix`, `transformerInjectCompileClass`) and non-standard syntax (`migrate-syntax.ts`, UnoCSS variant groups `hover:(...)`, `b-1`, `h-$mo-...`, `var-progress-*`) broke standard Tailwind scanners and conflict engines.
4. **Lack of Global Theme Overrides:** Applications could not configure global defaults (default sizes, variants, or slot classes/styles) across components via SolidJS context.
5. **Conflated Style and State Props:** Low-frequency design variants (`variant`, `size`) and high-frequency interactive states (`loading`, `disabled`, `active`) were intermixed, causing unnecessary JavaScript CVA recomputations.
6. **Single-Element CVA Mismatch with Multi-Slot Anatomy:** Moraine's components are fundamentally multi-slot (`ComponentT.Slot`), but classic `cva` only styles single elements, forcing 5~13 duplicate `cva` functions per component (e.g. `file-upload`, `stepper`, `progress`), duplicating variant schemas and defaults, fragmenting cross-slot compound variants, and leaking hardcoded static classes into `.tsx` templates.
7. **Ambiguous Consumer Integration:** The current documentation does not clearly separate build-time component utility generation, required engine plugins, and optional runtime assets such as icon masks. This makes otherwise valid class strings fail silently when the consumer has not registered Moraine's theme, animation, and variant definitions.

---

## 2. Core Objectives & Architectural Decisions

### 2.1. Supported Engines & Breaking Changes
- **Tailwind CSS v4:** First-class support via standard utility syntax.
- **UnoCSS:** First-class support through `@subf/unocss` with `presetWind4()` and Moraine's `presetMoraine()`.
- **Tailwind CSS v3:** **Explicitly dropped**. All legacy v3 configurations, preflights, peer dependency ranges, and CSS bundles (`tw3.css`) are removed.
- **CSS Generation & Build Architecture (Plan A):**
  - **Component Utility Stylesheets (`tw3.css` & `tw4.css`) Eliminated:** All component classes in `src/` use statically discoverable, flat Tailwind-compatible syntax. The consumer's selected engine generates component CSS from Moraine's published JavaScript. Precompiled component CSS bundles and their extractor pipeline (`baseUnocssConfig`, `migrate-syntax`, `simplify`) are deleted.
  - **Required Engine Registration:** Scanning classes is necessary but insufficient. Tailwind v4 consumers **must** load `moraine/tailwind` to register Moraine theme tokens, keyframes, animation utilities, and custom variants. UnoCSS consumers **must** load `presetMoraine()` together with `presetWind4()`. Exact consumer-facing configurations are specified in Section 4.
  - **Published Source Location:** Tailwind and UnoCSS examples target the published `moraine/dist` JavaScript files. A source path is resolved relative to the consumer configuration or stylesheet that declares it; package names are not implicitly resolved by `@source`.
  - **Standalone `icon.css` Runtime Asset Retained (Plan A):** `tsdown.config.ts` generates one lightweight `icon.css` asset containing SVG mask rules for internal `DEFAULT_ICON_SHORTCUTS` (Lucide icons). It is an optional browser runtime asset, comparable to an icon font or sprite sheet. It is **not** part of the component styling pipeline, does not register Moraine theme tokens, and does not replace the required Tailwind plugin or UnoCSS preset. Consumers using `@iconify/tailwind` or UnoCSS `presetIcons()` omit it.

### 2.2. Override Architecture Decision: Runtime `cn` vs. CSS Cascade Layers
- **Current Model:** `presetMoraine` with `enableComponentLayer` compiled component utilities into internal prefixed or hashed classes inside the `mo-component` layer with order `-1` vs consumer layer `1`.
- **New Model:** Component layer injection is **deprecated and removed**. Specificity management is transferred to **JavaScript runtime class conflict resolution via [`shadcn-ui/cn`](https://github.com/shadcn-ui/cn)**.
- **Rationale:** 
  - Standardizes Moraine with the modern Tailwind ecosystem (shadcn, Radix/Base UI).
  - Eliminates the need for custom AST transformers (`transformerInjectPrefix`, `transformerInjectCompileClass`).
  - Ensures that a later recognized utility in the same modifier and utility group (`px-5`) replaces an earlier conflicting utility (`px-3`) before the class attribute is written.
  - Custom Moraine tokens are explicitly registered into `cn` via `createCn` from `cn/config` to ensure accurate conflict resolution.

#### `cn` Capability Boundary

`cn` is a runtime class-list normalizer and conflict resolver. Moraine relies on these capabilities only:

- accepts clsx-compatible strings, arrays, objects, booleans, and nullish values;
- preserves non-conflicting tokens and resolves recognized Tailwind utility conflicts with last argument winning;
- scopes conflicts by modifier chain, so `hover:px-3` conflicts with `hover:px-5` but not with unmodified `px-5`;
- recognizes Moraine's custom values only when their owning Tailwind class group is extended in the local `createCn` configuration.

`cn` does **not** generate CSS, scan source files, load `moraine/tailwind`, install UnoCSS presets, expand Moraine/UnoCSS shortcuts, validate that a token exists in the consumer theme, or supersede the CSS cascade between different elements or stylesheets. Arbitrary selectors and arbitrary properties are preserved and merged only to the extent supported by `cn`'s Tailwind-compatible parser. Consequently, engine registration, static token migration, and consumer source configuration remain independent required parts of this refactor.

### 2.3. AGENTS.md Alignment & Syntax Scope
- `AGENTS.md` previously mandated UnoCSS variant groups (`hover:(bg-red-500 text-white)`).
- **Rule Updated for Component Source (`src/`):** `AGENTS.md` now explicitly mandates **standard flat Tailwind utility syntax** (`hover:bg-red-500 hover:text-white`) and strictly forbids parenthesized variant groups in component code (`src/`) so all library classes can be scanned natively by Tailwind v4 and resolved by `cn`.
- **Docs Preservation Scope (`docs/`):** The documentation application in `docs/` is built with UnoCSS and **preserves `transformerVariantGroup`** as well as UnoCSS-specific syntax (variant groups, markdown shortcuts, custom UnoCSS directives) in `docs/unocss.config.ts` and documentation pages.

---

## 3. Detailed Technical Architecture

### 3.1. Runtime Class Resolution (`cn` & In-House `recipe`)

#### 1. Custom `cn` Instance via `cn/config` (`src/shared/utils.ts`)
To ensure that Moraine's semantic tokens participate in runtime conflict resolution (e.g. `z-10` overriding `z-floating`, or `opacity-100` overriding `opacity-64`), `cn` is configured using `createCn`:

```ts
import { createCn } from 'cn/config'

export const cn = createCn({
  extend: {
    classGroups: {
      z: [
        'z-base',
        'z-raised',
        'z-control',
        'z-sticky',
        'z-resize',
        'z-overlay',
        'z-floating',
      ],
      opacity: ['opacity-64'],
    },
  },
})
```

#### 2. In-House Multi-Slot and Atomic `recipe` (`src/shared/style/recipe.ts`)

Moraine replaces `cva` with an intentionally incompatible, object-only `recipe(options)` API. This is a pre-alpha breaking change: `cva` is removed from implementation and public exports, and every internal caller migrates atomically before `cls-variant` is removed. No compatibility alias or dual call signature is retained.

`recipe` resolves classes at runtime. Each call deterministically evaluates defaults, selected variants, and matching compound variants, then delegates final normalization to `cn`. It does not cache variant combinations; the implementation favors bounded memory, predictable reactivity, and a small API over speculative caching. It supports both multi-slot recipes and localized atomic recipes where a component genuinely has one styled element.

```ts
import { cn } from '../utils'

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

export interface SlotCompoundVariant<S extends string, V extends VariantSchema> {
  variants: VariantMatch<V>
  class: SlotClasses<S>
}

export interface SlotRecipeOptions<S extends string, V extends VariantSchema> {
  slots: readonly S[] | S[]
  base?: SlotClasses<S>
  variants?: {
    [K in keyof V]?: {
      [Val in keyof V[K]]?: SlotClasses<S>
    }
  }
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

export interface AtomicCompoundVariant<V extends VariantSchema> {
  variants: VariantMatch<V>
  class: ClassValue
}

export interface AtomicRecipeOptions<V extends VariantSchema> {
  base?: ClassValue
  variants?: {
    [K in keyof V]?: {
      [Val in keyof V[K]]?: ClassValue
    }
  }
  compoundVariants?: Array<AtomicCompoundVariant<V>>
  defaultVariants?: VariantSelection<V>
}

export interface AtomicRecipeFn<V extends VariantSchema> {
  (variants?: VariantSelection<V>, ...extraClasses: ClassValue[]): string | undefined
}

// ---------------------------------------------------------------------------
// 3. VariantProps Extractor
// ---------------------------------------------------------------------------

export type VariantProps<T> = T extends SlotRecipeFn<infer _S, infer V>
  ? VariantSelection<V>
  : T extends AtomicRecipeFn<infer V>
    ? VariantSelection<V>
    : never

// ---------------------------------------------------------------------------
// 4. Shared Runtime Resolution
// ---------------------------------------------------------------------------

function matchesVariants(
  activeVariants: Record<string, unknown>,
  expectedVariants: Record<string, unknown>,
): boolean {
  return Object.entries(expectedVariants).every(([name, expected]) => {
    const actual = activeVariants[name]
    if (actual === undefined || actual === null) return false
    return Array.isArray(expected)
      ? expected.some((value) => String(value) === String(actual))
      : String(expected) === String(actual)
  })
}

export function createSlotRecipe<S extends string, V extends VariantSchema>(
  options: SlotRecipeOptions<S, V>,
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
            String(selectedValue)
          ]
          if (selectedSlots) {
            for (const [slot, classValue] of Object.entries(selectedSlots)) {
              if (classValue) slotClassMap[slot as S]?.push(classValue as ClassValue)
            }
          }
        }
      }
    }

    for (const compoundVariant of options.compoundVariants ?? []) {
      if (matchesVariants(activeVariants, compoundVariant.variants)) {
        for (const [slot, classValue] of Object.entries(compoundVariant.class)) {
          if (classValue) slotClassMap[slot as S]?.push(classValue as ClassValue)
        }
      }
    }

    const resolvedClasses = {} as Record<S, string | undefined>
    const result = { classes: resolvedClasses } as SlotFns<S>
    for (const slot of slots) {
      const resolvedClass = cn(slotClassMap[slot]) || undefined
      resolvedClasses[slot] = resolvedClass
      result[slot] = (...extraClasses: ClassValue[]) => {
        if (extraClasses.length === 0) return resolvedClass
        return cn(resolvedClass, ...extraClasses) || undefined
      }
    }

    return result
  }) as SlotRecipeFn<S, V>

  recipeFn.slots = slots
  return recipeFn
}

export function createAtomicRecipe<V extends VariantSchema>(
  options: AtomicRecipeOptions<V>,
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
            String(selectedValue)
          ]
          if (selectedClass) classes.push(selectedClass)
        }
      }
    }

    for (const compoundVariant of options.compoundVariants ?? []) {
      if (matchesVariants(activeVariants, compoundVariant.variants) && compoundVariant.class) {
        classes.push(compoundVariant.class)
      }
    }

    return cn(classes, ...extraClasses) || undefined
  }
}

export function recipe<S extends string, V extends VariantSchema>(
  options: SlotRecipeOptions<S, V>,
): SlotRecipeFn<S, V>
export function recipe<V extends VariantSchema>(
  options: AtomicRecipeOptions<V>,
): AtomicRecipeFn<V>
export function recipe(
  options: SlotRecipeOptions<string, VariantSchema> | AtomicRecipeOptions<VariantSchema>,
): SlotRecipeFn<string, VariantSchema> | AtomicRecipeFn<VariantSchema> {
  if ('slots' in options) {
    return createSlotRecipe(options)
  }
  return createAtomicRecipe(options)
}
```

---

### 3.2. Complete Shortcut Inventory & Selector-Scoped Presets

The 12 named shortcuts in `src/unocss/theme.ts`, semantic animation shortcuts, and `z-*` shortcuts are completely accounted for. All shortcut occurrences across `.class.ts` and `.tsx` files are converted into explicit, selector-scoped constants in `src/shared/style/presets.ts`:

```ts
/**
 * 1. Focus Ring Presets (Outline & Ring)
 * Replaces: 'effect-fv' and 'effect-fv-border'
 */
export const FOCUS_VISIBLE_RING =
  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

export const HOVER_RING =
  'hover:outline-none hover:ring-3 hover:ring-ring/50'

export const FOCUS_VISIBLE_RING_BORDER =
  'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export const FOCUS_WITHIN_RING_BORDER =
  'focus-within:outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50'

export const PEER_FOCUS_VISIBLE_RING_BORDER =
  'peer-focus-visible:outline-none peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50'

export const DATA_FOCUSED_RING_BORDER =
  'data-focused:outline-none data-focused:border-ring data-focused:ring-3 data-focused:ring-ring/50'

/**
 * 2. Disabled State Presets
 * Replaces: 'effect-dis'
 */
export const DISABLED_EFFECT =
  'disabled:opacity-64 disabled:pointer-events-none'

export const ARIA_DISABLED_EFFECT =
  'aria-disabled:opacity-64 aria-disabled:pointer-events-none'

export const DATA_DISABLED_EFFECT =
  'data-disabled:opacity-64 data-disabled:pointer-events-none'

export const INTERACTION_DISABLED =
  'disabled:opacity-64 disabled:pointer-events-none aria-disabled:opacity-64 aria-disabled:pointer-events-none data-disabled:opacity-64 data-disabled:pointer-events-none'

/**
 * 3. Invalid State Presets
 * Replaces: 'effect-invalid'
 */
export const DATA_INVALID_BORDER =
  'data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40'

export const ARIA_INVALID_BORDER =
  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40'

export const FOCUS_WITHIN_DATA_INVALID_BORDER =
  'focus-within:data-invalid:border-destructive focus-within:data-invalid:ring-3 focus-within:data-invalid:ring-destructive/20 dark:focus-within:data-invalid:border-destructive/50 dark:focus-within:data-invalid:ring-destructive/40'

export const FOCUS_VISIBLE_DATA_INVALID_BORDER =
  'focus-visible:data-invalid:border-destructive focus-visible:data-invalid:ring-3 focus-visible:data-invalid:ring-destructive/20 dark:focus-visible:data-invalid:border-destructive/50 dark:focus-visible:data-invalid:ring-destructive/40'

export const DATA_FOCUSED_DATA_INVALID_BORDER =
  'data-focused:data-invalid:border-destructive data-focused:data-invalid:ring-3 data-focused:data-invalid:ring-destructive/20 dark:data-focused:data-invalid:border-destructive/50 dark:data-focused:data-invalid:ring-destructive/40'

/**
 * 4. Loading & Animation Presets
 * Replaces: 'effect-loading'
 * Note: LOADING_SPINNER applies strictly to the icon/spinner slot, NOT the root control.
 */
export const LOADING_SPINNER =
  'cursor-wait opacity-80 animate-spin'

export const ROOT_LOADING =
  'aria-busy:cursor-wait data-loading:cursor-wait'

/**
 * 5. Surface & Layout Presets
 * Replaces: 'surface-overlay', 'hidden-hitless', 'rm-side-b'
 */
export const SURFACE_OVERLAY =
  'border border-border shadow-md'

export const HIDDEN_HITLESS =
  'opacity-0 pointer-events-none'

export const RM_SIDE_BORDER =
  '[&>[data-slot=sidebar]]:border-0!'

/**
 * 6. Element Style Presets
 * Replaces: 'style-placeholder', 'style-input-number', 'style-accordion-content', 'transition-bg'
 */
export const STYLE_PLACEHOLDER =
  'placeholder:text-muted-foreground placeholder:select-none'

export const STYLE_INPUT_NUMBER =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

export const STYLE_ACCORDION_CONTENT =
  '[&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4'

export const TRANSITION_BG =
  '[transition-property:background-color]'

/**
 * 7. Semantic Animation Presets
 * Replaces UnoCSS-only animate-{target}-{phase/side} shortcuts in src/.
 * These constants expand to utilities registered by the required engine integration.
 */
export const OVERLAY_ENTER =
  'data-expanded:animate-mo-enter data-expanded:[--mo-enter-opacity:0]'
export const OVERLAY_EXIT =
  'data-closed:animate-mo-exit data-closed:[--mo-exit-opacity:0]'
export const POPUP_ENTER =
  'data-expanded:animate-mo-enter data-expanded:[--mo-enter-opacity:0] data-expanded:[--mo-enter-scale:0.95]'
export const POPUP_EXIT =
  'data-closed:animate-mo-exit data-closed:[--mo-exit-opacity:0] data-closed:[--mo-exit-scale:0.95]'

export const MENU_SIDE_TOP =
  '[--mo-enter-translate-y:0.25rem] [--mo-exit-translate-y:0.25rem]'
export const MENU_SIDE_RIGHT =
  '[--mo-enter-translate-x:-0.25rem] [--mo-exit-translate-x:-0.25rem]'
export const MENU_SIDE_BOTTOM =
  '[--mo-enter-translate-y:-0.25rem] [--mo-exit-translate-y:-0.25rem]'
export const MENU_SIDE_LEFT =
  '[--mo-enter-translate-x:0.25rem] [--mo-exit-translate-x:0.25rem]'

export const POPOVER_SIDE_TOP =
  '[--mo-enter-translate-y:0.5rem] [--mo-exit-translate-y:0.5rem]'
export const POPOVER_SIDE_RIGHT =
  '[--mo-enter-translate-x:-0.5rem] [--mo-exit-translate-x:-0.5rem]'
export const POPOVER_SIDE_BOTTOM =
  '[--mo-enter-translate-y:-0.5rem] [--mo-exit-translate-y:-0.5rem]'
export const POPOVER_SIDE_LEFT =
  '[--mo-enter-translate-x:0.5rem] [--mo-exit-translate-x:0.5rem]'

export const TOOLTIP_SIDE_TOP =
  '[--mo-enter-translate-y:0.25rem] [--mo-exit-translate-y:0.25rem]'
export const TOOLTIP_SIDE_RIGHT =
  '[--mo-enter-translate-x:-0.25rem] [--mo-exit-translate-x:-0.25rem]'
export const TOOLTIP_SIDE_BOTTOM =
  '[--mo-enter-translate-y:-0.25rem] [--mo-exit-translate-y:-0.25rem]'
export const TOOLTIP_SIDE_LEFT =
  '[--mo-enter-translate-x:0.25rem] [--mo-exit-translate-x:0.25rem]'

export const SHEET_SIDE_TOP =
  '[--mo-enter-translate-y:-2.5rem] [--mo-exit-translate-y:-2.5rem]'
export const SHEET_SIDE_RIGHT =
  '[--mo-enter-translate-x:2.5rem] [--mo-exit-translate-x:2.5rem]'
export const SHEET_SIDE_BOTTOM =
  '[--mo-enter-translate-y:2.5rem] [--mo-exit-translate-y:2.5rem]'
export const SHEET_SIDE_LEFT =
  '[--mo-enter-translate-x:-2.5rem] [--mo-exit-translate-x:-2.5rem]'
```

The implementation defines the corresponding popover, tooltip, and sheet side constants using their existing offsets and directions. Every `animate-overlay-*`, `animate-popup-*`, `animate-menu-*`, `animate-popover-*`, `animate-tooltip-*`, and `animate-sheet-*` occurrence in `src/` is replaced by explicit `animate-mo-enter`/`animate-mo-exit` utilities plus CSS-variable constants. The semantic shortcut definitions are then removed from `presetMoraine`; they remain neither hidden engine behavior nor an undocumented compatibility layer.

---

### 3.3. Token Inventory & Zero Non-Standard Tokens Gate

All non-standard syntax previously translated by `migrate-syntax.ts` or UnoCSS regex rules is mapped to standard Tailwind utility syntax across all 36 `.class.ts` files and all component `.tsx` files in `src/` (**`docs/` is excluded and preserves `transformerVariantGroup` and UnoCSS syntax**):

| Non-Standard / UnoCSS Token | Standard Tailwind Replacement | Scope |
| :--- | :--- | :--- |
| `b-1`, `b` | `border` | `accordion`, `button`, `card`, `file-upload`, etc. |
| `b-t`, `b-[trblxy]` | `border-t`, etc. | `separator.class.ts` |
| `b-b-2`, `b-border`, `b-transparent` | `border-b-2`, `border-border`, `border-transparent` | `accordion`, `card`, `select` |
| `content-empty` | `content-['']` | `avatar`, `resizable`, `slider` |
| `not-dark:bg-clip-padding` | `[html:not(.dark)_&]:bg-clip-padding` | `card.class.ts`, `slider.class.ts` |
| `not-last:border-(b b-border)` | `[&:not(:last-child)]:border-b [&:not(:last-child)]:border-border` | `accordion.class.ts` |
| `not-first-of-type:-ms-px` | `[&:not(:first-of-type)]:-ms-px` | `cva-common.class.ts`, `checkbox-group`, `radio-group` |
| `h-$mo-collapsible-content-height` | `h-[var(--mo-collapsible-content-height)]` | `accordion`, `collapsible` |
| `origin-$mo-popper-...` | `origin-[var(--mo-popper-content-transform-origin)]` | `select`, `menu`, `popover`, `tooltip` |
| `var-progress-{n}` | Root `style` injection via `progressStyleVars` (`--p-size`) | `progress.class.ts` & `progress.tsx` |
| `var-slider-{n}` | Root `style` injection via `sliderStyleVars` (`--s-size`) | `slider.class.ts` & `slider.tsx` |
| `var-slider-bold-{size}-{len}-{off}`| Root `style` injection via `sliderStyleVars` (`--s-size`, `--s-len`, `--s-offset`, `--s-pos`) | `slider.class.ts` & `slider.tsx` |
| `var-stepper-{s}-{x}-{g}-{p}` | Root `style` injection via `stepperStyleVars` (`--st-size`, `--st-sep-x`, `--st-sep-top`, `--st-gap`, `--st-pt`) | `stepper.class.ts` & `stepper.tsx` |
| `hover:(bg-red-500 text-white)` | `hover:bg-red-500 hover:text-white` | All 36 `.class.ts` files and `.tsx` files in `src/` |
| `after:(content-empty absolute ...)` | `after:content-[''] after:absolute ...` | `avatar`, `resizable`, `slider` in `src/` |
| `ring-3px` | `ring-3` | Focus presets |
| `animate-overlay-{in,out}` | `OVERLAY_ENTER`, `OVERLAY_EXIT` | `modal` |
| `animate-popup-{in,out}` | `POPUP_ENTER`, `POPUP_EXIT` | `modal`, `dialog` |
| `animate-menu-{in,out,side-*}` | Explicit `animate-mo-*` and `MENU_SIDE_*` constants | `select`, `dropdown-menu`, `context-menu` |
| `animate-popover-{in,out,side-*}` | Explicit `animate-mo-*` and `POPOVER_SIDE_*` constants | `popover` |
| `animate-tooltip-{in,out,side-*}` | Explicit `animate-mo-*` and `TOOLTIP_SIDE_*` constants | `tooltip` |
| `animate-sheet-{in,out,side-*}` | Explicit `animate-mo-*` and `SHEET_SIDE_*` constants | `sheet` |

---

### 3.4. Prop Bifurcation & Interaction Semantics

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           COMPONENT PROPS                                 │
├─────────────────────────────────────┬─────────────────────────────────────┤
│      1. STYLISH PROPS (Static)      │      2. STATE PROPS (Dynamic)       │
├─────────────────────────────────────┼─────────────────────────────────────┤
│ • variant, size, shape, radius      │ • loading, active, disabled, open   │
│ • Low change frequency (static)     │ • High change frequency (dynamic)   │
│ • Evaluated by recipe() & cn()      │ • Binds to DOM: data-*, aria-*, etc.│
│ • Configurable in MoraineProvider   │ • Controlled per-instance/event     │
│ • Resolved from design props        │ • Styled via CSS attribute rules    │
└─────────────────────────────────────┴─────────────────────────────────────┘
```

#### Native Button vs. Polymorphic Control Semantics
- **Solid Reactivity Rule:** In accordance with `AGENTS.md`, class expressions are not memoized (`createMemo` is not used for classes); they are evaluated in-place.
- **Performance Realization:** By keeping `loading`, `disabled`, and `active` out of recipe variants, state changes update reactive DOM attributes without recomputing design-variant class selection solely because an interaction state changed. No constant-time or cache-based performance guarantee is made.
- **Native `<button>`:** Uses native `disabled={isDisabledOrLoading()}`, `aria-busy={isLoading() ? true : undefined}`, `data-disabled={isDisabledOrLoading() ? '' : undefined}`, and `data-loading={isLoading() ? '' : undefined}`.
- **Polymorphic elements (`<a>`, `<div>`):** Must NOT write native `disabled`. `useButtonInteraction` sets `role="button"`, `aria-disabled="true"`, `tabindex="-1"`, and intercepts click/keyboard events.

---

### 3.5. Global Theming via `MoraineProvider`

#### 1. Configuration Types (`src/shared/provider/moraine-provider.tsx`)
```ts
import type { JSX } from 'solid-js'
import { createContext, useContext } from 'solid-js'
import { cn } from '../utils'
import type { SlotClassValue, SlotStyleValue } from '../types'

export interface ComponentDefaultStyle<
  V = Record<string, unknown>,
  C = Record<string, SlotClassValue>,
  S = Record<string, SlotStyleValue>,
> {
  defaultProps?: Partial<V>
  class?: SlotClassValue
  classes?: Partial<C>
  style?: JSX.CSSProperties
  styles?: Partial<S>
}

export interface MoraineConfig {
  accordion?: ComponentDefaultStyle<AccordionT.Variant, AccordionT.Classes, AccordionT.Styles>
  avatar?: ComponentDefaultStyle<AvatarT.Variant, AvatarT.Classes, AvatarT.Styles>
  avatarGroup?: ComponentDefaultStyle<AvatarGroupT.Variant, AvatarGroupT.Classes, AvatarGroupT.Styles>
  badge?: ComponentDefaultStyle<BadgeT.Variant, BadgeT.Classes, BadgeT.Styles>
  button?: ComponentDefaultStyle<ButtonT.Variant, ButtonT.Classes, ButtonT.Styles>
  buttonGroup?: ComponentDefaultStyle<ButtonGroupT.Variant, ButtonGroupT.Classes, ButtonGroupT.Styles>
  card?: ComponentDefaultStyle<CardT.Variant, CardT.Classes, CardT.Styles>
  checkbox?: ComponentDefaultStyle<CheckboxT.Variant, CheckboxT.Classes, CheckboxT.Styles>
  checkboxGroup?: ComponentDefaultStyle<CheckboxGroupT.Variant, CheckboxGroupT.Classes, CheckboxGroupT.Styles>
  collapsible?: ComponentDefaultStyle<CollapsibleT.Variant, CollapsibleT.Classes, CollapsibleT.Styles>
  commandPalette?: ComponentDefaultStyle<CommandPaletteT.Variant, CommandPaletteT.Classes, CommandPaletteT.Styles>
  contextMenu?: ComponentDefaultStyle<ContextMenuT.Variant, ContextMenuT.Classes, ContextMenuT.Styles>
  dialog?: ComponentDefaultStyle<DialogT.Variant, DialogT.Classes, DialogT.Styles>
  dropdownMenu?: ComponentDefaultStyle<DropdownMenuT.Variant, DropdownMenuT.Classes, DropdownMenuT.Styles>
  fileUpload?: ComponentDefaultStyle<FileUploadT.Variant, FileUploadT.Classes, FileUploadT.Styles>
  form?: ComponentDefaultStyle<FormT.Variant, FormT.Classes, FormT.Styles>
  formField?: ComponentDefaultStyle<FormFieldT.Variant, FormFieldT.Classes, FormFieldT.Styles>
  icon?: ComponentDefaultStyle<IconT.Variant, IconT.Classes, IconT.Styles>
  input?: ComponentDefaultStyle<InputT.Variant, InputT.Classes, InputT.Styles>
  inputNumber?: ComponentDefaultStyle<InputNumberT.Variant, InputNumberT.Classes, InputNumberT.Styles>
  kbd?: ComponentDefaultStyle<KbdT.Variant, KbdT.Classes, KbdT.Styles>
  kbdGroup?: ComponentDefaultStyle<KbdGroupT.Variant, KbdGroupT.Classes, KbdGroupT.Styles>
  list?: ComponentDefaultStyle<ListT.Variant, ListT.Classes, ListT.Styles>
  modal?: ComponentDefaultStyle<ModalT.Variant, ModalT.Classes, ModalT.Styles>
  multiSelect?: ComponentDefaultStyle<MultiSelectT.Variant, MultiSelectT.Classes, MultiSelectT.Styles>
  pagination?: ComponentDefaultStyle<PaginationT.Variant, PaginationT.Classes, PaginationT.Styles>
  popover?: ComponentDefaultStyle<PopoverT.Variant, PopoverT.Classes, PopoverT.Styles>
  progress?: ComponentDefaultStyle<ProgressT.Variant, ProgressT.Classes, ProgressT.Styles>
  radioGroup?: ComponentDefaultStyle<RadioGroupT.Variant, RadioGroupT.Classes, RadioGroupT.Styles>
  resizable?: ComponentDefaultStyle<ResizableT.Variant, ResizableT.Classes, ResizableT.Styles>
  select?: ComponentDefaultStyle<SelectT.Variant, SelectT.Classes, SelectT.Styles>
  separator?: ComponentDefaultStyle<SeparatorT.Variant, SeparatorT.Classes, SeparatorT.Styles>
  sheet?: ComponentDefaultStyle<SheetT.Variant, SheetT.Classes, SheetT.Styles>
  sidebarFrame?: ComponentDefaultStyle<SidebarFrameT.Variant, SidebarFrameT.Classes, SidebarFrameT.Styles>
  slider?: ComponentDefaultStyle<SliderT.Variant, SliderT.Classes, SliderT.Styles>
  stepper?: ComponentDefaultStyle<StepperT.Variant, StepperT.Classes, StepperT.Styles>
  switch?: ComponentDefaultStyle<SwitchT.Variant, SwitchT.Classes, SwitchT.Styles>
  tabs?: ComponentDefaultStyle<TabsT.Variant, TabsT.Classes, TabsT.Styles>
  textarea?: ComponentDefaultStyle<TextareaT.Variant, TextareaT.Classes, TextareaT.Styles>
  tooltip?: ComponentDefaultStyle<TooltipT.Variant, TooltipT.Classes, TooltipT.Styles>
}
```

All runtime style APIs are object-only. `SlotStyleValue`, component `style`, slot `styles`, provider `style`, provider `styles`, group/context styles, and `defineStyleVars` inputs use `JSX.CSSProperties`; string CSS declarations are not accepted. Existing string-style usage is a compile-time breaking change and must be migrated to an object.

Every public styled component must be covered. A standalone public component with its own `ComponentT` namespace receives its own provider key, including `AvatarGroup`, `KbdGroup`, `Form`, and `Icon`. Public composition primitives without independent style schemas inherit their owner's block:

| Public component | Provider ownership |
| :--- | :--- |
| `CollapsibleTrigger`, `CollapsibleContent` | `collapsible`; their slots are represented in `CollapsibleT.Classes` and `CollapsibleT.Styles` |
| `ModalTrigger`, `ModalTriggerRenderer` | `modal`; trigger slots are represented in `ModalT.Classes` and `ModalT.Styles` |
| `AvatarFace` | `avatar` |
| `createForm()` bound `Form` and `Field` components | `form` and `formField`, respectively |
| `SidebarFrameSheetOnlyRender`, `SidebarFrameSheetResizableRender` | `sidebarFrame`; these are render strategies, not independent provider scopes |
| Select/menu internal primitives not exported from the package root | Their public owning component (`select`, `multiSelect`, `dropdownMenu`, or `contextMenu`) |

The implementation must maintain a checked inventory from every package-root component export to exactly one provider key. Components that intentionally expose no variant or slot overrides use `never` for those generic parameters but still support root `class` and object `style` when their public API already exposes them.

#### 2. Deep Per-Key Merging for Nested Providers
Nested providers do not overwrite whole component blocks; they reactively deep-merge `defaultProps`, `classes`, and `styles`. The closest provider wins per property; unspecified child keys inherit from the parent. Class values are combined through `cn`, while object styles are shallow-merged per slot and CSS property.

The context value is an accessor so replacing a provider config or changing reactive values inside it propagates without remounting descendants:

```tsx
type MoraineConfigAccessor = () => MoraineConfig

const MoraineConfigContext = createContext<MoraineConfigAccessor>(() => ({}))

export function MoraineProvider(props: MoraineProviderProps): JSX.Element {
  const parent = useContext(MoraineConfigContext)
  const config = createMemo(() => mergeMoraineConfig(parent(), props.config))
  return (
    <MoraineConfigContext.Provider value={config}>
      {props.children}
    </MoraineConfigContext.Provider>
  )
}

export function useMoraineConfig(): MoraineConfigAccessor {
  return useContext(MoraineConfigContext)
}
```

```ts
export function mergeComponentStyle<
  V extends Record<string, unknown>,
  C extends object,
  S extends object,
>(
  parent?: ComponentDefaultStyle<V, C, S>,
  child?: ComponentDefaultStyle<V, C, S>,
): ComponentDefaultStyle<V, C, S> {
  if (!parent) return child ?? {}
  if (!child) return parent

  const mergedClasses: Record<string, SlotClassValue> = { ...parent.classes }
  if (child.classes) {
    for (const [slot, cls] of Object.entries(child.classes)) {
      mergedClasses[slot] = cn(mergedClasses[slot], cls)
    }
  }

  const mergedStyles: Record<string, SlotStyleValue> = { ...parent.styles }
  if (child.styles) {
    for (const [slot, sty] of Object.entries(child.styles)) {
      const parentSlot = mergedStyles[slot]
      mergedStyles[slot] =
        sty && typeof sty === 'object' && parentSlot && typeof parentSlot === 'object'
          ? { ...parentSlot, ...sty }
          : (sty ?? parentSlot)
    }
  }

  return {
    defaultProps: { ...parent.defaultProps, ...child.defaultProps },
    class: cn(parent.class, child.class),
    classes: mergedClasses as Partial<C>,
    style: { ...parent.style, ...child.style },
    styles: mergedStyles as Partial<S>,
  }
}
```

#### 3. Inheritance and Override Precedence

Resolution is defined independently for design props, classes, and object styles. In every sequence below, the rightmost defined value wins:

| Surface | Precedence, weakest → strongest |
| :--- | :--- |
| Design props such as `variant` and `size` | recipe `defaultVariants` → provider `defaultProps` chain (outer → inner) → composition context such as `ButtonGroup` → component instance prop |
| Root class | recipe base/selected/compound classes → provider general `class` chain (outer → inner) → provider `classes.root` chain (outer → inner) → composition context → instance `classes.root` → instance `class` |
| Non-root slot class | recipe base/selected/compound classes → provider slot chain (outer → inner) → composition context slot → instance slot |
| Root style | generated component CSS variables/default runtime style → provider general `style` chain (outer → inner) → provider `styles.root` chain (outer → inner) → composition context → instance `styles.root` → instance `style` |
| Non-root slot style | component default runtime style → provider slot chain (outer → inner) → composition context slot → instance slot |

Provider values are defaults and global overrides, not locks. An instance always remains able to override a provider value. A composition context sits between provider and instance so a `ButtonGroup` can establish local defaults while an individual `Button` can opt out. State styling is expressed through `data-*`, `aria-*`, and native pseudo-class selectors in the recipe/presets; it does not become a provider `defaultProp`. If an instance deliberately supplies a conflicting class with the same modifier chain, normal last-wins `cn` semantics apply.

#### 4. Component Adoption Pattern

Components preserve their base slot classes and variant definitions via `recipe`, then apply the precedence contract above:

```tsx
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>) {
  const config = useMoraineConfig()
  const provider = () => config().button
  const group = useContext(ButtonGroupContext)

  // 1. Single source of truth: Recipe defaults apply only when props, group, and provider are undefined:
  const variant = () => props.variant ?? group?.variant ?? provider()?.defaultProps?.variant
  const size = () => props.size ?? group?.size ?? provider()?.defaultProps?.size

  // 2. Runtime multi-slot recipe resolution:
  const slots = () => buttonRecipe({ variant: variant(), size: size() })

  // 3. Deterministic Root Class Precedence:
  const rootClass = () =>
    slots().root(
      provider()?.class,
      provider()?.classes?.root,
      group?.class,
      props.classes?.root,
      props.class,
    )

  // 4. Deterministic Slot Class Precedence (Base Slot Classes NEVER Dropped):
  const leadingClass = () =>
    slots().leading(
      provider()?.classes?.leading,
      group?.classes?.leading,
      isLeadingLoading() && LOADING_SPINNER,
      props.classes?.leading,
    )

  // 5. Deterministic Slot Style Precedence:
  const rootStyle = () => ({
    ...provider()?.style,
    ...provider()?.styles?.root,
    ...group?.styles?.root,
    ...props.styles?.root,
    ...props.style,
  })

  // ...
}
```

---

### 3.6. Dynamic Metric Variables & Root CSS Variable Engine (`src/shared/style/css-vars.ts`)

#### 1. Architectural Problem: Non-Standard UnoCSS Regex vs. Compound Explosion
In components with coupled physical geometry across multiple child slots (e.g. `slider`, `stepper`, `progress`):
- `Slider`: `size` and `bold` variants dictate track thickness (`--s-size`), range indicator length (`--s-len`), indicator offset (`--s-offset`), and computed position (`--s-pos = max(off, calc(100% - off*2))`).
- `Stepper`: `size` dictates indicator dimensions (`--st-size`), separator position (`--st-sep-x`, `--st-sep-top`), step gap (`--st-gap`), and label offset (`--st-pt`).

To prevent child slots (`range`, `thumb`, `separator`) from duplicating `size × variant × orientation × inverted` compound conditions, CSS custom properties are used to decouple sub-element styles from top-level variants. However, Moraine previously relied on non-standard UnoCSS regex classes (`var-slider-bold-20-14-3`, `var-stepper-8-6-2-0.5`). 

**Decision (Scheme B): Root Element CSS Variable Injection**.
Rather than polluting HTML class strings with unwieldy arbitrary property classes (e.g. `[--s-size:20px] [--s-len:14px] [--s-offset:3px] [--s-pos:max(3px,calc(100%-6px))]`), dynamic metric variables are cleanly injected onto the Root element via `style`. Sub-elements (`track`, `range`, `thumb`) read these variables purely via standard utility classes (`h-[var(--s-size)]`, `after:w-[var(--s-offset)]`), completely eliminating compound variant explosion across child slots while keeping HTML `class` attributes 100% clean.

#### 2. Generic Utilities: `defineStyleVars` & `formatCssVars` (`src/shared/style/css-vars.ts`)
A dedicated, zero-dependency generic utility module declares and resolves variant-driven CSS custom properties with automatic prefixing and deterministic object-style precedence. It performs direct runtime resolution and does not cache variant combinations:

```ts
import type { JSX } from 'solid-js'
import type { VariantMatch, VariantSchema, VariantSelection } from './recipe'

export type StyleVarValue = string | number | undefined | null
export type StyleVarRecord = Record<string, StyleVarValue>

/**
 * Converts a flat key-value dictionary into prefixed CSS custom properties.
 * Automatically prepends '--' and filters out nullish values.
 *
 * @example
 * formatCssVars({ size: '20px', len: '14px' }, 's')
 * // => { '--s-size': '20px', '--s-len': '14px' }
 */
export function formatCssVars(
  vars: StyleVarRecord,
  prefix?: string,
): JSX.CSSProperties {
  const result: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined && value !== null) {
      const varName = key.startsWith('--')
        ? key
        : prefix
          ? `--${prefix}-${key}`
          : `--${key}`
      result[varName] = value
    }
  }
  return result as JSX.CSSProperties
}

export interface StyleVarsOptions<V extends VariantSchema> {
  prefix?: string
  base?: StyleVarRecord
  variants?: {
    [K in keyof V]?: {
      [Val in keyof V[K]]?: StyleVarRecord
    }
  }
  compoundVariants?: Array<{
    variants: VariantMatch<V>
    vars: StyleVarRecord
  }>
  defaultVariants?: VariantSelection<V>
}

export type StyleVarsFn<V extends VariantSchema> = (
  variants?: VariantSelection<V>,
  ...extraStyles: Array<JSX.CSSProperties | undefined>
) => JSX.CSSProperties

/**
 * Creates a variant-driven CSS custom properties resolver for component root elements.
 * Eliminates compound variant explosion across child slots and keeps HTML classes pristine.
 */
export function defineStyleVars<V extends VariantSchema>(
  options: StyleVarsOptions<V>,
): StyleVarsFn<V> {
  const prefix = options.prefix

  return (
    variants?: VariantSelection<V>,
    ...extraStyles: Array<JSX.CSSProperties | undefined>
  ): JSX.CSSProperties => {
    const activeVariants: Record<string, unknown> = { ...options.defaultVariants }
    if (variants) {
      for (const [key, value] of Object.entries(variants)) {
        if (value !== undefined && value !== null) {
          activeVariants[key] = value
        }
      }
    }

    const resolved: StyleVarRecord = { ...options.base }

    if (options.variants) {
      for (const [variantName, variantMap] of Object.entries(options.variants)) {
        const selectedValue = activeVariants[variantName]
        if (selectedValue !== undefined && selectedValue !== null) {
          const selectedVars = (variantMap as Record<string, StyleVarRecord>)[
            String(selectedValue)
          ]
          if (selectedVars) {
            Object.assign(resolved, selectedVars)
          }
        }
      }
    }

    for (const compoundVariant of options.compoundVariants ?? []) {
      const matches = Object.entries(compoundVariant.variants).every(([name, expected]) => {
        const actual = activeVariants[name]
        if (actual === undefined || actual === null) return false
        return Array.isArray(expected)
          ? expected.some((value) => String(value) === String(actual))
          : String(expected) === String(actual)
      })
      if (matches) {
        Object.assign(resolved, compoundVariant.vars)
      }
    }

    const finalStyle: JSX.CSSProperties = formatCssVars(resolved, prefix)
    for (const style of extraStyles) {
      if (style) {
        Object.assign(finalStyle, style)
      }
    }

    return finalStyle
  }
}
```

#### 3. Component Implementation Examples

##### A. Slider (`src/forms/slider/slider.class.ts` & `slider.tsx`)
```ts
// 1. Definition in slider.class.ts
export const sliderStyleVars = defineStyleVars({
  prefix: 's',
  variants: {
    size: {
      sm: { size: '4px', len: '4px', offset: '0px', pos: '0px' },
      md: { size: '5px', len: '5px', offset: '0px', pos: '0px' },
      lg: { size: '6px', len: '6px', offset: '0px', pos: '0px' },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'bold', size: 'sm' },
      vars: { size: '20px', len: '14px', offset: '3px', pos: 'max(3px, calc(100% - 6px))' },
    },
    {
      variants: { variant: 'bold', size: 'md' },
      vars: { size: '24px', len: '16px', offset: '4px', pos: 'max(4px, calc(100% - 8px))' },
    },
    {
      variants: { variant: 'bold', size: 'lg' },
      vars: { size: '28px', len: '18px', offset: '5px', pos: 'max(5px, calc(100% - 10px))' },
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
})

// 2. Consumption in slider.tsx:
const rootStyle = () =>
  sliderStyleVars(
    { variant: variant(), size: size() },
    provider()?.style,
    provider()?.styles?.root,
    props.styles?.root,
    props.style,
  )

return (
  <div
    data-slot="root"
    style={rootStyle()}
    class={slots().root(props.classes?.root, props.class)}
  >
    {/* Sub-elements cleanly inherit variables via CSS cascade */}
    <div data-slot="track" class={slots().track(props.classes?.track)} />
  </div>
)
```

##### B. Stepper (`src/navigation/stepper/stepper.class.ts`)
```ts
export const stepperStyleVars = defineStyleVars({
  prefix: 'st',
  variants: {
    size: {
      sm: { size: '2rem', 'sep-x': '1.5rem', 'sep-top': '2.0625rem', gap: '0.5rem', pt: '0.125rem' },
      md: { size: '2.25rem', 'sep-x': '1.75rem', 'sep-top': '2.3125rem', gap: '0.625rem', pt: '0.25rem' },
      lg: { size: '2.5rem', 'sep-x': '2rem', 'sep-top': '2.5625rem', gap: '0.75rem', pt: '0.375rem' },
    },
  },
  defaultVariants: { size: 'md' },
})
```

---

## 4. Consumer Migration Guide

Consumers upgrading from previous Moraine pre-alpha versions follow this migration guide:

| Legacy Usage | New Standard Usage |
| :--- | :--- |
| `@import 'moraine/tw3.css';`<br/>`@import 'moraine/tw4.css';` | **Remove completely.** Choose one engine setup below. The engine compiles Moraine's published classes. |
| Tailwind without `moraine/tailwind` | **Invalid.** Add `@plugin "moraine/tailwind"`; source scanning alone cannot register Moraine tokens or animations. |
| `@source "moraine";` | **Remove.** `@source` accepts a path relative to the declaring stylesheet, not an npm package specifier. Point it at `node_modules/moraine/dist` using the correct relative path for the consumer project. |
| Built-in Lucide Icons (`icon-*`) | **Runtime asset option:** import `moraine/icon.css`.<br/>**Engine-generated option:** configure `@iconify/tailwind` or UnoCSS `presetIcons()`. This choice is independent from component style generation. |
| `import { extendCN } from 'moraine'`<br/>`extendCN(twMerge)` | **Remove completely**. Conflict resolution is handled built-in by Moraine's `cn` engine. |
| `import { cva } from 'moraine'` or `moraine/utils` | **Remove completely.** There is no compatibility alias. Use `recipe({ ... })` and migrate compound variants to `{ variants: { ... }, class: ... }`. |
| `style="color: red"` | **Convert to object syntax:** `style={{ color: 'red' }}`. This applies to root `style`, slot `styles`, provider values, and composition contexts. |
| `presetMoraine({ enableComponentLayer: true })` | **Remove `enableComponentLayer`**. Component layering is deprecated; class deduplication happens at runtime via `cn`. |
| `presetMoraine({ wind3: true })` | **Remove `wind3`**. Tailwind v3 support is dropped; use `presetWind4()`. |

### 4.1. Tailwind CSS v4 Consumer Configuration

Assuming the consumer's main stylesheet is `src/app.css`, the minimal setup is:

```css
@import "tailwindcss";

/* Optional runtime icon masks; unrelated to component utility generation. */
@import "moraine/icon.css";

/* Required: registers Moraine tokens, keyframes, animations, and variants. */
@plugin "moraine/tailwind";

/* Required: path is relative to this CSS file. Adjust it for the consumer layout. */
@source "../node_modules/moraine/dist";
```

If the stylesheet lives at the project root, the source path is normally `./node_modules/moraine/dist`. Workspace and non-hoisted installations must use the path that resolves from that stylesheet to the installed package. The documentation must explain this relativity instead of presenting one path as universally canonical.

Consumers using engine-generated icons omit the `icon.css` import and configure `@iconify/tailwind` separately. In both icon modes, `@plugin "moraine/tailwind"` remains mandatory.

### 4.2. UnoCSS Consumer Configuration

The minimal UnoCSS setup registers both the utility preset and Moraine's semantic theme, and explicitly scans the installed distribution when the consumer's build pipeline excludes `node_modules`:

```ts
import { defineConfig, presetWind4 } from '@subf/unocss'
import { presetMoraine } from 'moraine/unocss'

export default defineConfig({
  presets: [presetWind4(), presetMoraine()],
  content: {
    filesystem: ['./node_modules/moraine/dist/**/*.{mjs,jsx}'],
  },
})
```

The filesystem glob is relative to the UnoCSS configuration's working directory and must be adjusted for workspace layouts. Consumers using UnoCSS `presetIcons()` configure it alongside these presets; consumers preferring the runtime asset import `moraine/icon.css` in application CSS instead. `presetMoraine()` remains mandatory in either case.

---

## 5. Implementation Roadmap & Safe Execution Order

The roadmap is strictly ordered to ensure docs and tests never break mid-migration:

### Phase 1: Engine & Core Presets (Side-by-Side)
1. Add `cn` package dependency to `package.json`.
2. Implement custom `cn` instance in `src/shared/utils.ts` using `createCn` with custom `classGroups` (`z-base`..`z-floating`, `opacity-64`). Standard Tailwind `ring-3` is handled natively without custom extension.
3. Implement the breaking, object-only in-house `recipe` API (multi-slot and atomic modes) and `VariantProps` in `src/shared/style/recipe.ts`. Do not expose a `cva` alias.
4. Implement `defineStyleVars` and `formatCssVars` in `src/shared/style/css-vars.ts`.
5. Create `src/shared/style/presets.ts` defining all selector-scoped atomic and expanded semantic-animation constants.
6. Add unit test suites `src/shared/style/recipe.test.ts` and `src/shared/style/css-vars.test.ts` verifying multi-slot resolution, cross-slot compound variants including array matchers, atomic mode, variable prefixing, object-style precedence, and `cn` deduplication. Tests must not assert cache identity or constant-time behavior.

### Phase 2: Global Configuration Infrastructure
1. Implement accessor-based `MoraineProvider`, `useMoraineConfig`, `mergeMoraineConfig`, and `mergeComponentStyle` in `src/shared/provider/moraine-provider.tsx`.
2. Export `MoraineProvider` and `useMoraineConfig` from `src/shared/provider/index.ts`, `src/utils.ts`, and `src/index.ts`.
3. Narrow `SlotStyleValue` and every component-specific `Styles` surface to object-only `JSX.CSSProperties`, including bound and composed component contexts.
4. Add `src/shared/provider/moraine-provider.test.tsx` verifying reactive deep nested merging, the default/provider/context/instance precedence contract, slot overrides, and object-only styles.

### Phase 3: Class, Component TSX, Test & Docs Migration
1. **Class Modules (36 files):** Audit and migrate all 36 `.class.ts` files to standard flat Tailwind syntax. Replace every existing `cva` variant resolver with the breaking `recipe({ ... })` schema, while keeping static-only modules as class constants in accordance with `AGENTS.md`. Consolidate fragmented multi-slot definitions (e.g. `file-upload`, `stepper`, `tabs`, `progress`, `checkbox`) and migrate dynamic dimensional tokens in `slider`, `stepper`, and `progress` to `defineStyleVars` on the root element.
2. **Component TSX Files:** Replace inline shortcuts (`effect-loading`, `effect-dis`, `hidden-hitless`, `rm-side-b`, and all semantic animation shortcuts) with constants from `presets.ts`, consume recipe slot functions and root style variables, and migrate every runtime style surface to `JSX.CSSProperties` only.
3. **Component Provider Integration:** Generate and check a package-root export inventory, then wire every public component to exactly one provider block. Include standalone keys for `AvatarGroup`, `KbdGroup`, `Form`, and `Icon`, plus documented owner inheritance for `CollapsibleTrigger`, `CollapsibleContent`, `ModalTrigger`, `ModalTriggerRenderer`, and `AvatarFace`.
4. **Test Assertions:** Update all test files asserting shortcut class names:
   - `button.test.tsx`, `checkbox.test.tsx`, `input.test.tsx`, `radio-group.test.tsx`, `select.test.tsx`, `slider.test.tsx`, `switch.test.tsx`, `textarea.test.tsx`, `tabs.test.tsx`, `progress.test.tsx`, `stepper.test.tsx`, `avatar.test.tsx`, `dialog.test.tsx`, `dropdown-menu.test.tsx`, `context-menu.test.tsx`, `breadcrumb.test.tsx`, `multi-select.test.tsx`.
5. **Docs Verification & Shortcut Cleanup:** Verify `docs/` against updated library components. `docs/` explicitly preserves `transformerVariantGroup()` and UnoCSS-specific syntax (variant groups, markdown shortcuts) in `docs/unocss.config.ts` and documentation authoring. Only references to deleted library internal shortcuts (such as `effect-fv` in docs chrome) are updated to standard utilities or presets.

### Phase 4: Transformer & Build Artifact Deletion
1. Delete `src/unocss/inject-compile-class.*`, `src/unocss/inject-prefix.*`, and `src/unocss/migrate-syntax.*`.
2. Remove `extendCN` from `src/shared/utils.ts` and public exports.
3. Remove `cls-variant` from `package.json`.
4. Update `src/utils.ts` to re-export `cn`, `recipe`, `defineStyleVars`, `formatCssVars`, `VariantProps`, and `ClassValue`. Remove `cva` from every public entry point.
5. Update `tsdown.config.ts` to implement **Plan A**:
   - Completely remove `tw3.css` and `tw4.css` build configurations, along with `baseUnocssConfig`, `createMigrateSyntaxTransformer`, and the `simplify` shortcut extractor.
   - Retain **only** `icon.css` generation via `unocss` plugin targeting `DEFAULT_ICON_SHORTCUTS` with `presetIcons` and Lucide icons.
   - Remove `transformerVariantGroup` from library packaging (**while explicitly preserving `transformerVariantGroup` in `docs/unocss.config.ts`**).
6. Remove component-facing semantic animation shortcuts from `presetMoraine` and update preset tests; `animate-mo-enter`, `animate-mo-exit`, keyframes, and theme registration remain engine capabilities. Ensure `src/tailwind/index.ts` provides a default plugin export (`export default moraineTailwind()`) so `@plugin "moraine/tailwind"` loads cleanly in Tailwind v4.
7. Update `package.json` exports and metadata:
   - Remove `./tw3.css` and `./tw4.css`.
   - Explicitly preserve `./icon.css`: `./dist/icon.css`.
   - Set `"sideEffects": ["*.css", "./dist/*.css"]` to prevent bundler tree-shaking of CSS assets.
   - Update peerDependency for Tailwind to `^4.0.0`.
   - Update `AGENTS.md` guidelines to replace all remaining references to `cva` with `recipe`.

### Phase 5: Verification & Quality Assurance
1. Run static token audit gate strictly across `src/**/*.{ts,tsx}` (`docs/` is excluded as it intentionally uses UnoCSS with `transformerVariantGroup`).
2. Run single-evaluation tracking tests on JSX-capable props (`build-ssr-safe-component` protocol).
3. Build the documentation, start `nub run docs:preview`, wait for the HTTP endpoint to become healthy, run the smoke checks, and terminate the preview process. A manually running server is not itself a pass condition.
4. Run full Vitest suite (`nub run test`) and typechecks (`nub run qa`).

---

## 6. Acceptance Criteria

The refactor is accepted only when all criteria below are satisfied:

1. **Supported engines:** A packed/published-package fixture renders representative components correctly with Tailwind CSS v4, and a separate fixture does so with UnoCSS. Tailwind v3 configuration, exports, tests, and artifacts are absent.
2. **Required consumer setup:** Tailwind documentation and fixtures load `moraine/tailwind` and scan the installed `moraine/dist` through a path that is demonstrably relative to the fixture stylesheet. UnoCSS documentation and fixtures load both `presetWind4()` and `presetMoraine()` and scan the installed distribution when needed.
3. **Component CSS ownership:** `dist/tw3.css` and `dist/tw4.css` do not exist. All component utility CSS is generated by the consumer's selected engine from statically discoverable published class strings.
4. **Runtime icon boundary:** `dist/icon.css` exists, contains the expected Lucide mask selectors, and is documented as an optional runtime asset. Components style correctly without it; only built-in icon rendering is absent when no alternative icon engine is configured.
5. **Class resolution:** Root and slot instance classes override conflicting provider and recipe classes according to the documented order. Non-conflicting classes are preserved. Tests cover modifier isolation, custom Moraine z-index values, opacity, ring width, arbitrary values, and unsupported-token preservation without claiming that `cn` generates or validates CSS.
6. **Recipe breaking change:** No source, declaration, package export, or documentation reference exposes Moraine's former `cva` API. Every variant-bearing class module uses `recipe({ ... })`, static-only modules remain constants, and atomic/multi-slot modes, boolean variants, default variants, array compound matchers, and undefined/null selections behave as specified.
7. **No recipe/style cache contract:** The implementation contains no variant-result `Map`/LRU cache in `recipe` or `defineStyleVars`, tests do not rely on referential identity, and public documentation contains no `O(1)` resolution claim.
8. **Object-only runtime styles:** Public declarations reject string values for `style` and `styles`. Generated CSS variables, nested providers, composition contexts, and instance objects merge per CSS property in the documented order, with the instance value winning.
9. **Provider coverage:** An automated inventory maps every package-root public component to exactly one standalone provider key or a documented owner component. Tests cover standalone components, owned composition primitives, nested providers, reactive provider updates, and instance opt-out/override behavior.
10. **Shortcut removal:** The source audit reports zero legacy structural shortcuts, semantic animation shortcuts, variant groups, `$` variable utilities, or legacy regex tokens in `src/**/*.{ts,tsx}`. `docs/` remains explicitly excluded and continues to support its own UnoCSS authoring syntax.
11. **Behavior preservation:** Existing interaction, accessibility, SSR/hydration, and component tests pass after class migration. State attributes continue to drive loading, disabled, active, open, invalid, and orientation styling without becoming recipe variants.
12. **Production validation:** `nub run test`, `nub run qa`, package build, both consumer fixtures, documentation production build, and the start/health-check/stop preview smoke test all pass without runtime, hydration, missing-CSS, or console errors.

---

## 7. Verification Gate & Test Matrix

| Verification Check | Target / Tool | Pass Criteria |
| :--- | :--- | :--- |
| **Token Audit Gate** | Script strictly on `src/**/*.{ts,tsx}` | Zero matches for: `effect-`, `surface-overlay`, `hidden-hitless`, legacy `style-*`, `rm-side-b`, `b-1`, `b-[trblxy]`, `content-empty`, `not-dark:`, `not-last:`, `not-first-of-type:`, `\$(?:mo\|p\|st\|s)-`, `var-(?:slider\|stepper\|progress)`, `ring-3px`, semantic `animate-(?:overlay\|popup\|menu\|popover\|tooltip\|sheet)-(?:in\|out\|side-)`, and variant groups `\w+:\([^)]+\)`. (`docs/` is excluded.) |
| **`recipe.test.ts`** | Vitest / Unit | Passes multi-slot anatomy, cross-slot compound variants and arrays, atomic mode, boolean/default/nullish variants, extra-class ordering, and `cn` merging; contains no cache-identity assertion. |
| **`css-vars.test.ts`**| Vitest / Unit | Passes variable prefixing, variant and array compound matching, nullish filtering, and ordered object-style merging; type tests reject strings. |
| **`moraine-provider.test.tsx`**| JSDOM / Unit | Passes outer/inner provider inheritance, reactive updates, composition-context precedence, slot overrides, and instance precedence over recipe defaults/providers. |
| **Provider Export Inventory** | Package entry-point inspection | Every public component resolves to exactly one provider key or documented owner; no orphan or duplicate ownership remains. |
| **Tailwind v4 Consumer Test** | Packed-package fixture / Tailwind v4 compiler | Fixture uses required `@plugin "moraine/tailwind"` plus a valid relative `@source` path to installed `moraine/dist`; representative tokens, animations, states, and overrides emit working CSS. |
| **UnoCSS Consumer Test** | Packed-package fixture / UnoCSS generator | Fixture uses `presetWind4()` plus `presetMoraine()`, scans installed `moraine/dist`, and emits representative tokens, animations, states, and overrides. |
| **SSR Single Evaluation** | Node SSR + JSDOM | Getter-backed JSX prop assertions verify props evaluate exactly once during SSR and hydration. |
| **Build Artifact Gate (Plan A)** | Script on packed `dist/` | `icon.css` exists and contains expected mask selectors; `tw3.css` and `tw4.css` are absent; package exports match. |
| **Icon Independence Test** | Both consumer fixtures | Components compile and retain layout/style with `icon.css` omitted; icon rendering works when either runtime masks or the engine icon integration is enabled. |
| **SSG Production Preview** | Automated process smoke test | Build docs, start preview, wait for successful HTTP response, assert no browser/runtime/hydration errors, then terminate the process cleanly. |
