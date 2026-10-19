---
name: Variant x Tone colors
overview: Rebuild Moraine's color derivation system around three layers. Palette roles split into surfaces (background, card, popover, muted, accent) and tones (primary, secondary, neutral, danger, info, success, warning). For default Light/Dark themes, Solid, Soft, Link, and Ghost buttons are dynamically verified by automated contrast tests to meet WCAG 2.2 AA (>= 4.5:1) against --background, while explicitly scoping that custom themes and arbitrary colored containers are excluded from automatic guarantees. The internal tone channel (providing generic hover:bg-tone-hover) is strictly separated from public theme roles (where per-role state tokens like hover:bg-primary-hover are deleted). Top-level mix knobs are properly wired through resolveThemes and merged per theme with strict nullish-coalescing (preserving 0 as 0%) and rigorous boundary validation (handling 0, 100, out-of-range, NaN, Infinity, null, and raw CSS strings). Tone ink establishes a clear 3-tier precedence (explicit token override > auto-derived mix > base fallback) with independent derivation-success verification. Button and Badge become variant x tone with zero compounds — every tone uses the same generic tone-channel formulas. Secondary is a co-equal brand tone to primary (supporting the entire variant matrix); the subtle variant is deleted in favor of soft; breaking changes and migration mapping live in PR descriptions, release notes, and commit messages (omitted from public docs). Legacy duplicate alpha fallbacks in Wind3 are intentionally removed with verified cascade degradation. ButtonGroup / ToggleButton / Pagination / FeedbackAction forward tone, tone props are split out to avoid DOM pollution, the per-role --mo-auto-* matrix is replaced, cross-preset parity and anti-drift integrity tests are added, and consumers plus tests are updated.
---

# Variant x Tone and a rebuilt color derivation system

## Problems with the current system

- `--mo-auto-X-{hover,active}` is a fixed matrix: 11 roles x 2 states = 22 custom properties declared on every element (`*, ::before, ::after`). Adding tint, border and text derivations on the same model would push that past 60.
- Tones (danger and the other status colors) and surfaces (accent, muted and so on) use the same state model, although their use cases differ completely.
- The configuration surface is heavy. Per-role states accept a string, a number or a callback, and there is also `colorStates` plus a separate `@supports` block for numeric overrides.
- Tinted backgrounds and borders are already written ad hoc as alpha modifiers (`bg-danger/15`, `ring-danger/20`), outside the token system.

## New model: three layers

```mermaid
flowchart TB
  subgraph palette [Palette, authored per theme]
    Surfaces["surfaces: background card popover muted accent"]
    Tones["tones: primary secondary neutral danger info success warning"]
    Lines["lines: border input ring, plus control backdrop"]
  end
  subgraph rules [Derivation rules, gated by @supports]
    StateRule["state: mix toward on-color by --mo-mix-hover / --mo-mix-active"]
    InkRule["ink: mix toward --foreground by --mo-mix-ink"]
    AlphaRule["wash and edge: alpha modifiers such as /12 and /40"]
  end
  subgraph channel [Tone channel, per component]
    ToneVars["--mo-tone, --mo-tone-foreground, --mo-tone-ink"]
  end
  Surfaces --> StateRule
  Tones --> InkRule
  Tones -->|"recipe tone variant"| ToneVars
  ToneVars --> StateRule
  ToneVars --> AlphaRule
```

### Visual Reference Matrix (Variant × Tone)

The visual behavior references modern component design systems (Nuxt UI / Radix):

- **`secondary` is co-equal to `primary`**: In Moraine, `secondary` is a first-class brand anchor Tone at the exact same level as `primary`. Both are configurable brand roles, share identical variant formulas, and support every variant in the matrix.
- **`subtle` is deleted**: The tinted variant is strictly named `soft` across all controls (`solid`, `soft`, `outline`, `ghost`, `link` for Button; `solid`, `soft`, `surface`, `outline` for Badge). The legacy `subtle` variant is removed completely.
- **Light/Dark theme luminance inversion**: The matrix indicates structural variant behavior. Light vs Dark modes may invert luminance (e.g. Light mode uses dark/vibrant fills with light text, while Dark mode `primary` and `secondary` use light fills with dark text). The structural variant formula remains strictly identical (`bg-tone text-tone-foreground`).

| Variant       | `primary` (Brand)                | `secondary` (Brand)              | `neutral` (Mono)                 | `success` (Status)               | `info` (Status)                  | `warning` (Status)               | `danger` (Status)                | Common Formula                                      |
| :------------ | :------------------------------- | :------------------------------- | :------------------------------- | :------------------------------- | :------------------------------- | :------------------------------- | :------------------------------- | :-------------------------------------------------- |
| **`solid`**   | Primary fill, contrast text      | Slate fill, contrast text        | Charcoal fill, contrast text     | Green fill, contrast text        | Blue fill, contrast text         | Amber fill, contrast text        | Red fill, contrast text          | `bg-tone text-tone-foreground border-transparent`   |
| **`soft`**    | Primary /12 tint, ink text       | Slate /12 tint, ink text         | Gray /12 tint, ink text          | Green /12 tint, ink text         | Blue /12 tint, ink text          | Amber /12 tint, ink text         | Red /12 tint, ink text           | `bg-tone/12 text-tone-ink border-transparent`       |
| **`outline`** | Transparent, primary /40 border  | Transparent, slate /40 border    | Transparent, neutral /40 border  | Transparent, green /40 border    | Transparent, blue /40 border     | Transparent, amber /40 border    | Transparent, red /40 border      | `border-tone/40 text-tone-ink bg-transparent`       |
| **`ghost`**   | Transparent, ink text, /10 hover | Transparent, ink text, /10 hover | Transparent, ink text, /10 hover | Transparent, ink text, /10 hover | Transparent, ink text, /10 hover | Transparent, ink text, /10 hover | Transparent, ink text, /10 hover | `border-transparent text-tone-ink hover:bg-tone/10` |
| **`link`**    | Transparent, ink text, underline | Transparent, ink text, underline | Transparent, ink text, underline | Transparent, ink text, underline | Transparent, ink text, underline | Transparent, ink text, underline | Transparent, ink text, underline | `text-tone-ink hover:underline border-transparent`  |

Core rules:

- **Brand tones vs built-in tones (consumers generally author `primary`, `secondary`, and `accent`):**
  - **Brand / Theme tones (`primary`, `secondary`)**: Primary is the central brand/accent color; secondary is the secondary brand/support tone — **co-equal in tier to `primary`**. In `DEFAULT_THEME_COLORS`, primary stays `rgb(23, 23, 23)` / `rgb(250, 250, 250)` light, `rgb(229, 229, 229)` / `rgb(23, 23, 23)` dark; secondary is a brand anchor like primary — a dark, high-contrast color in light mode (light in dark mode), just a different hue — so the generic alpha wash (`/12`), edge (`/40`) and ink formulas produce visible results. Today's `rgb(245, 245, 245)` secondary is a surface value and would wash out, so it is replaced. `<Button variant="solid" tone="secondary">` produces a dark slate brand-support fill (not the old light-gray secondary fill).
  - **Confirmed secondary defaults (slate brand anchor):** restrained low-chroma slate.
    - light: `secondary: { base: 'rgb(51, 65, 85)', foreground: 'rgb(248, 250, 252)' }` (slate-700 / slate-50)
    - dark: `secondary: { base: 'rgb(203, 213, 225)', foreground: 'rgb(15, 23, 42)' }` (slate-300 / slate-900)
    - Computed (sRGB approximation of the mixes; WCAG contrast):
      - light on white: solid fg/base 9.9:1; `bg-tone/12` ≈ `rgb(231, 232, 235)` (visible cool-gray wash, 1.23:1 vs white, same strength as neutral /12); `border-tone/40` ≈ `rgb(173, 179, 187)` (2.1:1, crisp edge); ink (25% toward `--foreground` `rgb(10,10,10)`) ≈ `rgb(41, 51, 66)` — 12.7:1 on white, 10.4:1 on the /12 wash.
      - dark on `rgb(10, 10, 10)`: solid fg/base 12.0:1; `bg-tone/12` ≈ `rgb(33, 34, 36)` (1.25:1, visible); `border-tone/40` ≈ `rgb(87, 91, 96)` (2.9:1); ink (25% toward `rgb(250,250,250)`) ≈ `rgb(215, 222, 231)` — 14.6:1 on background, 11.7:1 on the /12 wash.
  - **Built-in tones (`neutral`, `danger`, `info`, `success`, `warning`)**: Moraine supplies complete built-in defaults in `DEFAULT_THEME_COLORS`. `neutral` is Moraine's built-in monochrome/black-and-white tone (used out-of-the-box by neutral controls, default soft badge, outline/ghost buttons, pagination). Status tones (`danger`, `info`, `success`, `warning`) provide built-in feedback colors. Users rarely need to touch built-in tones, but may override them if needed.
  - Together with the surface role `accent`, users generally only need to define **`primary`**, **`secondary`**, and **`accent`** to theme an entire Moraine application.
  - All 7 tones are equal first-class citizens in the tone channel, sharing the exact same generic formulas (`--mo-tone`, `--mo-tone-foreground`, `--mo-tone-ink`) with zero special-cased class lists.

- **Moraine Tuned Status Palette:**
  - Built-in status colors (`danger`, `info`, `success`, `warning`) use Moraine's manually tuned custom palette, calibrated for visual balance, clarity, and harmony across light and dark modes.

#### Default Theme Semantic Palette Mapping

| Tone        | Theme | Base                 | Foreground Token     | Palette Notes   |
| :---------- | :---- | :------------------- | :------------------- | :-------------- |
| `primary`   | Light | `rgb(23, 23, 23)`    | `rgb(250, 250, 250)` | Neutral 900     |
| `primary`   | Dark  | `rgb(229, 229, 229)` | `rgb(23, 23, 23)`    | Neutral 200     |
| `secondary` | Light | `rgb(51, 65, 85)`    | `rgb(248, 250, 252)` | Slate 700       |
| `secondary` | Dark  | `rgb(203, 213, 225)` | `rgb(15, 23, 42)`    | Slate 300       |
| `neutral`   | Light | `rgb(23, 23, 23)`    | `rgb(250, 250, 250)` | Neutral 900     |
| `neutral`   | Dark  | `rgb(250, 250, 250)` | `rgb(23, 23, 23)`    | Neutral 50      |
| `danger`    | Light | `rgb(217, 89, 63)`   | `var(--background)`  | Warm red        |
| `danger`    | Dark  | `rgb(209, 115, 97)`  | `var(--background)`  | Muted coral red |
| `info`      | Light | `rgb(38, 122, 217)`  | `var(--background)`  | Vivid blue      |
| `info`      | Dark  | `rgb(99, 161, 233)`  | `var(--background)`  | Soft sky blue   |
| `success`   | Light | `rgb(25, 154, 74)`   | `var(--background)`  | Emerald green   |
| `success`   | Dark  | `rgb(75, 155, 104)`  | `var(--background)`  | Sage green      |
| `warning`   | Light | `rgb(174, 133, 9)`   | `var(--background)`  | Warm amber      |
| `warning`   | Dark  | `rgb(185, 152, 70)`  | `var(--background)`  | Golden amber    |

- **Tones are high-contrast anchors; Surfaces are pre-tinted backgrounds.**
  - A _Surface_ (like `muted: rgb(245, 245, 245)`) is an opaque, low-contrast background fill.
  - A _Tone_ in an alpha-tinting system (Radix / Nuxt UI) is the full-contrast color anchor whose alpha washes (`/12`, `/40`) generate visible surfaces, borders, and readable text.
  - The built-in `neutral` tone in `DEFAULT_THEME_COLORS` uses high-contrast anchor defaults matching the monochrome primary scale:
    - light: `neutral: { base: 'rgb(23, 23, 23)', foreground: 'rgb(250, 250, 250)' }`
      - `bg-tone/12` on white yields `~#e3e3e3` (a visible soft gray wash).
      - `border-tone/40` on white yields `~#a2a2a2` (a crisp outline border).
      - `hover:bg-tone/10` yields `~#e8e8e8` (a visible ghost hover wash).
      - `text-tone-ink` yields dark text with $> 10:1$ contrast.
    - dark: `neutral: { base: 'rgb(250, 250, 250)', foreground: 'rgb(23, 23, 23)' }`
      - `bg-tone/12` on the dark background yields `10 + 0.12 × 240 = rgb(38.8, 38.8, 38.8)` — matching today's dark secondary surface (`rgb(38, 38, 38)`).
  - Surfaces are `background`, `card`, `popover`, `muted`, `accent`. All 5 surfaces remain unchanged in `DEFAULT_THEME_COLORS` for static opaque background uses.
- **Tone channel:** the component writes 3 variables inline through recipe style keys. The tone's hover/active are derived generically on `*` from `--mo-tone`, so per-tone state tokens are no longer needed. The internal `tone` channel is strictly excluded from public theme configuration.

## Token details: [src/theme/tokens.ts](src/theme/tokens.ts)

Canonical tone list and tone type:

```ts
export const TONES = [
  'primary',
  'secondary',
  'neutral',
  'danger',
  'info',
  'success',
  'warning',
] as const
export type Tone = (typeof TONES)[number]
```

Surfaces (`background`, `card`, `popover`, `muted`, `accent`): `DEFAULT`, `foreground`, `hover`, `active`. Utility values keep the explicit-then-derived-then-base chain. The private derived variable is renamed `--mo-X-hover`:

```ts
hover: 'var(--accent-hover, var(--mo-accent-hover, var(--accent)))'
```

Tones (`primary`, `secondary`, `neutral`, `danger`, `info`, `success`, `warning`): `DEFAULT`, `foreground`, `ink`. **`-hover` / `-active` are removed.**

```ts
secondary: {
  DEFAULT: 'var(--secondary)',
  foreground: 'var(--secondary-foreground)',
  ink: 'var(--secondary-ink, var(--mo-secondary-ink, var(--secondary)))',
},
neutral: {
  DEFAULT: 'var(--neutral)',
  foreground: 'var(--neutral-foreground, var(--background))',
  ink: 'var(--neutral-ink, var(--mo-neutral-ink, var(--neutral)))',
},
danger: {
  DEFAULT: 'var(--danger)',
  foreground: 'var(--danger-foreground, var(--background))',
  ink: 'var(--danger-ink, var(--mo-danger-ink, var(--danger)))',
},
info: {
  DEFAULT: 'var(--info)',
  foreground: 'var(--info-foreground, var(--background))',
  ink: 'var(--info-ink, var(--mo-info-ink, var(--info)))',
},
success: {
  DEFAULT: 'var(--success)',
  foreground: 'var(--success-foreground, var(--background))',
  ink: 'var(--success-ink, var(--mo-success-ink, var(--success)))',
},
warning: {
  DEFAULT: 'var(--warning)',
  foreground: 'var(--warning-foreground, var(--background))',
  ink: 'var(--warning-ink, var(--mo-warning-ink, var(--warning)))',
},
```

### Tone ink 3-tier precedence & derivation contract

The fallback chain `var(--${tone}-ink, var(--mo-${tone}-ink, var(--${tone})))` defines a strict 3-tier hierarchy:

1. **Tier 1 (Explicit Token Override — `--${tone}-ink`):** Authored optionally in user theme configuration (`colors: { danger: { ink: '#b91c1c' } }`). When provided, it overrides all automatic calculations.
2. **Tier 2 (Automated Derivation — `--mo-${tone}-ink`):** Generated in the gated `@supports` block via `color-mix(in oklch, var(--${tone}), var(--foreground) var(--mo-mix-ink, 25%))`. This is the zero-config default for all tones. **`mix.ink` strictly tunes this Tier 2 value; it never overwrites a Tier 1 explicit token override.**
3. **Tier 3 (Runtime Resilience Fallback — `var(--${tone})`):** The base tone color itself, active computed fallback when `color-mix()` is unsupported or Tier 2 is absent, ensuring text is never unstyled.

**Independent Generation Verification:** While Tier 3 provides runtime fault-tolerance, automated tests must independently verify that:

- The gated `@supports` rule successfully generates `--mo-${tone}-ink` for every tone in both Light and Dark themes.
- Modifying `options.mix.ink` actually changes the calculated/emitted color value of `--mo-${tone}-ink` (not merely asserting the emission of `--mo-mix-ink`).
- Tier 1 explicit overrides take precedence over Tier 2 generated values.
- Fallback to base tone occurs strictly when Tier 1 is unset and Tier 2 is inactive.

### Tone channel vs Public theme color schema & State Tokens

To prevent confusion between public theme tokens and the internal component channel, Moraine maintains a strict boundary:

| Level                               | Roles / Identifiers                                                                    | Hover / Active Tokens                 | Architectural Purpose                                                                                                                                                                                        |
| :---------------------------------- | :------------------------------------------------------------------------------------- | :------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public Tone Roles**               | `primary`, `secondary`, `neutral`, `danger`, `info`, `success`, `warning`              | **Deleted** (No `-hover` / `-active`) | Public theme color tokens do NOT expose per-role state utilities (`hover:bg-primary-hover`) or per-role state variables (`--primary-hover`). The old 22-variable `--mo-auto-*` matrix is completely removed. |
| **Internal Component Tone Channel** | `tone` in `MORAINE_COLORS` (`bg-tone`, `hover:bg-tone-hover`, `active:bg-tone-active`) | **Retained as Generic Channel**       | Scoped exclusively to components consuming the tone channel. `--mo-tone-hover` and `--mo-tone-active` are single generic rules derived on `*` from `--mo-tone`. They are NOT per-role tokens.                |
| **Surface Roles**                   | `background`, `card`, `popover`, `muted`, `accent`                                     | **Retained per role**                 | Surfaces keep their explicit/derived hover/active states (`hover:bg-accent-hover`, `--accent-hover`).                                                                                                        |

The internal `tone` color group in `MORAINE_COLORS`:

```ts
tone: {
  DEFAULT: 'var(--mo-tone)',
  foreground: 'var(--mo-tone-foreground)',
  hover: 'var(--mo-tone-hover, var(--mo-tone))',
  active: 'var(--mo-tone-active, var(--mo-tone-hover, var(--mo-tone)))',
  ink: 'var(--mo-tone-ink)',
}
```

To prevent leaking the internal `tone` channel into public theme configuration:

1. **Theme color roles are explicitly defined:**
   ```ts
   export const THEME_COLOR_ROLES = [
     'background',
     'foreground',
     'primary',
     'secondary',
     'neutral',
     'card',
     'popover',
     'muted',
     'accent',
     'danger',
     'info',
     'success',
     'warning',
     'border',
     'input',
     'control',
     'backdrop',
     'ring',
   ] as const
   export type MoraineThemeColorRole = (typeof THEME_COLOR_ROLES)[number]
   ```
2. **`MoraineThemeColors` strictly excludes `tone`:**
   ```ts
   export type MoraineThemeColors = {
     [Name in MoraineThemeColorRole]?: MoraineColorEntry<MoraineColorMap[Name]>
   }
   ```
   Users cannot configure `tone` in `presetMoraine({ colors: { tone: ... } })` or theme overrides (`override: { light: { colors: { tone: ... } } }`).
3. **Theme CSS generation iterates over `THEME_COLOR_ROLES` only:** `createThemeCSS` ignores `tone`, ensuring `--tone` is never emitted into stylesheet root selectors.
4. **Tailwind preset** (`src/theme/tailwind.ts`) maps `MORAINE_COLORS` (including `tone`) for utility class resolution while keeping `tone` excluded from user theme customization types.

`TONE_VARS` holds the recipe style keys, derived directly from `MORAINE_COLORS` as a single source of truth without duplicated strings:

```ts
export const TONE_VARS: Record<Tone, Partial<Record<`--${string}`, string>>> = Object.fromEntries(
  TONES.map((tone) => [
    tone,
    {
      '--mo-tone': MORAINE_COLORS[tone].DEFAULT,
      '--mo-tone-foreground': MORAINE_COLORS[tone].foreground,
      '--mo-tone-ink': MORAINE_COLORS[tone].ink,
    },
  ]),
) as Record<Tone, Partial<Record<`--${string}`, string>>>
```

Declarations gated by `@supports (color: color-mix(in oklch, red, white))` on `*, ::before, ::after`. A zero-arg `createGatedColorDeclarations()` replaces `createStateColorDeclarations`:

- Surface states: 5 x 2 = 10, each `color-mix(in oklch, var(--X), <on-color> var(--mo-mix-hover, 8%))` and active `var(--mo-mix-active, 12%)`.
- Tone ink: 7, each `color-mix(in oklch, var(--X), var(--foreground) var(--mo-mix-ink, 25%))`.
- Tone channel states: 2, each `color-mix(in oklch, var(--mo-tone), var(--mo-tone-foreground) var(--mo-mix-hover, 8%))` and active `var(--mo-mix-active, 12%)`.
- 19 declarations in total, down from 22.

Why `--mo-tone-ink` references a role chain, while channel hover is derived on `*`:

- A `color-mix` value written inline can't degrade. On old browsers it becomes invalid at computed-value time and resolves to `unset`.
- So inline values may only contain fallback chains without `color-mix`, and every `color-mix` must stay in the gated `*` rule.

## Browser compatibility and intentional removal of alpha fallback

This design makes an **intentional browser compatibility decision** to rely on native `color-mix()` for alpha tint utilities rather than emitting duplicate solid fallbacks:

- In `unocss.ts`, remove the legacy duplicate solid color emission in the `moraine-color-alpha` variant (the custom `body(entries)` hook around lines 458–466). UnoCSS will emit a single clean `color-mix()` declaration.
- Update `docs/pages/docs/(overview)/unocss.mdx` (around line 180) to remove the claim that Wind3 keeps an unmodified solid color fallback.
- **Browser baseline:** Moraine's alpha utilities target modern browsers with `color-mix()` support (Baseline 2023: Chrome 111+, Safari 16.2+, Firefox 113+).
- **Verified cascade behavior on legacy browsers without `color-mix()` support:**
  - `soft` variant (`bg-tone/12`): `background-color: color-mix(...)` fails to parse; background is transparent (visually resembles `ghost`).
  - `outline` variant (`border-tone/40`): `border-color: color-mix(...)` fails to parse; per CSS cascade specification, `border-color` falls back to `currentColor` (matching the text color).
  - Text color (`text-tone-ink`): cleanly falls back to the base tone color (`var(--${tone})`) via the Tier 3 CSS `var()` fallback chain.
  - Surface and tone hover/active: fall back to the base color via CSS `var()` fallback chains.

## Preset configuration & input contracts (breaking)

[src/theme/unocss.ts](src/theme/unocss.ts) and [src/theme/defaults.ts](src/theme/defaults.ts):

- `DEFAULT_THEME_COLORS`:
  - Light mode: status tone bases calibrated to ensure WCAG 2.2 AA ($\ge 4.5:1$) against `--background`; foreground reuses `var(--background)`.
  - Dark mode: status tones use light/vibrant bases with dark text `rgb(23, 23, 23)` to guarantee contrast $\ge 4.5:1$.
- Theme authoring experience: consumers generally only need to define `primary`, `secondary`, and `accent` (and optionally surfaces such as `background` or `card`). Built-in tones (`neutral`, `danger`, `info`, `success`, `warning`) are fully provided by Moraine out-of-the-box.
- Surface entries: `string | { base?, foreground?, hover?, active? }`, where state values are CSS strings only.
- Tone entries: `string | { base?, foreground?, ink? }`.
- Remove `colorStates`, `MoraineColorStateValue` (numbers and callbacks), `MoraineColorStateResolverContext`, `DEFAULT_COLOR_STATES` and the separate numeric `@supports` block.

### Mix knobs and strict input contracts

Add `mix?: Partial<Record<'hover' | 'active' | 'ink', number | string>>` to `MorainePresetTheme` and `PresetMoraineOptions`.

Validation rules (`assertMixValue`):

| Input Value                           | Type      | Expected Behavior             | Rationale / Contract                                                                                                                       |
| :------------------------------------ | :-------- | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| `0`                                   | `number`  | **Valid.** Emits `0%`         | Preserved via `??` or `!== undefined`. `0%` means zero state shift (no color change).                                                      |
| `100`                                 | `number`  | **Valid.** Emits `100%`       | Full shift toward on-color or foreground.                                                                                                  |
| `1` to `99`                           | `number`  | **Valid.** Emits `${n}%`      | Standard percentage adjustment.                                                                                                            |
| `< 0` or `> 100`                      | `number`  | **Throws `RangeError`**       | Must be within 0..100.                                                                                                                     |
| `NaN`, `Infinity`, `-Infinity`        | `number`  | **Throws `RangeError`**       | Must be finite.                                                                                                                            |
| `'15%'`, `'calc(var(--custom) * 1%)'` | `string`  | **Valid.** Emits string as-is | Advanced raw CSS escape hatch. Passed directly to CSS without parsing; invalid syntax is left to browser CSS engine (no runtime auto-fix). |
| `null`                                | `null`    | **Throws `TypeError`**        | `null` is invalid; only `undefined` or omitted key triggers fallback.                                                                      |
| other types (`boolean`, `object`)     | `unknown` | **Throws `TypeError`**        | Unsupported type.                                                                                                                          |

Wiring and precedence:

- In `resolveThemes(options)`: `options.mix` is explicitly collected into `shared`:
  ```ts
  const shared: MorainePresetTheme = {
    radius: options.radius ?? '0.625rem',
    fontSize: options.fontSize ?? '1rem',
    spacing: options.spacing ?? '0.25rem',
    sidebarWidth: options.sidebarWidth,
    mix: options.mix,
  }
  ```
  This ensures top-level `presetMoraine({ mix: ... })` is applied to `:root` and `.dark` defaults.
- In `mergeTheme()`: shallow-merge `mix`: `mix: { ...base.mix, ...override?.mix }`.
- In `createThemeCSS()`: emit `--mo-mix-hover`, `--mo-mix-active`, `--mo-mix-ink` under each theme's selector if defined. Built-in formulas contain fallback defaults (`var(--mo-mix-hover, 8%)`, `var(--mo-mix-active, 12%)`, `var(--mo-mix-ink, 25%)`).
- **Strict Precedence:** `override[theme].mix` > `options.mix` (shared) > CSS variable fallback (`8%`, `12%`, `25%`).
- In `unocss.ts`, wind3 regex:
  - Add both `neutral` and `tone` to group names: `(background|foreground|primary|neutral|secondary|card|popover|muted|accent|danger|info|success|warning|border|input|control|ring|tone)`.
  - Add `ink` to state suffixes: `(?:-(foreground|hover|active|ink))?`.

[src/theme/tailwind.ts](src/theme/tailwind.ts): `addBase` uses the zero-arg gated declarations. Knobs are set by the user in CSS.

## Breaking changes & migration guide (for PR, Release Notes & Commit Message; omitted from public docs)

> [!NOTE]
> The migration guide below is published exclusively in the Pull Request description (PR #116), GitHub Release Notes / CHANGELOG, and git commit messages (`BREAKING CHANGE:` footer). Public documentation pages (`docs/`) remain clean and describe only the current system state.

This refactor introduces breaking changes for users upgrading from Moraine pre-alpha:

### 1. `secondary` semantic shift (Surface $\to$ Brand Tone)

- **Previous behavior:** `secondary` was an opaque light-gray surface background (`rgb(245, 245, 245)` in light, `rgb(38, 38, 38)` in dark).
- **New behavior:** `secondary` is now an active brand anchor Tone (confirmed Slate-700 in light, Slate-300 in dark by default), co-equal to `primary`.
- **CSS utility migration:**
  - `bg-secondary` now produces a dark slate background in light mode (brand tone).
  - To achieve the previous light-gray neutral surface fill, use **`bg-muted`** or **`bg-accent`**.
  - `text-secondary-foreground` resolves to high-contrast foreground on secondary.

### 2. Button and Badge API migration

| Old Component Usage            | New Component Usage                         | Visual Result                                                  |
| :----------------------------- | :------------------------------------------ | :------------------------------------------------------------- |
| `<Button variant="default">`   | `<Button variant="solid" tone="primary">`   | High-contrast primary brand fill                               |
| `<Button variant="secondary">` | `<Button variant="soft" tone="neutral">`    | Light-gray neutral wash (~#e3e3e3) matching old secondary look |
| `<Button variant="outline">`   | `<Button variant="outline" tone="neutral">` | Crisp neutral border with transparent bg                       |
| `<Button variant="ghost">`     | `<Button variant="ghost" tone="neutral">`   | Transparent bg with neutral hover wash                         |
| `<Button variant="danger">`    | `<Button variant="solid" tone="danger">`    | Solid red danger button                                        |
| `<Badge variant="subtle">`     | `<Badge variant="soft" tone="neutral">`     | Soft neutral tint (`subtle` variant deleted)                   |
| `<Badge variant="secondary">`  | `<Badge variant="soft" tone="neutral">`     | Soft neutral tint                                              |

### 3. Removed state tokens

- Per-role state utilities (`hover:bg-primary-hover`, `active:bg-danger-active`, etc.) and CSS variables (`--primary-hover`, `--danger-active`) are removed.
- Components use the internal `tone` channel (`hover:bg-tone-hover`, `active:bg-tone-active`).
- Custom templates use alpha utilities (`hover:bg-primary/90`) or tune `--mo-mix-hover` / `--mo-mix-active`.

## Components

### Button ([button.recipe.ts](src/element/button/button.recipe.ts), [button.style-types.ts](src/element/button/button.style-types.ts), [button.tsx](src/element/button/button.tsx))

- `variant`: `'solid' | 'soft' | 'outline' | 'ghost' | 'link'`
- `tone`: `Tone` (default `solid + primary`; `secondary` is co-equal to `primary`)
- `base.root`: replace `FOCUS_VISIBLE_CLASS` with `focus-visible:(outline-none ring-3 ring-tone/50 dark:ring-tone/40)`
- Variant classes (same formulas for every tone, including secondary and neutral — zero compounds):
  - `solid`: `bg-tone text-tone-foreground hover:bg-tone-hover active:bg-tone-active border-transparent`
  - `soft`: `bg-tone/12 text-tone-ink hover:bg-tone/18 active:bg-tone/24 border-transparent`
  - `outline`: `border-tone/40 text-tone-ink bg-transparent hover:bg-tone/8 active:bg-tone/12`
  - `ghost`: `border-transparent text-tone-ink hover:bg-tone/10 active:bg-tone/16`
  - `link`: `text-tone-ink underline-offset-4 hover:underline border-transparent`
- In `button.tsx`: add `'tone'` to `splitProps` so it is consumed by `useRecipe` and does not leak as an invalid HTML attribute on `<Dynamic ... {...rest}>`.

#### Button container guidelines

- On colored containers (e.g. inside an Alert, Callout, or colored banner):
  - **Prefer `solid`**: `solid` provides an opaque, self-contained background with guaranteed contrast against its own `--mo-tone-foreground`.
  - **`outline` is conditional**: `outline` has a transparent background (`bg-transparent text-tone-ink border-tone/40`). Because `--mo-tone-ink` is derived by mixing toward `--foreground` for standard neutral surfaces, its contrast against arbitrary colored backgrounds is not guaranteed. Only use `outline` when the text and border have been specifically verified to meet contrast requirements against that specific container background.
  - Transparent alpha tints (`soft`, `surface`, `ghost`, and `outline` hover) blend with colored container backgrounds and should generally be avoided on non-neutral containers.

### Badge ([badge.recipe.ts](src/element/badge/badge.recipe.ts), [badge.style-types.ts](src/element/badge/badge.style-types.ts), [badge.tsx](src/element/badge/badge.tsx))

- `variant`: `'solid' | 'soft' | 'surface' | 'outline'` (the old `subtle` variant is deleted)
- `tone`: `Tone` (default `soft + neutral`)
- Variant classes (same formulas for every tone, including secondary and neutral — zero compounds):
  - `solid`: `bg-tone text-tone-foreground border-transparent shadow-surface`
  - `soft`: `bg-tone/12 text-tone-ink border-transparent`
  - `surface`: `bg-tone/12 text-tone-ink border-tone/30`
  - `outline`: `bg-transparent text-tone-ink border-tone/40`
- The `subtle` variant is removed completely in favor of `soft`. Default `soft + neutral` uses the same generic soft formula on the neutral color role — not via special-case classes.
- In `badge.tsx`: add `'tone'` to `splitProps` so `styleProps` includes it and it does not leak into `rest` spread on the DOM.

### Forwarding components

- **ButtonGroup** ([button-group.style-types.ts](src/element/button-group/button-group.style-types.ts), [button-group.recipe.ts](src/element/button-group/button-group.recipe.ts), [button-group-context.ts](src/element/button-group/button-group-context.ts), [button-group.tsx](src/element/button-group/button-group.tsx)):
  - Add `tone?: ButtonStyleVariant['tone']` to `ButtonGroupStyleVariant`.
  - Add `tone: {}` to `buttonGroupRecipe.variants`.
  - Add `readonly tone?: ButtonT.Variant['tone'] | null` to `ButtonGroupContextValue`.
  - Provide `get tone() { return variants.tone }` in `ButtonGroupProvider`.
- **FeedbackAction & FeedbackActionButton** ([feedback.types.ts](src/overlay/base/feedback/feedback.types.ts), [feedback-action.tsx](src/overlay/base/feedback/feedback-action.tsx)):
  - Add `tone?: ButtonT.Variant['tone']` to `FeedbackAction` and `FeedbackActionButton`.
  - Pass `tone={props.action?.tone ?? props.tone}` to `<Button>`.
- **ToggleButton** ([toggle-button.recipe.ts](src/element/toggle-button/toggle-button.recipe.ts), [toggle-button.types.ts](src/element/toggle-button/toggle-button.types.ts), [toggle-button.tsx](src/element/toggle-button/toggle-button.tsx)):
  - `variant` / `activeVariant` move to new values (default `ghost` / `soft`).
  - `tone` / `activeTone` added (default `neutral` / `neutral`).
  - In `toggle-button.tsx`: add `'tone'` and `'activeTone'` to `splitProps`.
  - Pass `tone={pressed() ? variants.activeTone : variants.tone}` to `<Button>`.
- **Pagination** ([pagination.recipe.ts](src/navigation/pagination/pagination.recipe.ts), [pagination.style-types.ts](src/navigation/pagination/pagination.style-types.ts), [pagination.tsx](src/navigation/pagination/pagination.tsx)):
  - `variant` / `activeVariant` / `controlVariant` (defaults `ghost` / `outline` / `ghost`).
  - Add `tone` variant (default `neutral`).
  - Forward `tone={variants.tone}` to both page item `<Button>`s and prev/next control `<Button>`s.
- **Toast item** ([toast-item.tsx](src/overlay/toast/toast-item.tsx)):
  - Cancel button: `variant="soft" tone="neutral"` (today `variant="secondary"` at `toast-item.tsx:608`; soft neutral keeps the light-gray look instead of becoming a dark slate solid).
  - Action button: `variant="solid" tone="primary"` (or forwards `action.tone`).
  - Close button: `variant="ghost" tone="neutral"`.
- **AlertDialog** ([alert-dialog-entry.tsx](src/overlay/alert-dialog/alert-dialog-entry.tsx)):
  - Cancel button: `variant="outline" tone="neutral"`.
  - Action button: `variant="solid" tone={options().danger ? 'danger' : 'primary'}`.

### Consumers & Text Roles

- Menu danger item ([menu.recipe.ts](src/overlay/base/menu/menu.recipe.ts)): `text-danger` becomes `text-danger-ink`. Keep `bg-danger/15`.
- Field error ([field.recipe.ts](src/form/field/field.recipe.ts)): becomes `text-danger-ink`.
- Required indicators ([field.recipe.ts](src/form/field/field.recipe.ts), [checkbox.recipe.ts](src/form/checkbox/checkbox.recipe.ts), [switch.recipe.ts](src/form/switch/switch.recipe.ts), [checkbox-group.recipe.ts](src/form/checkbox-group/checkbox-group.recipe.ts)): migrate `text-danger` to `text-danger-ink`.
- Select-field duplicate tag input ([select-field.recipe.ts](src/form/shared/select/select-field.recipe.ts)): `data-duplicate:text-danger` becomes `data-duplicate:text-danger-ink`.
- input-number control button `text-primary-hover/active`: becomes `hover:text-primary/80 active:text-primary/70`. The `docs-a` shortcut in `docs/unocss.config.ts` is handled the same way.
- Invalid rings in `recipe-common` (`ring-danger/20`) are unchanged.

#### Audit: removed tone state tokens and old `secondary` usages (rg, 2026-10-17)

Tone `-hover` / `-active` tokens (`primary|secondary|danger|info|success|warning`) and `--mo-auto-*` disappear; `secondary` stops being a surface. Every hit outside `plan.md`:

Source (must change):

- `src/element/button/button.recipe.ts:42,45,57` — old `default` / `secondary` / `danger` variant strings using `bg-*-hover` / `bg-*-active` → replaced by the generic tone-channel variants (`hover:bg-tone-hover active:bg-tone-active`).
- `src/element/badge/badge.recipe.ts:31` / `src/element/badge/badge.style-types.ts:23` — old `subtle` variant → replaced by `soft`.
- `src/form/input-number/input-number.recipe.ts:18` — `active:text-primary-active hover:text-primary-hover` → `hover:text-primary/80 active:text-primary/70`.
- `src/overlay/toast/toast-item.tsx:608` — `variant="secondary"` → `variant="soft" tone="neutral"`.
- `src/theme/unocss.ts:437` — alpha regex lists `secondary` and `-(foreground|hover|active)`; update per the wind3 regex section (add `neutral|tone`, `ink`). `src/theme/unocss.ts:74,238,241` — `colorStates` option → removed (replaced by `mix`).
- `docs/unocss.config.ts:20` — `docs-a` `hover:text-primary-hover` → `hover:text-primary/80`.

Docs demos (`variant="secondary"` → `variant="soft" tone="neutral"`; `variant="subtle"` → `variant="soft"`), 21 hits:

- `docs/pages/components/(general)/button-group/separator.tsx:6,8`; `(general)/card/header-action.tsx:10`; `(general)/toggle-button/variants.tsx:10` (`variant="secondary" activeVariant="danger"` → `variant="soft" tone="neutral" activeVariant="solid" activeTone="danger"`).
- `(overlay)/popover/dismiss-control.tsx:14`; `(overlay)/dialog/scrollable-fullscreen.tsx:13,27`; `(form)/form/manual-error.tsx:36`; `(form)/input-group/actions.tsx:53`.
- `form-integration.tsx` submit buttons in `(form)/` select, checkbox-group, radio-group, checkbox, input-number, switch, input, file-upload, textarea, multi-select, combobox, slider.
- Badge demos using `variant="subtle"` → migrate to `variant="soft"` (or remove variant prop as default).

Docs prose:

- `docs/pages/docs/(styling)/design.mdx:20,33` (`bg-primary-hover`, `--<color>-hover/active` rows) → surfaces only; tones use `bg-tone-hover` / alpha.
- `docs/pages/docs/(styling)/customization.mdx:34` — `bg-danger hover:bg-danger-hover` → `<Button variant="solid" tone="danger">` or `bg-danger hover:bg-danger/90`.
- `docs/pages/docs/(overview)/unocss.mdx:253` and `docs/pages/docs/(overview)/tailwind.mdx:75` — `--primary-hover` state variable guidance → rewrite for surfaces + `--mo-mix-*` knobs. `unocss.mdx` `colorStates` mentions → `mix`.
- `docs/DESIGN.md:68` — `--primary-hover` / `--primary-active` → drop; mention derived tone states.
- `docs/shared/color-tokens.ts:14,16` (doc comments) and `docs/shared/color-tokens.test.ts:34,35,68` (`primary-hover` / `primary-active` tokens) → tone rows expose `ink`; state rows only for surfaces.

Tests / fixtures:

- `src/theme/tailwind.test.ts:138-145,219-251,1038-1043` and `src/theme/unocss.test.ts:229-265,532-546,565-580,620-652,705-721,782-805,832-848` — `--mo-auto-*`, tone `-hover/-active`, `colorStates` assertions → rewrite (gated declarations, `mix` knobs, `bg-secondary` stays valid as a tone utility).
- `test/consumer-fixtures/unocss.test.ts:148-153` — `--primary-hover` fixture → use a surface state (e.g. `--accent-hover`) or `--mo-mix-hover`.
- `test/types-default/index.tsx:625` — `variant="secondary"` → `variant="soft" tone="neutral"`; `test/types-default/preset-theme.ts` `colorStates` → `mix`.
- `src/element/button/button.test.tsx:186-187,1158,1183`; `src/element/button-group/button-group.test.tsx:199,221,316`; `src/element/toggle-button/toggle-button.test.tsx:51,58,237`; `src/overlay/toast/toast.test.tsx:123`; `src/form/input-number/input-number.test.tsx:1529-1530` — `bg-secondary` / `*-hover` class assertions → assert `bg-tone` / `bg-tone/12` plus `--mo-tone` style.
- `src/element/badge/badge.test.tsx:32,48` — `variant="subtle"` assertions → `variant="soft"`.

Counts: 123 matching lines across 41 files (including `colorStates`): 4 `src` files (button.recipe, input-number.recipe, toast-item, unocss.ts), 19 demo files (21 hits), 8 docs prose/tooling/config files, 10 test/fixture files. No `--mo-auto-secondary` reference exists outside tests.

## Docs and tests

- **Docs:**
  - Rewrite the color sections of [unocss.mdx](<docs/pages/docs/(overview)/unocss.mdx>) (Hover and active colors, configuration table, mix knobs, removal of duplicate Wind3 alpha fallback), [design.mdx](<docs/pages/docs/(styling)/design.mdx>) and [customization.mdx](<docs/pages/docs/(styling)/customization.mdx>).
  - Do NOT add migration guides or legacy mapping tables to docs (all migration details live strictly in git commit messages, PR descriptions, and release notes).
  - Update [docs/shared/color-tokens.ts](docs/shared/color-tokens.ts).
  - Migrate `variant="danger"`, `variant="secondary"`, and `variant="subtle"` across docs, demos and `test/types-default`.
- **Tests to add/update:**
  - **Palette & Semantic Integrity Suite:**
    - Tone definitions match the tuned Moraine status palette.
  - **Mix Input Contract & Validation Tests:**
    - Verify `0` is strictly preserved as `0%` (`--mo-mix-hover: 0%;`) via nullish-coalescing and not overwritten by falsy coercion.
    - Verify `100` outputs `100%`.
    - Verify numbers $< 0$, $> 100$, NaN, Infinity, and -Infinity throw `RangeError`.
    - Verify `null`, `boolean`, and unsupported non-number/non-string types throw `TypeError`.
    - Verify valid string expressions (e.g. `'15%'`, `'calc(var(--custom-mix) * 1%)'`) pass through as-is as raw CSS escape hatches.
  - **resolveThemes Inheritance & Precedence Tests:**
    - Verify top-level `presetMoraine({ mix: ... })` is inherited by `:root` and `.dark` defaults.
    - Verify theme-specific overrides take precedence over top-level shared mix.
  - **Tone Ink Precedence & Generation Verification Tests:**
    - Assert that the `@supports` rule successfully generates `--mo-${tone}-ink` for every tone in both Light and Dark themes, and components actively use it.
    - Assert that modifying `mix.ink` actually changes the calculated/emitted color value of `--mo-${tone}-ink` (not merely asserting the emission of `--mo-mix-ink`).
    - Assert that custom explicit Tier 1 overrides (e.g. `--danger-ink: #b91c1c`) take precedence over Tier 2 auto-generated `--mo-danger-ink`.
    - Assert that the fallback chain falls back to base tone (Tier 3) when ink tokens are unset and `@supports` rule is inactive.
  - **Cross-Preset UnoCSS / Tailwind Parity Tests:**
    - Verify that `bg-tone`, `text-tone-foreground`, `text-tone-ink`, `bg-tone/12`, `border-tone/40`, `hover:bg-tone-hover`, `active:bg-tone-active` generate identical semantic variable references in both UnoCSS and Tailwind.
  - **Color Map & Role Integrity Tests (Anti-Drift):**
    - Assert that every role in `THEME_COLOR_ROLES` exists in `MORAINE_COLORS` and is processed by `createThemeCSS`.
    - Assert that `tone` is strictly excluded from `THEME_COLOR_ROLES` and never emitted as `--tone:` in CSS.
    - Assert that every tone in `TONES` exists in `MORAINE_COLORS` with `DEFAULT`, `foreground`, `ink`, and has a corresponding entry in `TONE_VARS`.
    - Assert that `neutral` is mapped and resolves in both UnoCSS and Tailwind.
  - **UnoCSS Wind3 Alpha Tests:** Verify that `wind3: true` outputs a single `color-mix()` rule per alpha utility without duplicate solid fallbacks.
  - **Component Tests:** Update Button, Badge, ToggleButton, ButtonGroup, Toast, and AlertDialog tests to assert `--mo-tone` styles and new variant/tone combinations (asserting `soft` instead of `subtle`).
- Run `pnpm run qa` and `pnpm run test`.
