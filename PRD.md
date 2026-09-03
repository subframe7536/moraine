# PRD: Moraine Style System Refactor & Unification

- **Project:** Moraine (SolidJS Component Library)
- **Status:** Implementation Specification (Revision 3)
- **Target Stage:** Pre-Alpha (Breaking Changes Allowed)
- **Supported Engines:** Tailwind CSS v4 and UnoCSS (**Tailwind CSS v3 is explicitly dropped**)
- **Scope:** Complete overhaul of style resolution, class conflict merging via `cn`, in-house `recipe` (multi-slot anatomy-first & atomic CVA super-set), selector-scoped runtime presets, `MoraineProvider` component-wide adoption, and prop bifurcation across all 36 `.class.ts` files and all component `.tsx` files in `src/` (**preserving `transformerVariantGroup` and UnoCSS-specific syntax in `docs/`**).

---

## 1. Executive Summary & Problem Statement

Moraine is designed to provide comprehensive, headless-yet-styled SolidJS components inspired by Nuxt UI and Shadcn. The current styling pipeline has several structural friction points:

1. **Class Name Collisions:** Moraine relies on `cls-variant` (`cls`), which performs simple string concatenation. Overriding `px-3` with `px-5` results in `px-3 px-5` on the element, creating stylesheet order dependencies and forcing `!important` overrides.
2. **Brittle Build-time Shortcut Extractions:** UnoCSS shortcuts (`effect-fv`, `effect-dis`, `surface-overlay`, etc.) are opaque to Tailwind CSS and conflict resolution engines. To support Tailwind, Moraine ran build-time extractors producing separate `tw3.css` and `tw4.css` bundles.
3. **Syntactic Drift & Non-Standard Utilities:** Specificity injectors (`transformerInjectPrefix`, `transformerInjectCompileClass`) and non-standard syntax (`migrate-syntax.ts`, UnoCSS variant groups `hover:(...)`, `b-1`, `h-$mo-...`, `var-progress-*`) broke standard Tailwind scanners and conflict engines.
4. **Lack of Global Theme Overrides:** Applications could not configure global defaults (default sizes, variants, or slot classes/styles) across components via SolidJS context.
5. **Conflated Style and State Props:** Low-frequency design variants (`variant`, `size`) and high-frequency interactive states (`loading`, `disabled`, `active`) were intermixed, causing unnecessary JavaScript CVA recomputations.
6. **Single-Element CVA Mismatch with Multi-Slot Anatomy:** Moraine's components are fundamentally multi-slot (`ComponentT.Slot`), but classic `cva` only styles single elements, forcing 5~13 duplicate `cva` functions per component (e.g. `file-upload`, `stepper`, `progress`), duplicating variant schemas and defaults, fragmenting cross-slot compound variants, and leaking hardcoded static classes into `.tsx` templates.

---

## 2. Core Objectives & Architectural Decisions

### 2.1. Supported Engines & Breaking Changes
- **Tailwind CSS v4:** First-class support via standard utility syntax.
- **UnoCSS:** First-class support via `@subf/unocss` or standard UnoCSS presets.
- **Tailwind CSS v3:** **Explicitly dropped**. All legacy v3 configurations, preflights, peer dependency ranges, and CSS bundles (`tw3.css`) are removed.
- **CSS Generation & Build Architecture (Plan A):**
  - **Component Utility Stylesheets (`tw3.css` & `tw4.css`) Eliminated:** Because all components in `src/` strictly use standard flat Tailwind utilities, external Tailwind v4 and UnoCSS consumers compile component classes on demand via `@source "moraine";` or content pipeline. Pre-compiled component CSS bundles (`tw3.css`, `tw4.css`) and their build-time extractor pipeline (`baseUnocssConfig`, `migrate-syntax`, `simplify` extractor) are completely deleted.
  - **Standalone `icon.css` Retained (Plan A):** `tsdown.config.ts` will **only** generate a single, lightweight `icon.css` asset (~few KB) containing SVG mask utilities for internal `DEFAULT_ICON_SHORTCUTS` (Lucide icons). This provides a zero-setup, drop-in icon solution for Tailwind v4 consumers via `@import 'moraine/icon.css';` without requiring `@iconify/tailwind` or `presetIcons()`. Consumers who already configure `@iconify/tailwind` or UnoCSS `presetIcons()` can omit importing `icon.css`.

### 2.2. Override Architecture Decision: Runtime `cn` vs. CSS Cascade Layers
- **Current Model:** `presetMoraine` with `enableComponentLayer` compiled component utilities into internal prefixed or hashed classes inside the `mo-component` layer with order `-1` vs consumer layer `1`.
- **New Model:** Component layer injection is **deprecated and removed**. Specificity management is transferred to **JavaScript runtime class conflict resolution via [`shadcn-ui/cn`](https://github.com/shadcn-ui/cn)**.
- **Rationale:** 
  - Standardizes Moraine with the modern Tailwind ecosystem (shadcn, Radix/Base UI).
  - Eliminates the need for custom AST transformers (`transformerInjectPrefix`, `transformerInjectCompileClass`).
  - Guarantees that consumer overrides (`class="px-5"`) always win over component defaults (`px-3`) via intelligent utility deduplication, without relying on CSS cascade layer browser support or configuration.
  - Custom Moraine tokens are explicitly registered into `cn` via `createCn` from `cn/config` to ensure accurate conflict resolution.

### 2.3. AGENTS.md Alignment & Syntax Scope
- `AGENTS.md` previously mandated UnoCSS variant groups (`hover:(bg-red-500 text-white)`).
- **Rule Updated for Component Source (`src/`):** `AGENTS.md` now explicitly mandates **standard flat Tailwind utility syntax** (`hover:bg-red-500 hover:text-white`) and strictly forbids parenthesized variant groups in component code (`src/`) so all library classes can be scanned natively by Tailwind v4 and resolved by `cn`.
- **Docs Preservation Scope (`docs/`):** The documentation application in `docs/` is built with UnoCSS and **preserves `transformerVariantGroup`** as well as UnoCSS-specific syntax (variant groups, markdown shortcuts, custom UnoCSS directives) in `docs/unocss.config.ts` and documentation pages.

---

## 3. Detailed Technical Architecture

### 3.1. Engine & Class Deduplication (`cn` & In-House `recipe` / `cva`)

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
      'ring-w': ['ring-3'],
    },
  },
})
```

#### 2. In-House Multi-Slot & Atomic `recipe` (`cva` Super-Set) (`src/shared/style/recipe.ts`)
Moraine depends on `cn` (from the `cn` package). To resolve the multi-slot anatomy mismatch while maintaining 100% backward compatibility with single-element `cva`, Moraine implements an in-house `recipe` engine with zero external dependencies, zero `any`, discrete variant caching (`O(1)` runtime resolution in SolidJS), and cross-slot compound variants:

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

export type VariantSchema = Record<string, Record<string, unknown>>

export type VariantSelection<T extends VariantSchema> = {
  [K in keyof T]?: VariantValue<keyof T[K]> | null | undefined
}

// ---------------------------------------------------------------------------
// 1. Multi-Slot Recipe Schema
// ---------------------------------------------------------------------------

export type SlotClasses<S extends string> = Partial<Record<S, ClassValue>>

export interface SlotCompoundVariant<S extends string, V extends VariantSchema> {
  variants: VariantSelection<V>
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
// 2. Atomic Single-Element Recipe Schema (100% CVA compatible)
// ---------------------------------------------------------------------------

export interface AtomicCompoundVariant<V extends VariantSchema> {
  variants: VariantSelection<V>
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

export type VariantProps<T> = T extends SlotRecipeFn<string, infer V>
  ? VariantSelection<V>
  : T extends AtomicRecipeFn<infer V>
    ? VariantSelection<V>
    : never

// ---------------------------------------------------------------------------
// 4. Runtime Implementation with Discrete Variant Cache
// ---------------------------------------------------------------------------

function serializeVariants(variants: Record<string, unknown>): string {
  const keys = Object.keys(variants).sort()
  let key = ''
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]
    const val = variants[k]
    if (val !== undefined && val !== null) {
      key += `${k}:${String(val)};`
    }
  }
  return key
}

export function createSlotRecipe<S extends string, V extends VariantSchema>(
  options: SlotRecipeOptions<S, V>,
): SlotRecipeFn<S, V> {
  const cache = new Map<string, Record<S, string | undefined>>()
  const slots = options.slots

  const recipeFn = ((variants?: VariantSelection<V>): SlotFns<S> => {
    const activeVariants: Record<string, unknown> = {
      ...options.defaultVariants,
      ...variants,
    }
    const cacheKey = serializeVariants(activeVariants)

    let resolvedClasses = cache.get(cacheKey)
    if (!resolvedClasses) {
      const slotClassMap = {} as Record<S, ClassValue[]>
      for (const slot of slots) {
        slotClassMap[slot] = options.base?.[slot] ? [options.base[slot]] : []
      }

      if (options.variants) {
        for (const [vName, vMap] of Object.entries(options.variants)) {
          const selectedVal = activeVariants[vName]
          if (selectedVal !== undefined && selectedVal !== null) {
            const matchedSlotMap = (vMap as Record<string, SlotClasses<S>>)[String(selectedVal)]
            if (matchedSlotMap) {
              for (const [slot, cls] of Object.entries(matchedSlotMap)) {
                if (cls) slotClassMap[slot as S]?.push(cls as ClassValue)
              }
            }
          }
        }
      }

      if (options.compoundVariants) {
        for (const cv of options.compoundVariants) {
          const matches = Object.entries(cv.variants).every(([k, expected]) => {
            const actual = activeVariants[k]
            if (actual === undefined || actual === null) return false
            if (Array.isArray(expected)) {
              return expected.some((v) => String(v) === String(actual))
            }
            return String(expected) === String(actual)
          })

          if (matches) {
            for (const [slot, cls] of Object.entries(cv.class)) {
              if (cls) slotClassMap[slot as S]?.push(cls as ClassValue)
            }
          }
        }
      }

      resolvedClasses = {} as Record<S, string | undefined>
      for (const slot of slots) {
        resolvedClasses[slot] = cn(slotClassMap[slot])
      }
      cache.set(cacheKey, resolvedClasses)
    }

    const result = {
      classes: resolvedClasses,
    } as SlotFns<S>

    for (const slot of slots) {
      const baseClass = resolvedClasses[slot]
      result[slot] = (...extraClasses: ClassValue[]) => {
        if (extraClasses.length === 0) return baseClass
        return cn(baseClass, ...extraClasses)
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
  const cache = new Map<string, string | undefined>()

  return (variants?: VariantSelection<V>, ...extraClasses: ClassValue[]): string | undefined => {
    const activeVariants: Record<string, unknown> = {
      ...options.defaultVariants,
      ...variants,
    }
    const cacheKey = serializeVariants(activeVariants)

    let baseResolved = cache.get(cacheKey)
    if (!baseResolved) {
      const classes: ClassValue[] = options.base ? [options.base] : []

      if (options.variants) {
        for (const [vName, vMap] of Object.entries(options.variants)) {
          const selectedVal = activeVariants[vName]
          if (selectedVal !== undefined && selectedVal !== null) {
            const matchedClass = (vMap as Record<string, ClassValue>)[String(selectedVal)]
            if (matchedClass) classes.push(matchedClass)
          }
        }
      }

      if (options.compoundVariants) {
        for (const cv of options.compoundVariants) {
          const matches = Object.entries(cv.variants).every(([k, expected]) => {
            const actual = activeVariants[k]
            if (actual === undefined || actual === null) return false
            if (Array.isArray(expected)) {
              return expected.some((v) => String(v) === String(actual))
            }
            return String(expected) === String(actual)
          })

          if (matches && cv.class) classes.push(cv.class)
        }
      }

      baseResolved = cn(classes)
      cache.set(cacheKey, baseResolved)
    }

    if (extraClasses.length === 0) return baseResolved
    return cn(baseResolved, ...extraClasses)
  }
}

export function recipe<S extends string, V extends VariantSchema>(
  options: SlotRecipeOptions<S, V>,
): SlotRecipeFn<S, V>
export function recipe<V extends VariantSchema>(
  options: AtomicRecipeOptions<V>,
): AtomicRecipeFn<V>
export function recipe(options: any): any {
  if ('slots' in options && Array.isArray(options.slots)) {
    return createSlotRecipe(options)
  }
  return createAtomicRecipe(options)
}

/** Backward-compatible alias */
export const cva = recipe
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
```

---

### 3.3. Token Inventory & Zero Non-Standard Tokens Gate

All non-standard syntax previously translated by `migrate-syntax.ts` or UnoCSS regex rules is mapped to standard Tailwind utility syntax across all 36 `.class.ts` files and all component `.tsx` files in `src/` (**`docs/` is excluded and preserves `transformerVariantGroup` and UnoCSS syntax**):

| Non-Standard / UnoCSS Token | Standard Tailwind Replacement | Scope |
| :--- | :--- | :--- |
| `b-1`, `b` | `border` | `accordion`, `button`, `card`, `file-upload`, etc. |
| `b-b-2`, `b-border`, `b-transparent` | `border-b-2`, `border-border`, `border-transparent` | `accordion`, `card`, `select` |
| `content-empty` | `content-['']` | `avatar`, `resizable`, `slider` |
| `not-dark:bg-clip-padding` | `[html:not(.dark)_&]:bg-clip-padding` | `card.class.ts`, `slider.class.ts` |
| `not-last:border-(b b-border)` | `[&:not(:last-child)]:border-b [&:not(:last-child)]:border-border` | `accordion.class.ts` |
| `h-$mo-collapsible-content-height` | `h-[var(--mo-collapsible-content-height)]` | `accordion`, `collapsible` |
| `origin-$mo-popper-...` | `origin-[var(--mo-popper-content-transform-origin)]` | `select`, `menu`, `popover`, `tooltip` |
| `var-progress-{n}` | Root `style` injection via `progressStyleVars` (`--p-size`) | `progress.class.ts` & `progress.tsx` |
| `var-slider-{n}` | Root `style` injection via `sliderStyleVars` (`--s-size`) | `slider.class.ts` & `slider.tsx` |
| `var-slider-bold-{size}-{len}-{off}`| Root `style` injection via `sliderStyleVars` (`--s-size`, `--s-len`, `--s-offset`, `--s-pos`) | `slider.class.ts` & `slider.tsx` |
| `var-stepper-{s}-{x}-{g}-{p}` | Root `style` injection via `stepperStyleVars` (`--st-size`, `--st-sep-x`, `--st-sep-top`, `--st-gap`, `--st-pt`) | `stepper.class.ts` & `stepper.tsx` |
| `hover:(bg-red-500 text-white)` | `hover:bg-red-500 hover:text-white` | All 36 `.class.ts` files and `.tsx` files in `src/` |
| `after:(content-empty absolute ...)` | `after:content-[''] after:absolute ...` | `avatar`, `resizable`, `slider` in `src/` |
| `ring-3px` | `ring-3` | Focus presets |

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
│ • Evaluated by CVA & cn()           │ • Binds to DOM: data-*, aria-*, etc.│
│ • Configurable in MoraineProvider   │ • Controlled per-instance/event     │
│ • Zero re-execution on state toggle │ • Styled via CSS attribute rules    │
└─────────────────────────────────────┴─────────────────────────────────────┘
```

#### Native Button vs. Polymorphic Control Semantics
- **Solid Reactivity Rule:** In accordance with `AGENTS.md`, class expressions are not memoized (`createMemo` is not used for classes); they are evaluated in-place.
- **Performance Realization:** By keeping `loading`, `disabled`, and `active` out of CVA variants, toggling loading or disabled state updates the reactive DOM attributes without re-invoking CVA or `cn()`.
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
  style?: JSX.CSSProperties | string
  styles?: Partial<S>
}

export interface MoraineConfig {
  accordion?: ComponentDefaultStyle<AccordionT.Variant, AccordionT.Classes, AccordionT.Styles>
  avatar?: ComponentDefaultStyle<AvatarT.Variant, AvatarT.Classes, AvatarT.Styles>
  badge?: ComponentDefaultStyle<BadgeT.Variant, BadgeT.Classes, BadgeT.Styles>
  button?: ComponentDefaultStyle<ButtonT.Variant, ButtonT.Classes, ButtonT.Styles>
  buttonGroup?: ComponentDefaultStyle<ButtonGroupT.Variant, ButtonGroupT.Classes, ButtonGroupT.Styles>
  card?: ComponentDefaultStyle<CardT.Variant, CardT.Classes, CardT.Styles>
  checkbox?: ComponentDefaultStyle<CheckboxT.Variant, CheckboxT.Classes, CheckboxT.Styles>
  checkboxGroup?: ComponentDefaultStyle<CheckboxGroupT.Variant, CheckboxGroupT.Classes, CheckboxGroupT.Styles>
  collapsible?: ComponentDefaultStyle<CollapsibleT.Variant, CollapsibleT.Classes, CollapsibleT.Styles>
  commandPalette?: ComponentDefaultStyle<CommandPaletteT.Variant, CommandPaletteT.Classes, CommandPaletteT.Styles>
  dialog?: ComponentDefaultStyle<DialogT.Variant, DialogT.Classes, DialogT.Styles>
  dropdownMenu?: ComponentDefaultStyle<DropdownMenuT.Variant, DropdownMenuT.Classes, DropdownMenuT.Styles>
  fileUpload?: ComponentDefaultStyle<FileUploadT.Variant, FileUploadT.Classes, FileUploadT.Styles>
  formField?: ComponentDefaultStyle<FormFieldT.Variant, FormFieldT.Classes, FormFieldT.Styles>
  input?: ComponentDefaultStyle<InputT.Variant, InputT.Classes, InputT.Styles>
  inputNumber?: ComponentDefaultStyle<InputNumberT.Variant, InputNumberT.Classes, InputNumberT.Styles>
  kbd?: ComponentDefaultStyle<KbdT.Variant, KbdT.Classes, KbdT.Styles>
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

#### 2. Deep Per-Key Merging for Nested Providers
Nested providers do not overwrite whole component blocks; they deep-merge `defaultProps`, `classes`, and `styles`:

```ts
export function mergeComponentStyle<
  V extends Record<string, unknown>,
  C extends Record<string, SlotClassValue>,
  S extends Record<string, SlotStyleValue>,
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
      mergedStyles[slot] = typeof sty === 'object' && typeof mergedStyles[slot] === 'object'
        ? { ...mergedStyles[slot], ...sty }
        : (sty ?? mergedStyles[slot])
    }
  }

  return {
    defaultProps: { ...parent.defaultProps, ...child.defaultProps },
    class: cn(parent.class, child.class),
    classes: mergedClasses as Partial<C>,
    style: typeof child.style === 'object' && typeof parent.style === 'object'
      ? { ...parent.style, ...child.style }
      : (child.style ?? parent.style),
    styles: mergedStyles as Partial<S>,
  }
}
```

#### 3. Component Adoption Pattern (All 4 Layers Preserved)
Components preserve their base slot classes and variant definitions via `recipe`, seamlessly merging with provider and props:

```tsx
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>) {
  const config = useMoraineConfig()
  const provider = () => config?.button
  const group = useContext(ButtonGroupContext)

  // 1. Single source of truth: Recipe defaults apply only when props, group, and provider are undefined:
  const variant = () => props.variant ?? group?.variant ?? provider()?.defaultProps?.variant
  const size = () => props.size ?? group?.size ?? provider()?.defaultProps?.size

  // 2. Fast O(1) Cached Multi-Slot Recipe Resolution:
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
      props.classes?.leading,
      isLeadingLoading() && LOADING_SPINNER, // Dynamic state class
    )

  // 5. Deterministic Slot Style Precedence:
  const rootStyle = () => ({
    ...(typeof provider()?.style === 'object' ? provider()?.style : undefined),
    ...provider()?.styles?.root,
    ...group?.styles?.root,
    ...props.styles?.root,
    ...(typeof props.style === 'object' ? props.style : undefined),
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
A dedicated, zero-dependency generic utility module is introduced to declare and resolve variant-driven CSS custom properties with automatic prefixing, `O(1)` LRU/Map caching, and seamless 4-layer style precedence:

```ts
import type { JSX } from 'solid-js'
import type { VariantSchema, VariantSelection } from './recipe'

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
    variants: VariantSelection<V>
    vars: StyleVarRecord
  }>
  defaultVariants?: VariantSelection<V>
}

export type StyleVarsFn<V extends VariantSchema> = (
  variants?: VariantSelection<V>,
  ...extraStyles: Array<JSX.CSSProperties | string | undefined>
) => JSX.CSSProperties

/**
 * Creates a variant-driven CSS custom properties resolver for component root elements.
 * Eliminates compound variant explosion across child slots and keeps HTML classes pristine.
 */
export function defineStyleVars<V extends VariantSchema>(
  options: StyleVarsOptions<V>,
): StyleVarsFn<V> {
  const cache = new Map<string, JSX.CSSProperties>()
  const prefix = options.prefix

  return (
    variants?: VariantSelection<V>,
    ...extraStyles: Array<JSX.CSSProperties | string | undefined>
  ): JSX.CSSProperties => {
    const activeVariants: Record<string, unknown> = {
      ...options.defaultVariants,
      ...variants,
    }

    // 1. O(1) Cache Lookup
    const keys = Object.keys(activeVariants).sort()
    let cacheKey = ''
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]
      const val = activeVariants[k]
      if (val !== undefined && val !== null) {
        cacheKey += `${k}:${String(val)};`
      }
    }

    let baseVars = cache.get(cacheKey)
    if (!baseVars) {
      const resolved: StyleVarRecord = { ...options.base }

      if (options.variants) {
        for (const [vName, vMap] of Object.entries(options.variants)) {
          const selectedVal = activeVariants[vName]
          if (selectedVal !== undefined && selectedVal !== null) {
            const matchedVars = (vMap as Record<string, StyleVarRecord>)[String(selectedVal)]
            if (matchedVars) {
              Object.assign(resolved, matchedVars)
            }
          }
        }
      }

      if (options.compoundVariants) {
        for (const cv of options.compoundVariants) {
          const matches = Object.entries(cv.variants).every(([k, expected]) => {
            const actual = activeVariants[k]
            if (actual === undefined || actual === null) return false
            if (Array.isArray(expected)) {
              return expected.some((v) => String(v) === String(actual))
            }
            return String(expected) === String(actual)
          })

          if (matches) {
            Object.assign(resolved, cv.vars)
          }
        }
      }

      baseVars = formatCssVars(resolved, prefix)
      cache.set(cacheKey, baseVars)
    }

    // 2. Strict 4-Layer Precedence Merge
    const finalStyle: Record<string, unknown> = { ...baseVars }
    for (let i = 0; i < extraStyles.length; i++) {
      const s = extraStyles[i]
      if (s && typeof s === 'object') {
        Object.assign(finalStyle, s)
      }
    }

    return finalStyle as JSX.CSSProperties
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
    class={slots().root(props.class, props.classes?.root)}
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
| `@import 'moraine/tw3.css';`<br/>`@import 'moraine/tw4.css';` | **Remove completely**. Component utilities are no longer bundled. Use `@source "moraine";` (Tailwind v4) or add `./node_modules/moraine/**/*.mjs` to UnoCSS content. |
| Built-in Lucide Icons (`icon-*`) | **Plan A (Drop-in):** Add `@import 'moraine/icon.css';` to your main CSS file (zero plugin setup required).<br/>**Plan B (Zero CSS import):** Configure `@iconify/tailwind` (Tailwind v4) or `presetIcons()` (UnoCSS) in consumer build config. |
| `import { extendCN } from 'moraine'`<br/>`extendCN(twMerge)` | **Remove completely**. Conflict resolution is handled built-in by Moraine's `cn` engine. |
| `presetMoraine({ enableComponentLayer: true })` | **Remove `enableComponentLayer`**. Component layering is deprecated; class deduplication happens at runtime via `cn`. |
| `presetMoraine({ wind3: true })` | **Remove `wind3`**. Tailwind v3 support is dropped; use `presetWind4()`. |
| `@source "../node_modules/moraine/**/*"` | Update to canonical `@source "moraine";`. |

---

## 5. Implementation Roadmap & Safe Execution Order

The roadmap is strictly ordered to ensure docs and tests never break mid-migration:

### Phase 1: Engine & Core Presets (Side-by-Side)
1. Add `cn` package dependency to `package.json`.
2. Implement custom `cn` instance in `src/shared/utils.ts` using `createCn` with custom `classGroups` (`z-base`..`z-floating`, `opacity-64`, `ring-3`).
3. Implement in-house `recipe` (multi-slot anatomy & atomic `cva` super-set) and `VariantProps` in `src/shared/style/recipe.ts`.
4. Implement `defineStyleVars` and `formatCssVars` in `src/shared/style/css-vars.ts`.
5. Create `src/shared/style/presets.ts` defining all selector-scoped atomic constants.
6. Add unit test suites `src/shared/style/recipe.test.ts` and `src/shared/style/css-vars.test.ts` verifying multi-slot resolution, cross-slot compound variants, discrete variant caching, atomic mode, variable prefixing, 4-layer style precedence, and `cn` deduplication.

### Phase 2: Global Configuration Infrastructure
1. Implement `MoraineProvider`, `useMoraineConfig`, and `mergeComponentStyle` in `src/shared/provider/moraine-provider.tsx`.
2. Export `MoraineProvider` and `useMoraineConfig` from `src/shared/provider/index.ts`, `src/utils.ts`, and `src/index.ts`.
3. Add `src/shared/provider/moraine-provider.test.tsx` verifying deep nested merging and precedence.

### Phase 3: Class, Component TSX, Test & Docs Migration
1. **Class Modules (36 files):** Migrate all 36 `.class.ts` files to standard flat Tailwind syntax, selector-scoped constants from `presets.ts`, and CSS variable utilities. Consolidate fragmented multi-slot `cva` definitions (e.g. `file-upload`, `stepper`, `tabs`, `progress`, `checkbox`) into unified `recipe` structures. Migrate dynamic dimensional tokens in `slider`, `stepper`, and `progress` to `defineStyleVars` on Root element.
2. **Component TSX Files:** Migrate all component `.tsx` files to replace inline shortcuts (`effect-loading`, `effect-dis`, `hidden-hitless`, `rm-side-b`, etc.) with constants from `presets.ts`, and consume unified `recipe` slot functions and Root `styleVars`.
3. **Component Provider Integration:** Wire all public components (`Button`, `Input`, `Select`, `Dialog`, `Modal`, `Tabs`, `Accordion`, etc.) to consume `useMoraineConfig()` for `defaultProps`, `classes`, and `styles`.
4. **Test Assertions:** Update all test files asserting shortcut class names:
   - `button.test.tsx`, `checkbox.test.tsx`, `input.test.tsx`, `radio-group.test.tsx`, `select.test.tsx`, `slider.test.tsx`, `switch.test.tsx`, `textarea.test.tsx`, `tabs.test.tsx`, `progress.test.tsx`, `stepper.test.tsx`, `avatar.test.tsx`, `dialog.test.tsx`, `dropdown-menu.test.tsx`, `context-menu.test.tsx`, `breadcrumb.test.tsx`, `multi-select.test.tsx`.
5. **Docs Verification & Shortcut Cleanup:** Verify `docs/` against updated library components. `docs/` explicitly preserves `transformerVariantGroup()` and UnoCSS-specific syntax (variant groups, markdown shortcuts) in `docs/unocss.config.ts` and documentation authoring. Only references to deleted library internal shortcuts (such as `effect-fv` in docs chrome) are updated to standard utilities or presets.

### Phase 4: Transformer & Build Artifact Deletion
1. Delete `src/unocss/inject-compile-class.*`, `src/unocss/inject-prefix.*`, and `src/unocss/migrate-syntax.*`.
2. Remove `extendCN` from `src/shared/utils.ts` and public exports.
3. Remove `cls-variant` from `package.json`.
4. Update `src/utils.ts` to re-export `cn`, `recipe`, `cva`, `defineStyleVars`, `formatCssVars`, `VariantProps`, `ClassValue`.
5. Update `tsdown.config.ts` to implement **Plan A**:
   - Completely remove `tw3.css` and `tw4.css` build configurations, along with `baseUnocssConfig`, `createMigrateSyntaxTransformer`, and the `simplify` shortcut extractor.
   - Retain **only** `icon.css` generation via `unocss` plugin targeting `DEFAULT_ICON_SHORTCUTS` with `presetIcons` and Lucide icons.
   - Remove `transformerVariantGroup` from library packaging (**while explicitly preserving `transformerVariantGroup` in `docs/unocss.config.ts`**).
6. Update `package.json` exports:
   - Remove `./tw3.css` and `./tw4.css`.
   - Explicitly preserve `./icon.css`: `./dist/icon.css`.
   - Update peerDependency for Tailwind to `^4.0.0`.

### Phase 5: Verification & Quality Assurance
1. Run static token audit gate strictly across `src/**/*.{ts,tsx}` (`docs/` is excluded as it intentionally uses UnoCSS with `transformerVariantGroup`).
2. Run single-evaluation tracking tests on JSX-capable props (`build-ssr-safe-component` protocol).
3. Run `nub run docs:preview` and verify production SSG rendering without console warnings.
4. Run full Vitest suite (`nub run test`) and typechecks (`nub run qa`).

---

## 6. Verification Gate & Test Matrix

| Verification Check | Target / Tool | Pass Criteria |
| :--- | :--- | :--- |
| **Token Audit Gate** | Node script strictly on `src/**/*.{ts,tsx}` | Zero matches for: `effect-`, `surface-overlay`, `hidden-hitless`, `style-`, `rm-side-b`, `b-1`, `b-[trblxy]`, `content-empty`, `not-dark:`, `not-last:`, `\$(?:mo\|p\|st\|s)-`, `var-(?:slider\|stepper\|progress)`, `ring-3px`, and variant groups `\w+:\([^)]+\)`. (`docs/` is excluded as it intentionally preserves UnoCSS with `transformerVariantGroup`). |
| **`recipe.test.ts`** | Vitest / Unit | 100% pass on multi-slot anatomy, cross-slot compound variants, discrete variant cache hit, atomic single-element fallback, boolean variants, default variants, undefined handling, `cn` merging. |
| **`css-vars.test.ts`**| Vitest / Unit | 100% pass on variable prefixing, variant matching, compound variants, cache hit, 4-layer style merging. |
| **`moraine-provider.test.tsx`**| JSDOM / Unit | 100% pass on global defaults, deep nested provider merge, slot overrides, precedence over CVA defaults. |
| **Tailwind v4 Consumer Test** | Tailwind v4 Compiler | Published-fixture build test asserting clean compilation of all component classes with `@source "moraine"`. |
| **UnoCSS Consumer Test** | UnoCSS Generator | Asserts clean CSS emission via `presetMoraine()` and `presetWind4()`. |
| **SSR Single Evaluation** | Node SSR + JSDOM | Getter-backed JSX prop assertions verify props evaluate exactly once during SSR and hydration. |
| **Build Artifact Gate (Plan A)** | Node script on `dist/` | Asserts `dist/icon.css` is generated (~KB range), while `dist/tw3.css` and `dist/tw4.css` are completely absent. |
| **SSG Production Preview** | `nub run docs:preview` | Complete documentation preview build runs without CSS breakage, hydration warnings, or runtime errors. |
