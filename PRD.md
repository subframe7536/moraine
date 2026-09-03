# PRD: Moraine Style System Refactor & Unification

- **Project:** Moraine (SolidJS Component Library)
- **Status:** Implementation Specification (Revision 2)
- **Target Stage:** Pre-Alpha (Breaking Changes Allowed)
- **Supported Engines:** Tailwind CSS v4 and UnoCSS (**Tailwind CSS v3 is explicitly dropped**)
- **Scope:** Complete overhaul of style resolution, class conflict merging via `cn`, in-house `cva`, selector-scoped runtime presets, `MoraineProvider` component-wide adoption, and prop bifurcation across all 36 `.class.ts` files, all component `.tsx` files, and `docs/`.

---

## 1. Executive Summary & Problem Statement

Moraine is designed to provide comprehensive, headless-yet-styled SolidJS components inspired by Nuxt UI and Shadcn. The current styling pipeline has several structural friction points:

1. **Class Name Collisions:** Moraine relies on `cls-variant` (`cls`), which performs simple string concatenation. Overriding `px-3` with `px-5` results in `px-3 px-5` on the element, creating stylesheet order dependencies and forcing `!important` overrides.
2. **Brittle Build-time Shortcut Extractions:** UnoCSS shortcuts (`effect-fv`, `effect-dis`, `surface-overlay`, etc.) are opaque to Tailwind CSS and conflict resolution engines. To support Tailwind, Moraine ran build-time extractors producing separate `tw3.css` and `tw4.css` bundles.
3. **Syntactic Drift & Non-Standard Utilities:** Specificity injectors (`transformerInjectPrefix`, `transformerInjectCompileClass`) and non-standard syntax (`migrate-syntax.ts`, UnoCSS variant groups `hover:(...)`, `b-1`, `font-500`, `h-$mo-...`, `var-progress-*`) broke standard Tailwind scanners and conflict engines.
4. **Lack of Global Theme Overrides:** Applications could not configure global defaults (default sizes, variants, or slot classes/styles) across components via SolidJS context.
5. **Conflated Style and State Props:** Low-frequency design variants (`variant`, `size`) and high-frequency interactive states (`loading`, `disabled`, `active`) were intermixed, causing unnecessary JavaScript CVA recomputations.

---

## 2. Core Objectives & Architectural Decisions

### 2.1. Supported Engines & Breaking Changes
- **Tailwind CSS v4:** First-class support via standard utility syntax.
- **UnoCSS:** First-class support via `@subf/unocss` or standard UnoCSS presets.
- **Tailwind CSS v3:** **Explicitly dropped**. All legacy v3 configurations, preflights, peer dependency ranges, and CSS bundles (`tw3.css`) are removed.
- **`icon.css` Retained as Standalone Icon Asset:** `tw3.css` and `tw4.css` (component utility styles) are eliminated. `icon.css` remains as an optional, self-contained asset for consumers wanting bundled Lucide icon masks without `@iconify/tailwind`.

### 2.2. Override Architecture Decision: Runtime `cn` vs. CSS Cascade Layers
- **Current Model:** `presetMoraine` with `enableComponentLayer` compiled component utilities into internal prefixed or hashed classes inside the `mo-component` layer with order `-1` vs consumer layer `1`.
- **New Model:** Component layer injection is **deprecated and removed**. Specificity management is transferred to **JavaScript runtime class conflict resolution via [`shadcn-ui/cn`](https://github.com/shadcn-ui/cn)**.
- **Rationale:** 
  - Standardizes Moraine with the modern Tailwind ecosystem (shadcn, Radix/Base UI).
  - Eliminates the need for custom AST transformers (`transformerInjectPrefix`, `transformerInjectCompileClass`).
  - Guarantees that consumer overrides (`class="px-5"`) always win over component defaults (`px-3`) via intelligent utility deduplication, without relying on CSS cascade layer browser support or configuration.
  - Custom Moraine tokens are explicitly registered into `cn` via `createCn` from `cn/config` to ensure accurate conflict resolution.

### 2.3. AGENTS.md Alignment
- `AGENTS.md` previously mandated UnoCSS variant groups (`hover:(bg-red-500 text-white)`).
- **Rule Updated:** `AGENTS.md` now explicitly mandates **standard flat Tailwind utility syntax** (`hover:bg-red-500 hover:text-white`) and strictly forbids parenthesized variant groups so all classes can be scanned natively by Tailwind v4 and resolved by `cn`.

---

## 3. Detailed Technical Architecture

### 3.1. Engine & Class Deduplication (`cn` & In-House `cva`)

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

#### 2. In-House `cva` Implementation (`src/shared/cva.ts`)
Moraine depends on `cn` (from the `cn` package). `cva` is implemented directly inside Moraine with zero additional dependencies, avoiding forbidden `any`, and returning `string | undefined` to match `cn` semantics:

```ts
import { cn } from './utils'

export type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | undefined
  | null
  | ClassValue[]
  | Record<string, unknown>

export type VariantSchema = Record<string, Record<string, ClassValue>>

export type VariantValue<T> = T extends 'true' | 'false' ? boolean | 'true' | 'false' : T

export type VariantSelection<T extends VariantSchema> = {
  [K in keyof T]?: VariantValue<keyof T[K]> | null | undefined
}

export type CompoundVariant<T extends VariantSchema> = {
  [K in keyof T]?:
    | VariantValue<keyof T[K]>
    | Array<VariantValue<keyof T[K]>>
    | null
    | undefined
} & {
  class: ClassValue
}

export interface CvaOptions<T extends VariantSchema> {
  variants?: T
  defaultVariants?: VariantSelection<T>
  compoundVariants?: Array<CompoundVariant<T>>
}

// Inferred selection object without `any`, matching `VariantProps<typeof buttonVariants>` across all call sites:
export type VariantProps<T extends (...args: unknown[]) => unknown> =
  Parameters<T>[0] extends undefined ? Record<never, never> : NonNullable<Parameters<T>[0]>

export interface CvaFn<T extends VariantSchema> {
  (variants?: VariantSelection<T>, ...extraClasses: ClassValue[]): string | undefined
}

export function cva<T extends VariantSchema>(
  base?: ClassValue,
  options?: CvaOptions<T>,
): CvaFn<T> {
  return (variants?: VariantSelection<T>, ...extraClasses: ClassValue[]): string | undefined => {
    const activeVariants: Record<string, unknown> = {
      ...options?.defaultVariants,
      ...variants,
    }

    const classes: ClassValue[] = [base]

    if (options?.variants) {
      for (const [variantName, variantMap] of Object.entries(options.variants)) {
        const selectedValue = activeVariants[variantName]
        if (selectedValue !== undefined && selectedValue !== null) {
          const key = String(selectedValue)
          const matchedClass = variantMap[key]
          if (matchedClass) {
            classes.push(matchedClass)
          }
        }
      }
    }

    if (options?.compoundVariants) {
      for (const compound of options.compoundVariants) {
        const { class: compoundClass, ...conditions } = compound
        const conditionEntries = Object.entries(conditions)
        if (conditionEntries.length === 0) continue

        const matches = conditionEntries.every(([key, expectedValue]) => {
          const actualValue = activeVariants[key]
          if (actualValue === undefined || actualValue === null) return false

          if (Array.isArray(expectedValue)) {
            return expectedValue.some((v) => String(v) === String(actualValue))
          }
          return String(expectedValue) === String(actualValue)
        })

        if (matches && compoundClass) {
          classes.push(compoundClass)
        }
      }
    }

    return cn(classes, extraClasses)
  }
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
```

---

### 3.3. Token Inventory & Zero Non-Standard Tokens Gate

All non-standard syntax previously translated by `migrate-syntax.ts` or UnoCSS regex rules is mapped to standard Tailwind utility syntax across all 36 `.class.ts` files, all component `.tsx` files, and `docs/`:

| Non-Standard / UnoCSS Token | Standard Tailwind Replacement | Scope |
| :--- | :--- | :--- |
| `b-1`, `b` | `border` | `accordion`, `button`, `card`, `file-upload`, etc. |
| `b-b-2`, `b-border`, `b-transparent` | `border-b-2`, `border-border`, `border-transparent` | `accordion`, `card`, `select` |
| `font-500` | `font-medium` | `accordion`, `button`, `tabs`, etc. |
| `content-empty` | `content-['']` | `avatar`, `resizable`, `slider` |
| `not-dark:bg-clip-padding` | `[html:not(.dark)_&]:bg-clip-padding` | `card.class.ts`, `slider.class.ts` |
| `not-last:border-(b b-border)` | `[&:not(:last-child)]:border-b [&:not(:last-child)]:border-border` | `accordion.class.ts` |
| `h-$mo-collapsible-content-height` | `h-[var(--mo-collapsible-content-height)]` | `accordion`, `collapsible` |
| `origin-$mo-popper-...` | `origin-[var(--mo-popper-content-transform-origin)]` | `select`, `menu`, `popover`, `tooltip` |
| `mb-$mo-popper-...` | `mb-[var(--mo-popper-content-overflow-padding)]` | `select`, `menu`, `popover`, `tooltip` |
| `var-progress-{n}` | `[--p-size:0.25rem]`, `[--p-size:0.5rem]`, `[--p-size:0.75rem]` | `progress.class.ts` |
| `var-slider-{n}` | `[--s-size:4px] [--s-len:4px] [--s-offset:0px] [--s-pos:0px]` | `slider.class.ts` |
| `var-slider-bold-{size}-{len}-{off}`| `[--s-size:{size}px] [--s-len:{len}px] [--s-offset:{off}px] [--s-pos:max({off}px,calc(100%-{off*2}px))]` | `slider.class.ts` |
| `var-stepper-{s}-{x}-{g}-{p}` | `[--st-size:2rem] [--st-sep-x:1.5rem] [--st-sep-top:2.0625rem] [--st-gap:0.5rem] [--st-pt:0.125rem]` | `stepper.class.ts` |
| `hover:(bg-red-500 text-white)` | `hover:bg-red-500 hover:text-white` | All 36 `.class.ts` files, all `.tsx` files, and `docs/` |
| `after:(content-empty absolute ...)` | `after:content-[''] after:absolute ...` | `avatar`, `resizable`, `slider` |
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
Components must preserve their base slot classes/constants when merging with provider and props:

```tsx
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>) {
  const config = useMoraineConfig()
  const provider = () => config?.button
  const group = useContext(ButtonGroupContext)

  // 1. Single source of truth: CVA defaults apply only when props, group, and provider are undefined:
  const variant = () => props.variant ?? group?.variant ?? provider()?.defaultProps?.variant
  const size = () => props.size ?? group?.size ?? provider()?.defaultProps?.size

  // 2. Deterministic Root Class Precedence:
  const rootClass = () =>
    cn(
      buttonVariants({ variant: variant(), size: size() }),
      provider()?.class,
      provider()?.classes?.root,
      group?.class,
      props.classes?.root,
      props.class,
    )

  // 3. Deterministic Slot Class Precedence (Base Slot Constants NEVER Dropped):
  const leadingClass = () =>
    cn(
      BUTTON_LEADING_CLASS,               // 1. Base slot constant
      provider()?.classes?.leading,       // 2. Provider default slot
      group?.classes?.leading,            // 3. Group context slot
      props.classes?.leading,             // 4. Component prop slot
      isLeadingLoading() && LOADING_SPINNER // 5. Dynamic state class
    )

  // 4. Deterministic Slot Style Precedence:
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

## 4. Consumer Migration Guide

Consumers upgrading from previous Moraine pre-alpha versions follow this migration guide:

| Legacy Usage | New Standard Usage |
| :--- | :--- |
| `@import 'moraine/tw3.css';`<br/>`@import 'moraine/tw4.css';` | **Remove completely**. Add `@source "moraine";` (Tailwind v4) or add `./node_modules/moraine/**/*.mjs` to UnoCSS content. |
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
3. Implement in-house `cva` and `VariantProps` in `src/shared/cva.ts`.
4. Create `src/shared/style/presets.ts` defining all selector-scoped atomic constants.
5. Add unit test suite `src/shared/cva.test.ts` verifying boolean variants, compound variant arrays, readonly configs, undefined handling, and `cn` deduplication.

### Phase 2: Global Configuration Infrastructure
1. Implement `MoraineProvider`, `useMoraineConfig`, and `mergeComponentStyle` in `src/shared/provider/moraine-provider.tsx`.
2. Export `MoraineProvider` and `useMoraineConfig` from `src/shared/provider/index.ts`, `src/utils.ts`, and `src/index.ts`.
3. Add `src/shared/provider/moraine-provider.test.tsx` verifying deep nested merging and precedence.

### Phase 3: Class, Component TSX, Test & Docs Migration
1. **Class Modules (36 files):** Migrate all 36 `.class.ts` files to standard flat Tailwind syntax, selector-scoped constants from `presets.ts`, and CSS variable utilities.
2. **Component TSX Files:** Migrate all component `.tsx` files to replace inline shortcuts (`effect-loading`, `effect-dis`, `hidden-hitless`, `rm-side-b`, etc.) with constants from `presets.ts`.
3. **Component Provider Integration:** Wire all public components (`Button`, `Input`, `Select`, `Dialog`, `Modal`, `Tabs`, `Accordion`, etc.) to consume `useMoraineConfig()` for `defaultProps`, `classes`, and `styles`.
4. **Test Assertions:** Update all test files asserting shortcut class names:
   - `button.test.tsx`, `checkbox.test.tsx`, `input.test.tsx`, `radio-group.test.tsx`, `select.test.tsx`, `slider.test.tsx`, `switch.test.tsx`, `textarea.test.tsx`, `tabs.test.tsx`, `progress.test.tsx`, `stepper.test.tsx`, `avatar.test.tsx`, `dialog.test.tsx`, `dropdown-menu.test.tsx`, `context-menu.test.tsx`, `breadcrumb.test.tsx`, `multi-select.test.tsx`.
5. **Docs Migration:** Migrate `docs/build/markdown/shared.class.ts`, `docs/routes/components/markdown/*`, and all `docs/**/*.mdx` pages to standard flat Tailwind syntax.

### Phase 4: Transformer & Build Artifact Deletion
1. Delete `src/unocss/inject-compile-class.*`, `src/unocss/inject-prefix.*`, and `src/unocss/migrate-syntax.*`.
2. Remove `extendCN` from `src/shared/utils.ts` and public exports.
3. Remove `cls-variant` from `package.json`.
4. Update `src/utils.ts` to re-export `cn`, `cva`, `VariantProps`, `ClassValue`.
5. Update `tsdown.config.ts` to remove `tw3.css` and `tw4.css` generation and remove `transformerVariantGroup`.
6. Update `package.json` exports: remove `./tw3.css` and `./tw4.css`. Update peerDependency for Tailwind to `^4.0.0`.

### Phase 5: Verification & Quality Assurance
1. Run static token audit gate across `src/` and `docs/`.
2. Run single-evaluation tracking tests on JSX-capable props (`build-ssr-safe-component` protocol).
3. Run `nub run docs:preview` and verify production SSG rendering without console warnings.
4. Run full Vitest suite (`nub run test`) and typechecks (`nub run qa`).

---

## 6. Verification Gate & Test Matrix

| Verification Check | Target / Tool | Pass Criteria |
| :--- | :--- | :--- |
| **Token Audit Gate** | Node script on `src/**/*.{ts,tsx}` and `docs/**/*.{tsx,mdx}` | Zero matches for: `effect-`, `surface-overlay`, `hidden-hitless`, `style-`, `rm-side-b`, `b-1`, `b-[trblxy]`, `font-500`, `content-empty`, `not-dark:`, `not-last:`, `\$(?:mo\|p\|st\|s)-`, `var-(?:slider\|stepper\|progress)`, `ring-3px`, and variant groups `\w+:\([^)]+\)`. |
| **`cva.test.ts`** | Vitest / Unit | 100% pass on boolean variants, compound variant arrays, default variants, readonly configs, undefined handling, `cn` merging. |
| **`moraine-provider.test.tsx`**| JSDOM / Unit | 100% pass on global defaults, deep nested provider merge, slot overrides, precedence over CVA defaults. |
| **Tailwind v4 Consumer Test** | Tailwind v4 Compiler | Published-fixture build test asserting clean compilation of all component classes with `@source "moraine"`. |
| **UnoCSS Consumer Test** | UnoCSS Generator | Asserts clean CSS emission via `presetMoraine()` and `presetWind4()`. |
| **SSR Single Evaluation** | Node SSR + JSDOM | Getter-backed JSX prop assertions verify props evaluate exactly once during SSR and hydration. |
| **SSG Production Preview** | `nub run docs:preview` | Complete documentation preview build runs without CSS breakage, hydration warnings, or runtime errors. |
